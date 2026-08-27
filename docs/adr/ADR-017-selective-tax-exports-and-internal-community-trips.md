# ADR-017: Selektive Steuerberater-Exporte und interne Dienstreisen ohne Dummy-Kunde

## Status
Akzeptiert (Accepted)

## Datum
24. August 2026

## Kontext & Problemstellung
1. **Selektiver Datenexport fuer Steuerberatung:** Bei Monatsabschluessen oder Nachpruefungen durch den Steuerberater muessen haeufig gezielt einzelne Belege statt des gesamten Monatsdatenbestands exportiert werden.
2. **Interne Dienstreisen & Community-Vortraege (MCT / Konferenzen / Fortbildung):** Vortraege auf Konferenzen, User Groups oder Fachmessen finden haeufig ohne direkten Kundenbezug statt. Hotelkosten werden zudem oft direkt vom Veranstalter getragen (0,00 Euro fuer den Freelancer). Bisher erzwang das System die Auswahl eines Kunden/Projekts, was zur Anlage unerwuenschter Dummy-Kunden fuehrte.

## Getroffene Entscheidungen

### 1. Checkbox-basierter selektiver Export
* Die Beleguebersicht erhaelt eine Master-Checkbox `[x] Alle/Keine` im Tabellenkopf sowie Einzel-Checkboxen in jeder Zeile.
* Ein Live-Badge `(x ausgewaehlt)` zeigt die Anzahl der selektierten Belege an.
* Saemtliche Export-Formate verarbeiten ausschliesslich die aktiv markierten Datensaetze:
  * **CSV-Export:** Erzeugt ein selektives Belegjournal.
  * **DATEV EXTF 700:** Filtert die operationalen Belege per SQL `AND v.id IN (...)` vor der EXTF-Generierung.
  * **GoBD-ZIP-Archiv:** Buendelt nur die ausgewaehlten Belege inklusive selektivem Manifest und Pruefjournal.

### 2. Entkopplung von Kunde und Projekt bei Reisekosten
* In der Tabelle `trips` und im Endpoint `POST /api/v1/trips` ist `project_id` ab sofort optional (`nullable`).
* Standardoption in der Benutzeroberflaeche: `-- Kein Kunde / Interne Reise (Community, MCT, Vortrag, Fortbildung) --`.
* Alle Reisekosten (Bahntickets, Fahrtkosten, VMA-Pauschalen) fliessen zu 100 % in die EUeR-Betriebsausgaben (SKR04-Konten `4673`, `4668`, `4674`), ohne dass ein Kunden-Leistungsnachweis beruehrt wird.
* Bei vom Veranstalter bezahltem Hotel (0,00 Euro Kosten) kann die gesetzliche Fruehstueckskuerzung um `-5,60 Euro` je Nacht (Paragraph 9 Abs. 4a EStG) separat aktiviert werden.

## Konsequenzen
* **Positiv:** Hoechste Flexibilitaet im Datenaustausch mit der Steuerkanzlei und naturgetreue Abbildung des Alltags von Microsoft Certified Trainern und Speakern ohne Dummy-Daten.
