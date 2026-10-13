# Reisekosten-Ortssuche — Implementierungsplan

**Dokumentversion:** 1.0  
**Stand:** 12. Oktober 2026  
**Status:** Implementiert in 3.3.5 (GA)  
**App-Stand bei Planung:** ActaNex Open 3.3.2  
**Umgesetzt:** ActaNex Open 3.3.5  
**Repo:** dieses Repository (`actanex-open`). Kein Handover und keine ADR wird durch diese Datei ersetzt.

---

## 1. Zweck

Beim Erfassen einer Reise tippen Nutzer oft keinen reinen Ortsnamen, sondern einen Hotelnamen plus Stadt („Hilton Hamburg“), eine Straße oder einen Firmennamen. Die Felder sind heute Freitext. Dieser Plan beschreibt eine Auswahlliste:

1. Zuerst Treffer aus dem eigenen Kundenstamm.
2. Danach eine externe Ortssuche.
3. Freitext bleibt immer gültig, auch ohne Auswahl.

Die externe Quelle hängt am bestehenden Tarif:

| Tarif (`plan`) | Externe Quelle |
| :--- | :--- |
| `free` | Photon (OpenStreetMap), kostenlos |
| `pro_self`, `pro_managed`, `pro_plus` | Google Places API (New) |

Es gibt kein neues Stripe-Produkt und keinen neuen Entitlement-Lookup-Key. Der Tarif, den der Hub schon führt, ist das Flag.

---

## 2. Warum dieses Repo

Die Maske, die Etappen und die API der App liegen hier. Der Platform Hub (`actanex-platform-hub`) stellt Mandanten bereit und kopiert später das gebaute Bundle. Die App-Änderung startet in diesem Repository.

Ein späterer Hub-Schritt, der nicht Teil dieser App-Änderung ist: das Secret `GOOGLE_PLACES_API_KEY` an die bezahlten Dispatch-Worker binden. Free-Instanzen rufen Google nicht auf.

---

## 3. Ist-Zustand

Live-Maske: `src/Web/views/travel.html`, geladen über `src/Web/js/core/router.js` (`viewPath: views/travel.html`).

| Feld | Id | Bedeutung |
| :--- | :--- | :--- |
| Startort und Anschrift | `#travel-origin` | Freitext |
| Zielort / Geschäftspartner | `#travel-dest` | Pflicht, Freitext |
| Rückkehrort | `#travel-return-dest` | oft gleich Start, sonst Freitext |
| Etappe Start / Ziel | `.leg-start`, `.leg-dest` | dynamische Zeilen |

Dieselbe Struktur im Bearbeiten-Dialog `src/Web/views/_modals.html`: `#edit-trip-origin`, `#edit-trip-dest`, `#edit-trip-return-dest` und Etappen im Edit-Modal.

Die Reise-Logik liegt in `src/Web/js/app_legacy_bundle.js`. Neue Etappenzeilen entstehen dort. Die Ortssuche darf sich nicht in diese Datei einhaken müssen: sie lauscht per Event-Delegation auf die Ids und Klassen, auch für Zeilen, die erst später ins DOM kommen.

Gespeichert wird der sichtbare Text in den bestehenden Spalten `origin`, `destination`, `origin_address`, `destination_address`, `return_location` sowie `trip_legs.start_location` und `trip_legs.destination_location` (`src/Worker/src/routes/trips_expenses.routes.ts`). Kein Schema-Wechsel, keine neuen Spalten für Koordinaten.

Kunden haben bereits `name`, `street`, `zip_code`, `city` (`customers` in `src/Worker/db/0000_complete_actanex_schema.sql`). Lexware-Kontakte landen in derselben Tabelle.

---

## 4. Entscheidungen

### 4.1 Free offen, bezahlt Google

Photon deckt Straße, Ort und viele in OpenStreetMap eingetragene Hotels ab. Beliebige Firmennamen fehlen oft. Google Places sortiert Hotelketten und Firmen zuverlässiger und liefert über Place Details eine kanonische Anschrift. Die Latenz ist im Normalfall ähnlich; Google ist stabiler. Die öffentliche Photon-Instanz hat kein SLA.

Nominatim (`nominatim.openstreetmap.org`) wird nicht verwendet. Deren Nutzungsregeln verbieten Autovervollständigung.

### 4.2 Stripe-Produkt Realtime Address Search Lookup

Ab Pro wird im Checkout die Produktlinie **ActaNex Realtime Address Search Lookup** mitgegeben (0 € License, analog Free SubDomain), plus metered Overage-Prices.

- Inklusivvolumen: Google-Free-Pool 10.000 ÷ 50 Mandanten = 200 Events je Typ / Mandant / Monat
- Mehrverbrauch: Google-Listenpreis × 1,5 (Usage-Meter)
- Deploy: Binding `PLACES_PROVIDER` und Tenant-Feld `placesProvider` (wie `STORAGE_MODE`)
- Live-Tarif und Provider kommen aus `PLATFORM_KV` `tenant:{slug}:config`, nicht nur aus dem Deploy-Binding `PLAN`

