# Ortssuche & Auto-km (Realtime Address / Distance Lookup)

## Überblick

Beim Erfassen von Reisen:

1. Treffer aus Kundenstamm, lokalem `place_cache` und früheren Reise-Adressen
2. Externe Suche (Photon oder Google Places) nur bei Bedarf
3. Optional **Auto-km** (nur Pro): Google Routes → Straßenkilometer
4. Freitext und manuelle km bleiben immer gültig

## Provider Ortssuche

| Binding / Tenant | Quelle |
| :--- | :--- |
| `PLACES_PROVIDER=photon` oder Free | Photon (OpenStreetMap) |
| `PLACES_PROVIDER=google` und Pro | Google Places API (New) |

Ohne `GOOGLE_PLACES_API_KEY` fällt Google auf Photon zurück.

## Auto-km (Google Routes) — nur Pro

| Tarif | UI-Checkbox | Server |
| :--- | :--- | :--- |
| Free | sichtbar, **disabled**, Badge **Pro Feature** | `POST /places/distance` → 403 |
| Pro + PKW | enabled, Default **an** | Distance bei Start+Ziel (nach Cache) |
| Pro + anderes Verkehrsmittel | enabled, Default **aus**; Confirm mit Kostenhinweis | nur wenn Checkbox an |

Checkbox **aus** = kein Distance-Call = keine Routes-Usage. Server prüft zusätzlich Plan/Flag/Key.

Plattform-Default: Hub Admin → **Auto-km (Google Routes)**. Mandant: `tenant.autoKmEnabled` (API `/api/platform/admin/tenants/:slug/auto-km`). Binding `AUTO_KM_ENABLED`.

## Gleicher GCP-Key, getrennte Abrechnung

| | Places | Routes (km) |
| :--- | :--- | :--- |
| Google Cloud | Places API (New) | Routes API |
| ActaNex Secret | `GOOGLE_PLACES_API_KEY` (beide APIs am Key aktivieren) | dasselbe Secret |
| Stripe | Realtime Address Search Lookup + 2 Meter | **Realtime Distance Lookup** + 1 Meter |
| Inklusiv | 200 Events/Monat (Autocomplete bzw. Details) | 200 Events/Monat (eigenes Kontingent) |
| Overage | 1,5× Google Places-Liste | 1,5× Routes Essentials-Liste |

## Kostenminimierung (D1)

- `place_cache` — bei Auswahl/Details/Geocode upsert
- `route_cache` — bei Distance und beim Speichern einer Reise mit km
- Usage nur bei **externen Live-Hits** (nicht Cache / OSRM-Fallback)

## Google Places API Key im Platform Hub Admin

1. `https://hub.actanex.app/admin`
2. Kachel **Google Places API Key**
3. In GCP: **Places API (New)** + **Routes API** am Key aktivieren
4. Speichern → **GA-Rollout**

Alternativ: `npx wrangler secret put GOOGLE_PLACES_API_KEY --config wrangler.inbound.toml`

## Stripe

- Places: `scripts/setup-stripe-places-product.cjs`
- Routes: `scripts/setup-stripe-routes-distance-product.cjs`

Pro-Checkout hängt beide License- + Usage-Line-Items an.

## API (Open Worker)

- `GET /api/v1/places/config` — `autoKmAllowed`, `isPro`, …
- `GET /api/v1/places/suggest?q=&session=`
- `GET /api/v1/places/details?placeId=&session=`
- `POST /api/v1/places/remember` — Cache ohne Details
- `POST /api/v1/places/distance` — `{ origin, destination, …, roundTrip? }` (Pro only)

## Betriebshinweise

- Photon-Timeout 8 s; leere Suggest-Caches werden nicht wiederverwendet.
- Dienstreise mit Rückkehr=Start: UI kann `roundTrip` setzen (Hin+Rück).
