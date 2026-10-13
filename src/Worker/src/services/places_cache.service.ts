import { Env } from "../types";

export async function ensurePlaceRouteCaches(env: Env): Promise<void> {
  try {
    await env.DB.batch([
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS place_cache (
          id TEXT PRIMARY KEY,
          normalized_label TEXT NOT NULL,
          display_label TEXT NOT NULL,
          lat REAL,
          lng REAL,
          place_id TEXT,
          provider TEXT,
          hit_count INTEGER NOT NULL DEFAULT 1,
          last_used_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `),
      env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_place_cache_norm ON place_cache(normalized_label)
      `),
      env.DB.prepare(`
        CREATE TABLE IF NOT EXISTS route_cache (
          id TEXT PRIMARY KEY,
          origin_norm TEXT NOT NULL,
          dest_norm TEXT NOT NULL,
          origin_lat REAL,
          origin_lng REAL,
          dest_lat REAL,
          dest_lng REAL,
          distance_km REAL NOT NULL,
          duration_seconds REAL,
          provider TEXT,
          hit_count INTEGER NOT NULL DEFAULT 1,
          last_used_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        )
      `),
      env.DB.prepare(`
        CREATE INDEX IF NOT EXISTS idx_route_cache_pair ON route_cache(origin_norm, dest_norm)
      `)
    ]);
  } catch (e: any) {
    console.warn("ensurePlaceRouteCaches:", e?.message || e);
  }
}

export function normalizePlaceLabel(label: string): string {
  return String(label || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/[.,;]+/g, " ")
    .trim();
}

function roundCoord(n: number | null | undefined): number | null {
  if (n === null || n === undefined || !Number.isFinite(Number(n))) return null;
  return Math.round(Number(n) * 1e5) / 1e5;
}

export function routeCacheId(
  originNorm: string,
  destNorm: string,
  oLat?: number | null,
  oLng?: number | null,
  dLat?: number | null,
  dLng?: number | null
): string {
  const olat = roundCoord(oLat);
  const olng = roundCoord(oLng);
  const dlat = roundCoord(dLat);
  const dlng = roundCoord(dLng);
  if (olat !== null && olng !== null && dlat !== null && dlng !== null) {
    return `rc:${olat},${olng}|${dlat},${dlng}`;
  }
  return `rc:${originNorm}|${destNorm}`;
}

export async function searchPlaceCache(env: Env, q: string, limit = 5): Promise<Array<{
  source: "cache" | "trip";
  label: string;
  placeId: string | null;
  lat: number | null;
  lng: number | null;
}>> {
  await ensurePlaceRouteCaches(env);
  const like = `%${q}%`;
  const out: Array<{
    source: "cache" | "trip";
    label: string;
    placeId: string | null;
    lat: number | null;
    lng: number | null;
  }> = [];
  try {
    const { results } = await env.DB.prepare(`
      SELECT display_label, place_id, lat, lng
      FROM place_cache
      WHERE display_label LIKE ? COLLATE NOCASE OR normalized_label LIKE ?
      ORDER BY hit_count DESC, last_used_at DESC
      LIMIT ?
    `).bind(like, like, limit).all<any>();
    for (const r of results || []) {
      out.push({
        source: "cache",
        label: r.display_label,
        placeId: r.place_id || null,
        lat: r.lat ?? null,
        lng: r.lng ?? null
      });
    }
  } catch (e: any) {
    console.warn("place_cache search:", e?.message || e);
  }

  if (out.length < limit) {
    try {
      const need = limit - out.length;
      const { results } = await env.DB.prepare(`
        SELECT DISTINCT address AS label FROM (
          SELECT origin_address AS address FROM trips WHERE origin_address IS NOT NULL AND origin_address != ''
          UNION ALL
          SELECT destination_address FROM trips WHERE destination_address IS NOT NULL AND destination_address != ''
          UNION ALL
          SELECT origin FROM trips WHERE origin IS NOT NULL AND origin != ''
          UNION ALL
          SELECT destination FROM trips WHERE destination IS NOT NULL AND destination != ''
        )
        WHERE address LIKE ? COLLATE NOCASE
        LIMIT ?
      `).bind(like, need).all<any>();
      const seen = new Set(out.map((x) => normalizePlaceLabel(x.label)));
      for (const r of results || []) {
        const norm = normalizePlaceLabel(r.label);
        if (!norm || seen.has(norm)) continue;
        seen.add(norm);
        out.push({ source: "trip", label: r.label, placeId: null, lat: null, lng: null });
      }
    } catch (e: any) {
      console.warn("trip address search:", e?.message || e);
    }
  }
  return out.slice(0, limit);
}

