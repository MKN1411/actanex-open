# ADR-011: Zero-Code GitHub Actions & Cloudflare 1-Klick Bootstrapper

## Status
**Akzeptiert & Implementiert (v2.7.0)** – 22. August 2026

## Kontext & Problemstellung
Der *Freelancer Evidence & Billing Hub* richtet sich an freiberufliche IT-Architekten, Consultants und Freiberufler, die nicht zwingend über lokale Entwicklungsumgebungen (Node.js, npm, Wrangler CLI, Git-Terminal) verfügen oder ihre Abrechnungsplattform schnell, wartungsarm und ohne manuelle Konsolenbefehle aufsetzen möchten.

Vor v2.7.0 erforderte das Deployment:
1. Lokale Installation von Node.js LTS und des Cloudflare Wrangler CLI.
2. Manuelle Ausführung von `wrangler d1 create`, `wrangler r2 bucket create` und `wrangler deploy`.
3. Manuelles Einspielen von bis zu 18 SQL-Migrationsdateien über die Befehlszeile.

Dies stellte für nicht-technische Anwender eine signifikante Einstiegshürde dar und erhöhte das Risiko von Fehlkonfigurationen (z. B. vergessene Datenbank-Migrationen).

## Getroffene Entscheidung
Wir implementieren einen **vollständig browserbasierten Zero-Code 1-Klick Infrastruktur-Bootstrapper** auf Basis von **GitHub Actions Workflow Dispatch**:

1. **Vollständige Cloud-Orchestrierung:**
   * Der Anwender fork oder templated das Repository auf GitHub.
   * Er hinterlegt lediglich zwei GitHub Repository Secrets (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`) und optional seine Dienstschlüssel (`LEXWARE_API_KEY`, `RESEND_API_KEY`).
   * Der Workflow **`🚀 Cloudflare & GitHub 1-Click Infrastructure Bootstrapper`** (`bootstrap-infrastructure.yml`) wird direkt im GitHub-Browser-Tab gestartet.

2. **Least-Privilege Cloudflare API-Token-Architektur:**
   Für den Bootstrapper wird ein maßgeschneidertes, minimales API-Token-Berechtigungsprofil definiert:
   * **Account / D1 / Edit:** Automatische Erstellung der SQLite-Datenbank `evidence-hub-db`.
   * **Account / Workers Scripts / Edit:** Bereitstellung und Routing der REST-API `evidence-hub-worker`.
   * **Account / Workers R2 Storage / Edit:** Automatische Erstellung des Objektspeicher-Buckets `evidence-hub-storage`.
   * **Account / Cloudflare Pages / Edit:** Bereitstellung des Single-Page-Webfrontends `evidence-hub-web`.
   * **User / Memberships / Read:** Verifikation des Cloudflare-Accounts.

3. **Idempotente Datenbank- & Schema-Initialisierung:**
   * Der Workflow prüft die Existenz der D1-Datenbank und des R2-Buckets.
   * Alle 18 SQL-Migrationsstufen (`0001` bis `0018_billing_provider_and_datev_settings.sql`) werden transaktionssicher und idempotent eingespielt.
   * Die generierte D1-Datenbank-ID wird automatisch in `wrangler.jsonc` eingetragen und im Repository committet (`[skip ci]`).

4. **GitHub Step Summary & URL-Generierung:**
   * Nach erfolgreicher Bereitstellung erzeugt der Workflow eine formatierte Zusammenfassung (`$GITHUB_STEP_SUMMARY`) mit Direktlinks zur Live-Anwendung (`https://evidence-hub-web.pages.dev`), zum API-Healthcheck und den Initial-Zugangsdaten.

## Konsequenzen & Vorteile
* **Zero Installation:** 100 % browserbasierte Einrichtung in unter 90 Sekunden ohne Terminal.
* **Wartung & Updates:** Künftige Plattform-Updates können durch simples Ausführen des Deploy-Workflows oder Git-Merge aus dem Community-Upstream eingespielt werden.
* **Sicherheit:** Alle sicherheitsrelevanten Zugangsdaten verbleiben verschlüsselt in den GitHub Secrets des Anwenders; keine Passwörter oder API-Keys werden im Klartext abgelegt.
* **Strukturierte Datenintegrität:** Bereitstellung aller für GoBD-orientierte Dokumentationen erforderlichen Tabellenstrukturen, Hashes und Audit-Trails ab Erstinitialisierung.
