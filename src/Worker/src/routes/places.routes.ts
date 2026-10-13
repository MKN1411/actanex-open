import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import {
  ensurePlaceRouteCaches,
  lookupRouteCache,
  searchPlaceCache,
  upsertPlaceCache,
  upsertRouteCache,
} from "../services/places_cache.service";

export type PlacesProvider = "photon" | "google";

export interface PlaceSuggestResult {
  source: "customer" | "photon" | "google" | "cache" | "trip";
  label: string;
  placeId: string | null;
  lat?: number | null;
  lng?: number | null;
}

const PHOTON_TIMEOUT_MS = 8000;
const GOOGLE_TIMEOUT_MS = 8000;
const ROUTES_TIMEOUT_MS = 8000;
const CACHE_TTL_SECONDS = 600;
const DE_BIAS = { lat: 51.16, lon: 10.45 };
const PLACES_USER_AGENT = "ActaNexPlaces/3.3.12 (https://hub.actanex.app; support@actanex.app)";
const KV_GOOGLE_PLACES_API_KEY = "platform:config:google_places_api_key";

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
}

/** Worker-Secret first; Hub Admin stores the same key in PLATFORM_KV for fleet rollout. */
async function resolveGooglePlacesApiKey(env: Env): Promise<string> {
  const fromSecret = String(env.GOOGLE_PLACES_API_KEY || "").trim();
  if (fromSecret) return fromSecret;
  if (!env.PLATFORM_KV) return "";
  try {
    return String((await env.PLATFORM_KV.get(KV_GOOGLE_PLACES_API_KEY)) || "").trim();
  } catch {
    return "";
  }
}