export async function upsertPlaceCache(
  env: Env,
  input: {
    label: string;
    lat?: number | null;
    lng?: number | null;
    placeId?: string | null;
    provider?: string | null;
  }
): Promise<void> {
  const label = String(input.label || "").trim();
  if (!label) return;
  await ensurePlaceRouteCaches(env);
  const norm = normalizePlaceLabel(label);
  const id = `pc:${norm}`;
  const now = new Date().toISOString();
  try {
    const existing = await env.DB.prepare(`SELECT hit_count FROM place_cache WHERE id = ?`).bind(id).first<any>();
    if (existing) {
      await env.DB.prepare(`
        UPDATE place_cache
        SET display_label = ?, lat = COALESCE(?, lat), lng = COALESCE(?, lng),
            place_id = COALESCE(?, place_id), provider = COALESCE(?, provider),
            hit_count = hit_count + 1, last_used_at = ?
        WHERE id = ?
      `).bind(
        label,
        input.lat ?? null,
        input.lng ?? null,
        input.placeId ?? null,
        input.provider ?? null,
        now,
        id
      ).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO place_cache (id, normalized_label, display_label, lat, lng, place_id, provider, hit_count, last_used_at, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        id,
        norm,
        label,
        input.lat ?? null,
        input.lng ?? null,
        input.placeId ?? null,
        input.provider ?? null,
        now,
        now
      ).run();
    }
  } catch (e: any) {
    console.warn("upsertPlaceCache:", e?.message || e);
  }
}

export async function lookupRouteCache(
  env: Env,
  originLabel: string,
  destLabel: string,
  oLat?: number | null,
  oLng?: number | null,
  dLat?: number | null,
  dLng?: number | null
): Promise<{ distanceKm: number; durationSeconds: number | null; provider: string } | null> {
  await ensurePlaceRouteCaches(env);
  const originNorm = normalizePlaceLabel(originLabel);
  const destNorm = normalizePlaceLabel(destLabel);
  const id = routeCacheId(originNorm, destNorm, oLat, oLng, dLat, dLng);
  try {
    let row = await env.DB.prepare(`SELECT distance_km, duration_seconds, provider FROM route_cache WHERE id = ?`)
      .bind(id)
      .first<any>();
    if (!row && originNorm && destNorm) {
      row = await env.DB.prepare(`
        SELECT distance_km, duration_seconds, provider FROM route_cache
        WHERE origin_norm = ? AND dest_norm = ?
        ORDER BY last_used_at DESC LIMIT 1
      `).bind(originNorm, destNorm).first<any>();
    }
    if (!row) return null;
    const now = new Date().toISOString();
    await env.DB.prepare(`UPDATE route_cache SET hit_count = hit_count + 1, last_used_at = ? WHERE id = ? OR (origin_norm = ? AND dest_norm = ?)`)
      .bind(now, id, originNorm, destNorm)
      .run()
      .catch(() => null);
    return {
      distanceKm: Number(row.distance_km) || 0,
      durationSeconds: row.duration_seconds != null ? Number(row.duration_seconds) : null,
      provider: row.provider || "cache"
    };
  } catch (e: any) {
    console.warn("lookupRouteCache:", e?.message || e);
    return null;
  }
}

export async function upsertRouteCache(
  env: Env,
  input: {
    originLabel: string;
    destLabel: string;
    originLat?: number | null;
    originLng?: number | null;
    destLat?: number | null;
    destLng?: number | null;
    distanceKm: number;
    durationSeconds?: number | null;
    provider?: string | null;
  }
): Promise<void> {
  const originNorm = normalizePlaceLabel(input.originLabel);
  const destNorm = normalizePlaceLabel(input.destLabel);
  if (!originNorm || !destNorm || !(input.distanceKm > 0)) return;
  await ensurePlaceRouteCaches(env);
  const id = routeCacheId(originNorm, destNorm, input.originLat, input.originLng, input.destLat, input.destLng);
  const now = new Date().toISOString();
  try {
    const existing = await env.DB.prepare(`SELECT hit_count FROM route_cache WHERE id = ?`).bind(id).first<any>();
    if (existing) {
      await env.DB.prepare(`
        UPDATE route_cache
        SET distance_km = ?, duration_seconds = COALESCE(?, duration_seconds), provider = COALESCE(?, provider),
            hit_count = hit_count + 1, last_used_at = ?
        WHERE id = ?
      `).bind(input.distanceKm, input.durationSeconds ?? null, input.provider ?? null, now, id).run();
    } else {
      await env.DB.prepare(`
        INSERT INTO route_cache (
          id, origin_norm, dest_norm, origin_lat, origin_lng, dest_lat, dest_lng,
          distance_km, duration_seconds, provider, hit_count, last_used_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
      `).bind(
        id,
        originNorm,
        destNorm,
        input.originLat ?? null,
        input.originLng ?? null,
        input.destLat ?? null,
        input.destLng ?? null,
        input.distanceKm,
        input.durationSeconds ?? null,
        input.provider ?? null,
        now,
        now
      ).run();
    }
  } catch (e: any) {
    console.warn("upsertRouteCache:", e?.message || e);
  }
}
