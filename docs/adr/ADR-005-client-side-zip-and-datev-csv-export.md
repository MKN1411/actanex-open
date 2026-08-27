# ADR-005: Client-seitiges ZIP-Packaging (JSZip) & DATEV/CSV-Export

## Status
**Akzeptiert**

## Kontext
Für Steuerberater, Jahresabschlüsse, Betriebsprüfungen und Offsite-Backups müssen hunderte PDFs und Belege gebündelt heruntergeladen werden. Ein serverseitiges Packen gigantischer ZIP-Dateien im Cloudflare Worker stößt auf CPU-Time-Limits (50ms im Free-Tier) und Memory-Limits (128 MB).

## Entscheidung
Wir teilen die Aufgaben optimal zwischen Backend und Frontend auf:
1. **Manifest-Endpunkte im Backend:**
   * `/api/v1/export/timesheet-manifest` und `/api/v1/export/tax-receipts-manifest` liefern schlanke JSON-Listen der gefilterten Belege und URLs.
2. **Client-seitiges ZIP-Streaming mit JSZip:**
   * Der Browser des Anwenders lädt die Dateien parallel herunter, bündelt sie lokal mit **JSZip** in Sekundenschnelle und generiert den ZIP-Download ohne CPU-Belastung des Workers.
3. **DATEV- & Excel-kompatibles CSV-Format:**
   * Der Endpunkt `/api/v1/export/accounting-data` liefert eine standardisierte CSV (Semikolon-separiert, Komma als Dezimaltrenner, UTF-8 mit BOM) für den direkten Import in DATEV Unternehmen Online oder Microsoft Excel.
4. **Disaster Recovery SQL-Dump:**
   * Der Endpunkt `/api/v1/export/full-disaster-recovery-sql` erzeugt einen vollständigen SQL-Dump aller SQLite-Tabellen für eine 1-Klick-Wiederherstellung.

## Konsequenzen
* **Positiv:** Keine CPU- oder Memory-Limits auf Cloudflare; extrem schnelle ZIP-Generierung direkt auf dem Rechner des Anwenders; universelle DATEV- und Excel-Kompatibilität.
* **Trade-off:** Bei sehr großen Datenmengen (> 500 Belege) hängt die Dauer vom lokalen Rechner und der Internetbandbreite des Nutzers ab.