function monthKey(d = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

export async function resolvePlacesProvider(env: Env): Promise<{
  provider: PlacesProvider;
  plan: string;
}> {
  const override = (env.PLACES_PROVIDER || "").trim().toLowerCase();
  if (override === "photon" || override === "google") {
    return { provider: override, plan: (env.PLAN || "").trim().toLowerCase() || "unknown" };
  }

  let plan = (env.PLAN || "").trim().toLowerCase();
  let placesProvider = "";

  if (env.PLATFORM_KV && env.TENANT_NAME) {
    try {
      const conf = await env.PLATFORM_KV.get(`tenant:${env.TENANT_NAME}:config`, "json") as any;
      if (conf?.plan) plan = String(conf.plan).toLowerCase();
      if (conf?.placesProvider) placesProvider = String(conf.placesProvider).toLowerCase();
    } catch {
      /* ignore KV read errors */
    }
  }

  const paid = plan === "pro_self" || plan === "pro_managed" || plan === "pro_plus";
  if (placesProvider === "google" && paid) {
    return { provider: "google", plan };
  }
  if (placesProvider === "photon") {
    return { provider: "photon", plan };
  }
  return { provider: "photon", plan: plan || "free" };
}

function isPaidPlan(plan: string): boolean {
  const p = (plan || "").toLowerCase();
  return p === "pro_self" || p === "pro_managed" || p === "pro_plus";
}

/** Pro + platform/tenant flag + Maps key. Free never allowed. */
export async function resolveAutoKmAllowed(env: Env): Promise<{
  allowed: boolean;
  plan: string;
  reason: string;
}> {
  const { plan } = await resolvePlacesProvider(env);
  if (!isPaidPlan(plan) || plan === "free") {
    return { allowed: false, plan: plan || "free", reason: "pro_required" };
  }
  const binding = String(env.AUTO_KM_ENABLED || "").trim().toLowerCase();
  if (binding === "false" || binding === "0" || binding === "off") {
    return { allowed: false, plan, reason: "disabled" };
  }
  if (env.PLATFORM_KV && env.TENANT_NAME) {
    try {
      const conf = (await env.PLATFORM_KV.get(`tenant:${env.TENANT_NAME}:config`, "json")) as any;
      if (conf?.autoKmEnabled === false) {
        return { allowed: false, plan, reason: "tenant_opt_out" };
      }
      const plat = ((await env.PLATFORM_KV.get("platform:config:auto_km_enabled")) || "").trim().toLowerCase();
      if (plat === "false" || plat === "0" || plat === "off") {
        return { allowed: false, plan, reason: "platform_off" };
      }
    } catch {
      /* ignore */
    }
  }
  const apiKey = await resolveGooglePlacesApiKey(env);
  if (!apiKey) {
    return { allowed: false, plan, reason: "missing_key" };
  }
  if (binding === "true" || binding === "1" || binding === "on" || binding === "") {
    return { allowed: true, plan, reason: "ok" };
  }
  return { allowed: true, plan, reason: "ok" };
}

function formatCustomerLabel(c: any): string {
  const parts = [c.name, [c.street, [c.zip_code, c.city].filter(Boolean).join(" ")].filter(Boolean).join(", ")].filter(Boolean);
  return parts.join(", ");
}

function formatPhotonLabel(f: any): string {
  const p = f?.properties || {};
  const name = p.name || "";
  const street = [p.street, p.housenumber].filter(Boolean).join(" ");
  const city = [p.postcode, p.city || p.town || p.village || p.county].filter(Boolean).join(" ");
  return [name, street, city].filter(Boolean).join(", ") || p.label || "Unbekannter Ort";
}

async function searchCustomers(env: Env, q: string): Promise<PlaceSuggestResult[]> {
  const like = `%${q}%`;
  try {
    const { results } = await env.DB.prepare(`
      SELECT name, street, zip_code, city
      FROM customers
      WHERE is_archived = 0 AND is_active = 1
        AND id NOT LIKE 'cust_demo_%'
        AND (
          name LIKE ? COLLATE NOCASE
          OR street LIKE ? COLLATE NOCASE
          OR city LIKE ? COLLATE NOCASE
        )
      ORDER BY name ASC
      LIMIT 5
    `).bind(like, like, like).all<any>();

    return (results || []).map((c) => ({
      source: "customer" as const,
      label: formatCustomerLabel(c),
      placeId: null,
    }));
  } catch (e: any) {
    console.warn("places customer search failed:", e?.message || e);
    return [];
  }
}

async function fetchWithTimeout(url: string, init: RequestInit, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function searchPhoton(q: string): Promise<PlaceSuggestResult[]> {
  const url = new URL("https://photon.komoot.io/api/");
  url.searchParams.set("q", q);
  url.searchParams.set("lang", "de");
  url.searchParams.set("limit", "6");
  url.searchParams.set("lat", String(DE_BIAS.lat));
  url.searchParams.set("lon", String(DE_BIAS.lon));

  const res = await fetchWithTimeout(
    url.toString(),
    {
      method: "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": PLACES_USER_AGENT,
      },
    },
    PHOTON_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`Photon HTTP ${res.status}`);
  const data: any = await res.json();
  const features = Array.isArray(data?.features) ? data.features : [];
  return features
    .map((f: any) => {
      const coords = Array.isArray(f?.geometry?.coordinates) ? f.geometry.coordinates : null;
      const lng = coords && Number.isFinite(coords[0]) ? Number(coords[0]) : null;
      const lat = coords && Number.isFinite(coords[1]) ? Number(coords[1]) : null;
      return {
        source: "photon" as const,
        label: formatPhotonLabel(f),
        placeId: null as string | null,
        lat,
        lng,
      };
    })
    .filter((r) => !!r.label && r.label !== "Unbekannter Ort");
}

async function searchGoogleAutocomplete(env: Env, q: string, session: string): Promise<PlaceSuggestResult[]> {
  const key = await resolveGooglePlacesApiKey(env);
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY missing");

  // No includedRegionCodes lock — DE-only blocked AT/CH destinations (e.g. Hilton Wien).
  // languageCode "de" keeps German suggestion text for DACH/EU business travel.
  const body: any = {
    input: q,
    languageCode: "de",
  };
  if (session) body.sessionToken = session;

  const res = await fetchWithTimeout(
    "https://places.googleapis.com/v1/places:autocomplete",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
      },
      body: JSON.stringify(body),
    },
    GOOGLE_TIMEOUT_MS
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google autocomplete HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const suggestions = Array.isArray(data?.suggestions) ? data.suggestions : [];
  return suggestions
    .map((s: any) => {
      const pred = s?.placePrediction;
      if (!pred) return null;
      const label =
        pred.text?.text ||
        pred.structuredFormat?.mainText?.text ||
        pred.structuredFormat?.secondaryText?.text ||
        "";
      const placeId = pred.placeId || (typeof pred.place === "string" ? pred.place.replace(/^places\//, "") : null);
      if (!label) return null;
      return {
        source: "google" as const,
        label,
        placeId,
      };
    })
    .filter(Boolean) as PlaceSuggestResult[];
}

async function fetchGoogleDetails(
  env: Env,
  placeId: string,
  session: string
): Promise<{ formattedAddress: string; lat: number | null; lng: number | null }> {
  const key = await resolveGooglePlacesApiKey(env);
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY missing");

  const id = placeId.startsWith("places/") ? placeId : `places/${placeId}`;
  const url = new URL(`https://places.googleapis.com/v1/${id}`);
  if (session) url.searchParams.set("sessionToken", session);
  url.searchParams.set("languageCode", "de");

  const res = await fetchWithTimeout(
    url.toString(),
    {
      method: "GET",
      headers: {
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "formattedAddress,addressComponents,location",
      },
    },
    GOOGLE_TIMEOUT_MS
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google details HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const formattedAddress = data?.formattedAddress || "";
  if (!formattedAddress) throw new Error("Google details missing formattedAddress");
  const lat = data?.location?.latitude != null ? Number(data.location.latitude) : null;
  const lng = data?.location?.longitude != null ? Number(data.location.longitude) : null;
  return { formattedAddress, lat, lng };
}

async function recordPlacesUsage(env: Env, kind: "autocomplete" | "details"): Promise<void> {
  if (!env.PLATFORM_KV || !env.TENANT_NAME) return;
  const key = `places_usage:${env.TENANT_NAME}:${monthKey()}:${kind}`;
  try {
    const current = parseInt((await env.PLATFORM_KV.get(key)) || "0", 10) || 0;
    await env.PLATFORM_KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 24 * 45 });
  } catch (e: any) {
    console.warn("places usage record failed:", e?.message || e);
  }
}

async function recordRoutesUsage(env: Env): Promise<void> {
  if (!env.PLATFORM_KV || !env.TENANT_NAME) return;
  const key = `routes_usage:${env.TENANT_NAME}:${monthKey()}`;
  try {
    const current = parseInt((await env.PLATFORM_KV.get(key)) || "0", 10) || 0;
    await env.PLATFORM_KV.put(key, String(current + 1), { expirationTtl: 60 * 60 * 24 * 45 });
  } catch (e: any) {
    console.warn("routes usage record failed:", e?.message || e);
  }
}

async function computeGoogleRouteKm(
  env: Env,
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number
): Promise<{ km: number; durationSeconds: number | null }> {
  const key = await resolveGooglePlacesApiKey(env);
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY missing");
  const res = await fetchWithTimeout(
    "https://routes.googleapis.com/directions/v2:computeRoutes",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": key,
        "X-Goog-FieldMask": "routes.distanceMeters,routes.duration",
      },
      body: JSON.stringify({
        origin: { location: { latLng: { latitude: oLat, longitude: oLng } } },
        destination: { location: { latLng: { latitude: dLat, longitude: dLng } } },
        travelMode: "DRIVE",
        languageCode: "de-DE",
        units: "METRIC",
      }),
    },
    ROUTES_TIMEOUT_MS
  );
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`Google Routes HTTP ${res.status}: ${text.slice(0, 200)}`);
  }
  const data: any = await res.json();
  const route = Array.isArray(data?.routes) ? data.routes[0] : null;
  const meters = Number(route?.distanceMeters);
  if (!Number.isFinite(meters) || meters <= 0) throw new Error("Google Routes missing distance");
  let durationSeconds: number | null = null;
  const dur = route?.duration;
  if (typeof dur === "string" && dur.endsWith("s")) {
    durationSeconds = parseFloat(dur.slice(0, -1)) || null;
  }
  return { km: Math.round((meters / 1000) * 10) / 10, durationSeconds };
}

