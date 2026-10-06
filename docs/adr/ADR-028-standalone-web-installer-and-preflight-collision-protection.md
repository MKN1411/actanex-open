# ADR-028: Standalone Web-Installer, Pre-Flight Kollisionsschutz & Integriertes Worker-Bundling

## Status
**Akzeptiert & Produktiv umgesetzt** (6. Oktober 2026)

## Kontext & Problemstellung
Für den Betrieb von ActaNex Open (Community Edition) mussten Anwender bisher entweder:
1. Lokale Entwicklertools (Git, Node.js, Wrangler, npm) installieren und Konsolenbefehle ausführen, oder
2. Ein GitHub Actions Workflow-Setup durchführen, welches Administratorrechte und GitHub-Secrets-Konfiguration voraussetzt.

Für nicht-technische Endanwender stellte dies eine erhebliche Einstiegshürde dar. Zudem traten bei manuellen Installationen immer wieder Namenskollisionen auf (z. B. wenn eine D1-Datenbank oder ein R2-Bucket mit demselben Namen im Cloudflare-Account bereits existierte), was zu kryptischen API-Abbrüchen führte. Des Weiteren führte das getrennte Hosting von Frontend (Cloudflare Pages) und Backend (Cloudflare Workers) zu CORS-Problemen und erhöhter Administrationskomplexität.

## Architekturentscheidung

### 1. 1-Klick Web-Installer via Cloudflare REST API
* Ein rein browserbasierter Setup-Wizard (`installer.html` und `/api/v1/installer/*`) führt die gesamte Bereitstellung durch.
* Der Anwender benötigt lediglich seine Cloudflare **Account-ID** und ein Standard-**API-Token** (mit Berechtigungen für Workers, D1 und R2).
* Der Installer führt die Bereitstellung vollautomatisch durch:
  * Erstellung der D1-SQLite-Datenbank (`POST /accounts/{id}/d1/database`)
  * Erstellung des R2-Speicher-Buckets (`PUT /accounts/{id}/r2/buckets/{name}`)
  * Einspielen des vollständigen Datenbankschemas (`full_schema_combined.sql`)
  * Bereitstellung und Aktivierung des Worker-Skripts mit D1- und R2-Bindings

### 2. Pre-Flight Kollisionsschutz & Token-Validierung
* Vor der eigentlichen Bereitstellung prüft der Endpoint `POST /api/v1/installer/check-conflicts` in Echtzeit:
  * Existiert bereits ein Worker-Skript mit dem gewählten Namen?
  * Existiert bereits eine D1-Datenbank mit dem Namen?
  * Existiert bereits ein R2-Bucket mit dem Namen?
* Bei bestehenden Ressourcen wird der Anwender frühzeitig gewarnt und kann eine saubere Namensanpassung vornehmen, bevor irreversible Ressourcen angelegt werden.

### 3. Reale Subdomain-Erkennung (`workers.dev`)
* Cloudflare weist jedem Account eine benutzerdefinierte Subdomain zu (`<subdomain>.workers.dev`).
* Der Installer fragt diese Subdomain über `GET /accounts/{id}/workers/subdomain` direkt von der Cloudflare-API ab, anstatt die Account-ID als URL-Präfix zu vermuten.
* Nach erfolgreicher Installation erhält der Anwender direkt die korrekte, klickbare Ziel-URL (z. B. `https://actanex-worker.<subdomain>.workers.dev`).

### 4. Standalone Worker Bundling (Eingebettetes Web-Frontend)
* Über ein Build-Skript ([`scripts/build_standalone_bundle.cjs`](file:///c:/Users/Micha/OneDrive/Dokumente/AI-Projects/ActaNex-Open/scripts/build_standalone_bundle.cjs)) werden sämtliche statischen Frontend-Assets (`src/Web/**` inkl. HTML, CSS, JavaScript, Views und PWA-Dateien) direkt als komprimierte In-Memory-Asset-Map in den Worker kompiliert.
* **Vorteile:**
  * **Zero-Pages / Zero-CORS:** Frontend und API laufen unter derselben Origin (`/` liefert die Web-App, `/api/v1/*` bedient REST-Requests).
  * **100% autark:** Keine externen CDNs, keine separaten Cloudflare Pages-Projekte erforderlich.
  * **Sofortige Reproduzierbarkeit:** Jedes neue Setup lädt das vorkompilierte `worker.bundle.js` direkt aus dem GitHub-Repository herunter.

## Konsequenzen & Sicherheitsbewertung
* **Positiv:** Endanwender können eine vollständige, GoBD-konforme Instanz innerhalb von unter 60 Sekunden ohne Entwicklertools in ihrem Cloudflare-Konto in Betrieb nehmen.
* **Sicherheit:** API-Tokens werden ausschließlich flüchtig für die REST-Calls im Speicher gehalten und niemals in der D1-Datenbank oder in Logs persistiert.
