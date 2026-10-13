# Ortssuche (Realtime Address Lookup)

## Überblick

Beim Erfassen von Reisen schlägt ActaNex Orte vor:

1. Treffer aus dem eigenen Kundenstamm
2. Externe Suche (Photon oder Google Places)
3. Freitext bleibt immer gültig

## Provider

| Binding / Tenant | Quelle |
| :--- | :--- |
| `PLACES_PROVIDER=photon` oder Free | Photon (OpenStreetMap) |
| `PLACES_PROVIDER=google` und Pro | Google Places API (New) |

Ohne `GOOGLE_PLACES_API_KEY` fällt Google auf Photon zurück.

## Stripe-Produkt (Hub)

**ActaNex Realtime Address Search Lookup** (`prod_actanex_places_realtime`)

- 0 € Lizenzlinie ab Pro (wie Free SubDomain)
- Usage-Meter Autocomplete + Place Details
- Inklusiv: Google-Free-Pool 10.000 ÷ 50 Mandanten = **200 Events** je Typ / Mandant / Monat
- Mehrverbrauch: Google-Listenpreis × **1,5** (EUR, tax exclusive)

Siehe Hub `scripts/setup-stripe-places-product.cjs` und `scripts/stripe-places-product-output.json`.

## API (Open Worker)

- `GET /api/v1/places/suggest?q=&session=` (auth)
- `GET /api/v1/places/details?placeId=&session=` (auth, nur Google)

## Installer

Auswahl „Ortssuche“ setzt Binding `PLACES_PROVIDER`. Optional Secret `GOOGLE_PLACES_API_KEY`.