async function computeOsrmKm(
  oLat: number,
  oLng: number,
  dLat: number,
  dLng: number
): Promise<{ km: number; durationSeconds: number | null }> {
  const url = `https://router.project-osrm.org/route/v1/driving/${oLng},${oLat};${dLng},${dLat}?overview=false`;
  const res = await fetchWithTimeout(
    url,
    { method: "GET", headers: { Accept: "application/json", "User-Agent": PLACES_USER_AGENT } },
    ROUTES_TIMEOUT_MS
  );
  if (!res.ok) throw new Error(`OSRM HTTP ${res.status}`);
  const data: any = await res.json();
  const route = Array.isArray(data?.routes) ? data.routes[0] : null;
  const meters = Number(route?.distance);
  if (!Number.isFinite(meters) || meters <= 0) throw new Error("OSRM missing distance");
  return {
    km: Math.round((meters / 1000) * 10) / 10,
    durationSeconds: route?.duration != null ? Number(route.duration) : null,
  };
}

async function geocodeViaPhoton(q: string): Promise<{ lat: number; lng: number; label: string } | null> {
  const hits = await searchPhoton(q);
  const first = hits.find((h) => h.lat != null && h.lng != null);
  if (!first || first.lat == null || first.lng == null) return null;
  return { lat: first.lat, lng: first.lng, label: first.label };
}

