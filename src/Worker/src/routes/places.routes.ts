import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";

export type PlacesProvider = "photon" | "google";

export interface PlaceSuggestResult {
  source: "customer" | "photon" | "google";
  label: string;
  placeId: string | null;
}

const PHOTON_TIMEOUT_MS = 8000;
const GOOGLE_TIMEOUT_MS = 5000;
const CACHE_TTL_SECONDS = 600;
const DE_BIAS = { lat: 51.16, lon: 10.45 };
const PLACES_USER_AGENT = "ActaNexPlaces/3.3.8 (https://hub.actanex.app; support@actanex.app)";

function normalizeQuery(q: string): string {
  return q.trim().toLowerCase().replace(/\s+/g, " ");
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
    .map((f: any) => ({
      source: "photon" as const,
      label: formatPhotonLabel(f),
      placeId: null as string | null,
    }))
    .filter((r) => !!r.label && r.label !== "Unbekannter Ort");
}

async function searchGoogleAutocomplete(env: Env, q: string, session: string): Promise<PlaceSuggestResult[]> {
  const key = env.GOOGLE_PLACES_API_KEY;
  if (!key) throw new Error("GOOGLE_PLACES_API_KEY missing");

  const body: any = {
    input: q,
    languageCode: "de",
    locationBias: {
      circle: {
        center: { latitude: DE_BIAS.lat, longitude: DE_BIAS.lon },
        radius: 500000.0,
      },
    },
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

async function fetchGoogleDetails(env: Env, placeId: string, session: string): Promise<{ formattedAddress: string }> {
  const key = env.GOOGLE_PLACES_API_KEY;
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
  return { formattedAddress };
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

  if (path === "/api/v1/places/suggest" && method === "GET") {
    const qRaw = (url.searchParams.get("q") || "").trim();
    const session = (url.searchParams.get("session") || "").trim();
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
    let external: PlaceSuggestResult[] = [];
    let externalError: string | null = null;

    const wantGoogle = preferred === "google" && !!env.GOOGLE_PLACES_API_KEY && plan !== "free";
    const cacheUrl = new URL(request.url);
    cacheUrl.searchParams.delete("session");
    cacheUrl.searchParams.set("q", normalizeQuery(qRaw));
    cacheUrl.searchParams.set("provider", wantGoogle ? "google" : "photon");
    cacheUrl.searchParams.set("lang", "de");
    // Bust stale empty timeout caches from 3.3.5–3.3.7 (2.5s Photon abort).
    cacheUrl.searchParams.set("v", "3.3.8");

    try {
      if (wantGoogle) {
        try {
          const cached = await cachedSuggest(cacheUrl.toString(), () => searchGoogleAutocomplete(env, qRaw, session));
          external = Array.isArray(cached.data) ? cached.data : [];
          if (!cached.fromCache) await recordPlacesUsage(env, "autocomplete");
          provider = "google";
        } catch (e: any) {
          console.warn("Google autocomplete failed, falling back to Photon:", e?.message || e);
          try {
            external = await searchPhoton(qRaw);
            provider = "photon";
            fallback = "photon";
          } catch (pe: any) {
            external = [];
            provider = "photon";
            fallback = "photon";
            externalError = pe?.message || e?.message || "external_search_failed";
          }
        }
      } else {
        if (preferred === "google" && !env.GOOGLE_PLACES_API_KEY) {
          fallback = "photon";
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
      externalError = e?.message || "external_search_failed";
    }

    const results = [...customers, ...external].slice(0, 8);
    return jsonResponse({
      provider,
      fallback,
      results,
      externalError,
      googleConfigured: !!env.GOOGLE_PLACES_API_KEY,
    });
  }

  if (path === "/api/v1/places/details" && method === "GET") {
    const placeId = (url.searchParams.get("placeId") || "").trim();
    const session = (url.searchParams.get("session") || "").trim();
    if (!placeId) return errorResponse("placeId erforderlich", 400);

    const { provider, plan } = await resolvePlacesProvider(env);
    const canGoogle = provider === "google" && !!env.GOOGLE_PLACES_API_KEY && plan !== "free";
    if (!canGoogle) {
      return errorResponse("Place Details nur mit Google Places verfügbar", 403);
    }

    try {
      const details = await fetchGoogleDetails(env, placeId, session);
      await recordPlacesUsage(env, "details");
      return jsonResponse({
        provider: "google",
        formattedAddress: details.formattedAddress,
      });
    } catch (e: any) {
      return errorResponse(e?.message || "Google Place Details fehlgeschlagen", 502);
    }
  }

  return null;
}
