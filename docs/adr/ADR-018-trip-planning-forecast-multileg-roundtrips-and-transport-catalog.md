# ADR-018: Zukunfts-Planung (Kosten-Forecast), Rundreisen-Etappen und erweiterter Verkehrsmittel-Katalog

## Status
Akzeptiert (Accepted)

## Datum
27. August 2026

## Kontext & Problemstellung
Im betrieblichen Alltag von Freelancern, Consultants und Trainern treten bei der Reisekosten- und Spesenerfassung drei wesentliche Anforderungen auf:

1. **Reise-Vorausplanung & Budget-Forecast:**
   Reisen werden häufig Wochen oder Monate im Voraus geplant. Es besteht das Bedürfnis, geschätzte Reisekosten (Bahn-/Flugtickets, Hotel, VMA, Spesen) bereits im Vorfeld als Prognose (Forecast) im System zu erfassen, ohne dass diese vorzeitig in die GoBD-gesperrten Abrechnungen oder Leistungsnachweise einfließen. Nach tatsächlicher Durchführung der Reise soll eine nahtlose Übernahme zur finalen Belegerfassung mit einem Klick möglich sein.

2. **Mehrtägige Rundreisen mit Teilstrecken & Verkehrsmittel-Wechseln (Multi-Leg):**
   Dienstreisen bestehen in der Praxis oft aus komplexen Ketten (z. B. *Startort $\rightarrow$ Zwischenstopp 1 mit Vortrag/Meeting $\rightarrow$ Zwischenstopp 2 mit Weiterreise $\rightarrow$ Rückkehr*). Bisherige Erfassungsmasken bildeten lediglich eine lineare Einzelstrecke (Start $\rightarrow$ Ziel) ab. Teilstrecken erfordern individuelle Datumsangaben, Verkehrsmittel, Distanzen/Tickets, Aufenthaltszwecke und ggf. unterschiedliche Mandantenzuordnungen.

3. **Vollständige Taxonomie der Verkehrsmittel & VMA-Anspruch bei Null-Fahrtkosten:**
   Neben PKW und Bahn kommen Flugzeuge, Mietwagen, Taxis, Mitfahrten als Beifahrer, Mieträder/E-Scooter sowie Fahrten mit eigenem Fahrrad oder Fußwege vor. Nach steuerlichen Grundsätzen (§ 9 Abs. 4a EStG) begründen auch Verkehrsmittel ohne eigene Fahrtkostenerstattung (z. B. Beifahrer oder Fußweg) bei entsprechender Abwesenheitsdauer einen vollen Anspruch auf Verpflegungsmehraufwand (VMA). Zudem soll das primäre Standard-Verkehrsmittel (z. B. Bahn/ÖPNV) anpassbar konfigurierbar sein.

---

## Getroffene Entscheidungen

### 1. Zweistufiger Lebenszyklus: Geplant (Forecast) vs. Durchgeführt
* In der Tabelle `trips` wird das Feld `status` (`'Planned'` | `'Completed'` | `'Archived'`) eingeführt.
* **Geplante Reisen (`status = 'Planned'`):**
  * Werden als Forecast-Budget gespeichert (`total_planned_cost_net`).
  * Sind in der Übersicht mit einem Status-Badge `📅 Geplant (Forecast)` gekennzeichnet.
  * Werden von Kundenabrechnungen und Lexware-Buchungen ausgeschlossen, solange sie den Status `Planned` tragen.
* **1-Klick-Überführung:**
  * Über die Schaltfläche `[ 🚗 Als durchgeführt markieren & Belege erfassen ]` (`POST /api/v1/trips/:id/complete`) wird die Reise in den Status `Completed` überführt und das Erfassungsmodal für Beleg-Uploads geöffnet.
  * Jeder Statuswechsel wird im GoBD-Audit-Trail unveränderbar protokolliert.

### 2. Relation `trip_legs` für dynamische Rundreisen
* Für Rundreisen wird eine relationale 1:n-Tabelle `trip_legs` etabliert:
  * `(id, trip_id, leg_order, date_leg, start_location, destination_location, transport_type, distance_km, rate_per_km, travel_cost_net, layover_hours, layover_purpose, customer_id, project_id, is_billable_to_client, created_at_utc)`
* Das Web-Frontend bietet einen interaktiven Etappen-Builder mit flexibler Zeilenhinzufügung und automatischer Aufsummierung der Teilstreckenkosten.

### 3. Strukturierter Verkehrsmittel-Katalog & Priorisierung
Die Verkehrsmittel werden standardisiert und nach Nutzungsfrequenz geordnet:
1. `Train` – 🚆 **Bahn / ÖPNV (Ticket)** *(Projekt-Standard)*
2. `Flight` – ✈️ **Flugzeug (Ticket)**
3. `PersonalCar` – 🚗 **Eigener PKW** *(0,30 €/km)*
4. `RentalCar` – 🚕 **Mietwagen / Taxi (Beleg)**
5. `Passenger` – 👥 **Mitfahrt / Beifahrer** *(0,00 € Fahrtkosten, VMA aktiv)*
6. `RentalBike` – 🛴 **Miet-Fahrrad / E-Scooter (Quittung/Beleg)**
7. `BikeFoot` – 🚲 **Eigenes Fahrrad / Zu Fuß** *(0,00 € Fahrtkosten, VMA aktiv)*

### 4. Konfigurierbares Standard-Verkehrsmittel
* In `app_settings` wird das Feld `default_transport_type` hinterlegt.
* Im Konfigurations-Center (Karte 2) kann das Standard-Verkehrsmittel frei gewählt werden (Default: `Train`).
* Bei Anlage neuer Reisen wird dieses Verkehrsmittel automatisch vorausgewählt.

### 5. Mehrtägige VMA-Automatik mit Tagesauflistung
* Automatische VMA-Ermittlung nach § 9 Abs. 4a EStG:
  * Tag 1 (Anreisetag): 14,00 €
  * Zwischentage (24h Abwesenheit): jeweils 28,00 €
  * Letzter Tag (Abreisetag): 14,00 €
  * Frühstückskürzung: -5,60 € je Hotelübernachtung.
* Visuelle Aufschlüsselung der Einzeltage im UI zur transparenten Nachvollziehbarkeit.

---

## Rechtliche & steuerliche Hinweise (Disclaimer)
* **Keine Rechts- oder Steuerberatung:** Diese Software stellt ein technisches Organisations- und Dokumentationswerkzeug dar. Sie ersetzt keine steuerliche Beratung durch einen Steuerberater oder Wirtschaftsprüfer.
* **Keine Garantie oder Zusicherung:** Es wird keine Gewähr oder Garantie für die steuerrechtliche Anerkennung der berechneten Pauschalen, Abzüge oder Reisekosten durch Finanzbehörden oder Gerichte übernommen. Der Anwender bleibt eigenverantwortlich für die Prüfung und Richtigkeit der steuerlichen Angaben und Nachweise nach den jeweils geltenden Gesetzen (insb. EStG, GoBD, BMF-Schreiben).

---

## Konsequenzen
* **Positiv:**
  * Realistische Abbildung komplexer Reiseszenarien (Vortragsreisen, Konferenzen, mehrtägige Kundentermine).
  * Exakte Trennung zwischen zukünftiger Kostenplanung und GoBD-relevanter Ist-Abrechnung.
  * Höhere Flexibilität bei Verkehrsmitteln ohne manuelle Behelfsrechnungen.
* **Aufwand:**
  * Migration `0021_trip_legs_and_planning.sql` muss auf allen Instanzen (PROD, DEMO, OPEN) ausgeführt werden.