### 4.3 Google-Kosten bleiben klein

Preise laut Google-Maps-Platform-Preisliste, Places API (New), USD, Stand der Planung:

- Autocomplete Requests: 10.000 Ereignisse pro Monat kostenlos, danach 2,83 USD je 1.000 (bis 100.000), danach Staffel 2,27 / 1,70 / 0,85 / 0,21 USD.
- Place Details Essentials, nur wenn jemand einen Treffer wählt: 10.000 kostenlos, danach 5,00 USD je 1.000.
- Mit Session-Token zählen in einer abgeschlossenen Sitzung nur die ersten 12 Autocomplete-Aufrufe. Weitere sind gratis. Ohne Auswahl zählt jeder Aufruf.
- Debounce etwa 300 ms und mindestens 3 Zeichen: typisch 3 bis 6 Aufrufe pro Feld, nicht einer pro Tastendruck.

Field Mask bei Place Details strikt Essentials: `formattedAddress,addressComponents,location`. Kein `displayName`, kein Telefon, keine Website, keine Fotos. Sonst gilt Place Details Pro (17 USD je 1.000).

Der Key heißt `GOOGLE_PLACES_API_KEY`, nur als Worker-Secret, eingeschränkt auf Places API (New). Er steht nie im Browser.

---

## 5. Provider-Auflösung

Funktion `resolvePlacesProvider(env)` in der neuen Route:

1. `env.PLACES_PROVIDER` ist `photon` oder `google`: das gewinnt. Override für Self-Hosting und Tests, analog `STORAGE_MODE` / `FILE_STORAGE_MODE`.
2. Sonst, wenn `PLATFORM_KV` und `TENANT_NAME` da sind: `tenant:{TENANT_NAME}:config` als JSON, Feld `plan`.
3. Sonst `env.PLAN`.
4. Abbildung:
   - `free` oder leer oder unbekannt → `photon`
   - `pro_self`, `pro_managed`, `pro_plus` → `google`
5. Provider ist `google`, aber `GOOGLE_PLACES_API_KEY` fehlt, oder Google antwortet mit Fehler oder Timeout: Fallback auf Photon. Die JSON-Antwort setzt `provider` auf den tatsächlich genutzten Dienst und `fallback` auf `"photon"`, wenn umgeschaltet wurde.

Self-Hosting ohne Hub-KV: ohne Override und ohne `PLAN` bleibt Photon. Google nur, wenn Key und `PLACES_PROVIDER=google` oder ein bezahlter `PLAN` gesetzt sind.

---

## 6. API

Neue Datei `src/Worker/src/routes/places.routes.ts`. Dispatch in `src/Worker/src/index.ts` neben den anderen Modular-Routern, vor dem 404.

Beide Pfade liegen unter `/api/v1/` und stehen nicht in `isPublicRoute`. Sie laufen damit durch `getAuthenticatedUser` und antworten ohne Sitzung mit 401. Nicht in die öffentliche Allowlist aufnehmen.

### 6.1 `GET /api/v1/places/suggest?q=&session=`

- `q`: getrimmt. Unter 3 Zeichen: leere Liste, kein externer Aufruf.
- `session`: UUID der Eingabe-Sitzung, vom Client beim Fokus erzeugt. Nur für Google relevant. Photon ignoriert sie.

Ablauf:

1. Provider auflösen.
2. Kunden aus D1, gebundene Parameter, kein String-Concat in SQL. Aktive, nicht archivierte Kunden, `LIKE` auf `name`, `street`, `city`. Obergrenze 5. Diese Treffer rufen niemanden extern auf.
3. Externe Suche, Obergrenze etwa 6.
4. Mischen, Kunden zuerst, Gesamtdeckel 8. Doppelte Labels können bleiben; nicht aggressiv zusammenwerfen.

Antwortform:

```json
{
  "provider": "photon",
  "fallback": null,
  "results": [
    {
      "source": "customer",
      "label": "Mustermann GmbH, Musterstr. 1, 10115 Berlin",
      "placeId": null
    },
    {
      "source": "photon",
      "label": "Hilton Hamburg, Marseiller Straße 2, 20355 Hamburg",
      "placeId": null
    }
  ]
}
```

Google-Treffer tragen `source: "google"` und eine `placeId`. Kundentreffer haben keine `placeId`.

Cache über die Workers Cache API, etwa 10 Minuten. Schlüssel enthält normalisierte Query, Sprache `de` und den aufgelösten Provider. Session-Token gehört nicht in den Cache-Key.

**Photon:** `GET https://photon.komoot.io/api/?q=&lang=de&limit=6` plus Bias auf die Mitte Deutschlands (`lat`/`lon`). Kein Länder-Hartfilter, damit Auslandsreisen („Hilton Paris“) Treffer liefern. Kein `osm_tag`-Filter, damit Hotel, Straße und Ort zusammenkommen. Label aus Name, Straße, Hausnummer, PLZ, Ort, soweit vorhanden. Die Adresse steckt in dieser Antwort. Ein zweiter Aufruf entfällt. Timeout kurz; bei Fehler nur Kundentreffer, `provider` bleibt `photon`.