async function cachedSuggest(
  cacheKey: string,
  loader: () => Promise<any>
): Promise<{ data: any; fromCache: boolean }> {
  try {
    const cache = (caches as any)?.default as Cache | undefined;
    if (cache) {
      const hit = await cache.match(new Request(cacheKey));
      if (hit) {
        const data = await hit.json();
        // Never reuse empty cache entries — they often come from timeouts/outages.
        if (Array.isArray(data) && data.length === 0) {
          /* fall through to live loader */
        } else {
          return { data, fromCache: true };
        }
      }
    }
  } catch {
    /* Cache API optional — never block live search */
  }

  const payload = await loader();

  // Only cache successful non-empty result sets.
  if (Array.isArray(payload) && payload.length > 0) {
    try {
      const cache = (caches as any)?.default as Cache | undefined;
      if (cache) {
        const res = new Response(JSON.stringify(payload), {
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `public, max-age=${CACHE_TTL_SECONDS}`,
          },
        });
        await cache.put(new Request(cacheKey), res.clone());
      }
    } catch {
      /* ignore cache put */
    }
  }

  return { data: payload, fromCache: false };
}

export async function handlePlacesRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

  if (path === "/api/v1/places/config" && method === "GET") {
    const { provider, plan } = await resolvePlacesProvider(env);
    const autoKm = await resolveAutoKmAllowed(env);
    const googleKey = await resolveGooglePlacesApiKey(env);
    return jsonResponse({
      provider,
      plan,
      googleConfigured: !!googleKey,
      autoKmAllowed: autoKm.allowed,
      autoKmReason: autoKm.reason,
      isPro: isPaidPlan(plan),
    });
  }

  if (path === "/api/v1/places/suggest" && method === "GET") {
    const qRaw = (url.searchParams.get("q") || "").trim();
    const session = (url.searchParams.get("session") || "").trim();
    await ensurePlaceRouteCaches(env);
    if (qRaw.length < 3) {
      const resolved = await resolvePlacesProvider(env);
      return jsonResponse({
        provider: resolved.provider,
        fallback: null,
        results: [],
      });
    }

    const { provider: preferred, plan } = await resolvePlacesProvider(env);
    let provider: PlacesProvider = preferred;
    let fallback: string | null = null;

    const customers = await searchCustomers(env, qRaw);
    const local = await searchPlaceCache(env, qRaw, 5);
    const localMapped: PlaceSuggestResult[] = local.map((r) => ({
      source: r.source,
      label: r.label,
      placeId: r.placeId,
      lat: r.lat,
      lng: r.lng,
    }));
    let external: PlaceSuggestResult[] = [];
    let externalError: string | null = null;

    const googleKey = await resolveGooglePlacesApiKey(env);
    const wantGoogle = preferred === "google" && !!googleKey && isPaidPlan(plan);
    const cacheUrl = new URL(request.url);
    cacheUrl.searchParams.delete("session");
    cacheUrl.searchParams.set("q", normalizeQuery(qRaw));
    cacheUrl.searchParams.set("provider", wantGoogle ? "google" : "photon");
    cacheUrl.searchParams.set("lang", "de");
    cacheUrl.searchParams.set("v", "3.3.12");

    const needExternal = customers.length + localMapped.length < 5;
    if (needExternal) {
      try {
        if (wantGoogle) {
          try {
            const cached = await cachedSuggest(cacheUrl.toString(), () => searchGoogleAutocomplete(env, qRaw, session));
            external = Array.isArray(cached.data) ? cached.data : [];
            if (!cached.fromCache) await recordPlacesUsage(env, "autocomplete");
            provider = "google";
          } catch (e: any) {
            const gErr = String(e?.message || e || "google_failed");
            console.warn("Google autocomplete failed, falling back to Photon:", gErr);
            externalError = gErr.slice(0, 240);
            try {
              external = await searchPhoton(qRaw);
              provider = "photon";
              fallback = "photon";
            } catch (pe: any) {
              external = [];
              provider = "photon";
              fallback = "photon";
              externalError = String(pe?.message || gErr || "external_search_failed").slice(0, 240);
            }
          }
        } else {
          if (preferred === "google" && !googleKey) {
            fallback = "photon";
            externalError = "GOOGLE_PLACES_API_KEY missing (secret+KV)";
          }
          const cached = await cachedSuggest(cacheUrl.toString(), () => searchPhoton(qRaw));
          external = Array.isArray(cached.data) ? cached.data : [];
          provider = "photon";
        }
      } catch (e: any) {
        console.warn("External places search failed:", e?.message || e);
        external = [];
        if (preferred === "google") fallback = "photon";
        provider = "photon";
        externalError = String(e?.message || "external_search_failed").slice(0, 240);
      }
    }

    const seen = new Set<string>();
    const results: PlaceSuggestResult[] = [];
    for (const r of [...customers, ...localMapped, ...external]) {
      const key = (r.label || "").trim().toLowerCase();
      if (!key || seen.has(key)) continue;
      seen.add(key);
      results.push(r);
      if (results.length >= 8) break;
    }
    const autoKm = await resolveAutoKmAllowed(env);
    return jsonResponse({
      provider,
      fallback,
      results,
      externalError,
      googleConfigured: !!googleKey,
      autoKmAllowed: autoKm.allowed,
    });
  }

  if (path === "/api/v1/places/details" && method === "GET") {
    const placeId = (url.searchParams.get("placeId") || "").trim();
    const session = (url.searchParams.get("session") || "").trim();
    if (!placeId) return errorResponse("placeId erforderlich", 400);

    const { provider, plan } = await resolvePlacesProvider(env);
    const googleKey = await resolveGooglePlacesApiKey(env);
    const canGoogle = provider === "google" && !!googleKey && isPaidPlan(plan);
    if (!canGoogle) {
      return errorResponse("Place Details nur mit Google Places verfügbar", 403);
    }

    try {
      const details = await fetchGoogleDetails(env, placeId, session);
      await recordPlacesUsage(env, "details");
      await upsertPlaceCache(env, {
        label: details.formattedAddress,
        lat: details.lat,
        lng: details.lng,
        placeId,
        provider: "google",
      });
      return jsonResponse({
        provider: "google",
        formattedAddress: details.formattedAddress,
        lat: details.lat,
        lng: details.lng,
      });
    } catch (e: any) {
      return errorResponse(e?.message || "Google Place Details fehlgeschlagen", 502);
    }
  }

  if (path === "/api/v1/places/remember" && method === "POST") {
    const body: any = await request.json().catch(() => ({}));
    const label = String(body.label || body.formattedAddress || "").trim();
    if (!label) return errorResponse("label erforderlich", 400);
    await upsertPlaceCache(env, {
      label,
      lat: body.lat != null ? Number(body.lat) : null,
      lng: body.lng != null ? Number(body.lng) : null,
      placeId: body.placeId || null,
      provider: body.provider || null,
    });
    return jsonResponse({ success: true });
  }

  if (path === "/api/v1/places/distance" && method === "POST") {
    const autoKm = await resolveAutoKmAllowed(env);
    if (!autoKm.allowed) {
      return errorResponse(
        autoKm.reason === "pro_required"
          ? "Auto-km ist ein Pro-Feature."
          : "Auto-km ist für diesen Mandanten nicht aktiv.",
        403
      );
    }

    const body: any = await request.json().catch(() => ({}));
    const originLabel = String(body.origin || body.originAddress || "").trim();
    const destLabel = String(body.destination || body.destAddress || "").trim();
    let oLat = body.originLat != null ? Number(body.originLat) : null;
    let oLng = body.originLng != null ? Number(body.originLng) : null;
    let dLat = body.destLat != null ? Number(body.destLat) : null;
    let dLng = body.destLng != null ? Number(body.destLng) : null;
    const roundTrip = body.roundTrip === true || body.roundTrip === 1 || body.roundTrip === "1";

    if (!originLabel || !destLabel) {
      return errorResponse("origin und destination erforderlich", 400);
    }

    await ensurePlaceRouteCaches(env);
    const cached = await lookupRouteCache(env, originLabel, destLabel, oLat, oLng, dLat, dLng);
    if (cached && cached.distanceKm > 0) {
      const km = roundTrip ? Math.round(cached.distanceKm * 2 * 10) / 10 : cached.distanceKm;
      return jsonResponse({
        km,
        oneWayKm: cached.distanceKm,
        roundTrip,
        provider: "cache",
        fromCache: true,
        durationSeconds: cached.durationSeconds,
      });
    }

    try {
      if (oLat == null || oLng == null) {
        const g = await geocodeViaPhoton(originLabel);
        if (g) {
          oLat = g.lat;
          oLng = g.lng;
          await upsertPlaceCache(env, { label: originLabel, lat: oLat, lng: oLng, provider: "photon" });
        }
      }
      if (dLat == null || dLng == null) {
        const g = await geocodeViaPhoton(destLabel);
        if (g) {
          dLat = g.lat;
          dLng = g.lng;
          await upsertPlaceCache(env, { label: destLabel, lat: dLat, lng: dLng, provider: "photon" });
        }
      }
      if (oLat == null || oLng == null || dLat == null || dLng == null) {
        return errorResponse("Koordinaten für Start/Ziel nicht ermittelbar", 422);
      }

      let oneWayKm = 0;
      let durationSeconds: number | null = null;
      let providerUsed = "google";
      let fallback: string | null = null;

      try {
        const r = await computeGoogleRouteKm(env, oLat, oLng, dLat, dLng);
        oneWayKm = r.km;
        durationSeconds = r.durationSeconds;
        await recordRoutesUsage(env);
      } catch (e: any) {
        console.warn("Google Routes failed, OSRM fallback:", e?.message || e);
        const r = await computeOsrmKm(oLat, oLng, dLat, dLng);
        oneWayKm = r.km;
        durationSeconds = r.durationSeconds;
        providerUsed = "osrm";
        fallback = "osrm";
      }

      await upsertRouteCache(env, {
        originLabel,
        destLabel,
        originLat: oLat,
        originLng: oLng,
        destLat: dLat,
        destLng: dLng,
        distanceKm: oneWayKm,
        durationSeconds,
        provider: providerUsed,
      });

      const km = roundTrip ? Math.round(oneWayKm * 2 * 10) / 10 : oneWayKm;
      return jsonResponse({
        km,
        oneWayKm,
        roundTrip,
        provider: providerUsed,
        fallback,
        fromCache: false,
        durationSeconds,
      });
    } catch (e: any) {
      return errorResponse(e?.message || "Distanzberechnung fehlgeschlagen", 502);
    }
  }

  return null;
}
