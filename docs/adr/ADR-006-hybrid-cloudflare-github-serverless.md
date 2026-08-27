# ADR-006: 100 % Cloudflare Serverless Edge Runtime (GitHub nur als passive CI/CD-Pipeline)

## Status
**Akzeptiert** (Aktualisiert zur Beseitigung aller Laufzeitabhängigkeiten von GitHub)

## Kontext
Im ursprünglichen Konzeptentwurf wurde erwägt, schwere Hintergrundjobs (wie PDF-Generierung) über GitHub Actions Runner auszuführen. Dies erzeugte jedoch eine unerwünschte Laufzeitabhängigkeit von GitHub, Latenzen von 5–15 Sekunden und verhinderte einen vollkommen autarken Betrieb auf Cloudflare oder in lokalen Notfall-Containern.

## Entscheidung
Wir konsolidieren die gesamte Laufzeitarchitektur zu **100 % auf Cloudflare Serverless Edge** bzw. die lokale TypeScript/Node-Runtime:

1. **Cloudflare (Vollständige 24/7 Laufzeit – 0,00 € Fixkosten):**
   * **Pages / Web UI:** Blitzschnelle Single Page App zur Zeiterfassung, Reisekostenverwaltung, Dashboard-Controlling und Freigabesteuerung.
   * **Workers API:** Komplette Geschäftslogik, direkte PDF-Generierung, kryptografisches SHA-256 Hashing, Lexware REST-Integration, Webhook-Receiver und Resend-Mail-Dispatching.
   * **D1 (SQLite):** Relationale Speicherung aller Daten.
   * **R2 (Object Storage):** 10 GB kostenloser Beleg- und PDF-Speicher.
   * **Keine Laufzeitabhängigkeit von GitHub:** Das gesamte System arbeitet 24/7 unabhängig davon, ob GitHub online oder erreichbar ist.

2. **GitHub.com (Reines Code-Repository & CI/CD Deployment):**
   * Fungiert **ausschließlich** als Versionskontrollsystem und passiver Bereitstellungs-Mechanismus (GitHub Actions baut beim `git push` das Projekt und lädt es zu Cloudflare hoch).
   * Zur Laufzeit greifen weder Benutzer, Kunden noch Webhooks auf GitHub zu.

## Konsequenzen

### Positive Konsequenzen
* **0,00 Sekunden Latenz:** PDF-Generierung, Zeiterfassung und Kundenfreigaben erfolgen sofort in Echtzeit (< 100 ms) an der Cloudflare Edge.
* **100 % Autarkie:** Volle Funktionsfähigkeit auch bei Ausfällen von Drittanbietern oder im lokalen Docker Desktop Notfallbetrieb.
* **0,00 € Hostingkosten:** Dauerhaft im Cloudflare Free Tier.
* **Keine Token-Abhängigkeit zur Laufzeit:** Secrets liegen verschlüsselt in Cloudflare.

### Negative Konsequenzen / Trade-offs
* PDF-Layouts werden über standardisierte Web-/Canvas-/HTML-to-PDF-APIs im Worker bzw. Browser gerendert statt über schwere externe .NET-Bibliotheken (führt zu einfacherer Wartbarkeit und geringerer Komplexität).