**Google:** `POST https://places.googleapis.com/v1/places:autocomplete` mit `languageCode=de`, dem Session-Token, weichem `locationBias` auf Deutschland, ohne `includedRegionCodes`, ohne Typ-Filter. Header `X-Goog-Api-Key`.

### 6.2 `GET /api/v1/places/details?placeId=&session=`

Nur nach Klick oder Enter auf einen Google-Treffer.

- Aufgelöster Provider ist nicht `google`: 403, kein Google-Aufruf. Photon-Auswahl braucht diese Route nicht.
- Sonst Place Details (New) mit derselben Session und der Essentials-Field-Mask `formattedAddress,addressComponents,location`.
- Der Client schreibt `formattedAddress` in das Eingabefeld.

Kunde ausgewählt: der Client übernimmt `label` direkt, ohne Details-Aufruf. Photon ebenso.

---

## 7. Oberfläche

Neue Datei `src/Web/js/modules/place-suggest.js`. Script-Tag in `src/Web/index.html` neben den anderen Modulen, vor `app_legacy_bundle.js`.

Delegation auf:

- `#travel-origin`, `#travel-dest`, `#travel-return-dest`
- `#edit-trip-origin`, `#edit-trip-dest`, `#edit-trip-return-dest`
- `.leg-start`, `.leg-dest` (Erfassen und Bearbeiten)

Verhalten:

- Fokus erzeugt eine neue Session-UUID für dieses Feld.
- Eingabe: Debounce 300 ms, ab 3 Zeichen `suggest`.
- Liste unter dem Feld, Tastatur: Pfeile, Enter, Escape.
- Enter oder Klick auf Google: `details`, dann formatierte Adresse ins Feld.
- Enter oder Klick auf Kunde oder Photon: `label` ins Feld.
- Schließen ohne Auswahl lässt den getippten Text stehen. Speichern der Reise ändert sich nicht.
- Unter der Liste der Pflicht-Hinweis aus `provider`: „© OpenStreetMap“ oder „Powered by Google“. Bei `fallback` den tatsächlich genutzten Dienst anzeigen.
- Rückkehrfeld, das per „= Startort“ readonly ist, nicht mit einer Liste überlagern, solange es gesperrt ist.

Platzhalter in `travel.html` am Ziel, zum Beispiel `Hilton Hamburg oder Musterstraße 12`. Bestehende Default-Werte der Demo nicht als Pflicht umdeuten.

---

## 8. Dateien

| Datei | Änderung |
| :--- | :--- |
| `src/Worker/src/routes/places.routes.ts` | neu |
| `src/Worker/src/index.ts` | Dispatch |
| `src/Worker/src/types/index.ts` | optionale Env-Felder `PLACES_PROVIDER`, `PLAN`, `TENANT_NAME`, `GOOGLE_PLACES_API_KEY` |
| `src/Web/js/modules/place-suggest.js` | neu |
| `src/Web/index.html` | Script-Tag |
| `src/Web/views/travel.html` | Platzhalter |

Nicht anfassen: `app_legacy_bundle.js`, Schema-SQL, Stripe-Katalog, Hub-Handover, bestehende ADRs.

---

## 9. Nicht in dieser Version

- Automatische Kilometer aus Koordinaten.
- Spalten für Breite und Länge.
- Neues Stripe-Produkt oder Lookup-Key `places_google`.
- Nominatim, OpenRouteService, HERE, Geoapify.
- Bundle-Kopie in den Hub und Deploy.
- Secret-Binding im Hub. Das folgt, wenn die App-Änderung steht und ein Rollout gewollt ist.

---

## 10. Prüfen nach der Umsetzung

- Free-Mandant: „Hilton Hamburg“ liefert Photon-Treffer und den OSM-Hinweis, kein Google-Aufruf.
- Bezahlter Mandant: derselbe Text liefert Google-Treffer; Auswahl ersetzt das Feld durch `formattedAddress`.
- Upgrade Free → Pro nur in KV, Binding `PLAN` bleibt `free`: die nächste Suche nutzt Google.
- `PLACES_PROVIDER=photon` auf einem bezahlten Mandanten erzwingt Photon.
- Fehlender Google-Key auf einem bezahlten Mandanten: Fallback Photon, Freitext weiter speicherbar.
- Eigener Kunde „Mustermann“ erscheint vor den externen Treffern.
- Neue Etappenzeile hat dieselbe Liste, ohne Änderung an `app_legacy_bundle.js`.
- Ohne Login: beide Routen 401.
- Auslandsreise „Hilton Paris“ liefert Treffer (kein Länder-Hartfilter).

---

## 11. Dokumenthistorie

| Version | Datum | Inhalt |
| :--- | :--- | :--- |
| 1.0 | 12. Oktober 2026 | Erste Fassung. Free = Photon, alle bezahlten Tarife = Google, Kunden immer zuerst, Tarif live aus `PLATFORM_KV`, Freitext bleibt. |
