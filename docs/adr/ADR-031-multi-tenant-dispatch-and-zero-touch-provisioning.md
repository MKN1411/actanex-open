# ADR-031: Multi-Tenant Workers for Platforms & 4-Stufen Provisionierung

* **Status:** Akzeptiert & Implementiert
* **Datum:** 2026-10-10
* **Kontext:** ActaNex Platform Hub (`hub.actanex.app`)

## Kontext & Problemstellung
ActaNex benötigt eine skalierbare, datenschutzkonforme Multi-Tenant-Architektur. Jeder Kunde muss aus Sicherheits- und GoBD-Gründen eine vollständig isolierte Datenbank und Laufzeitumgebung besitzen. Die Provisionierung muss vollautomatisiert („Zero-Touch“) erfolgen, ohne dass manuell Cloudflare-Ressourcen konfiguriert werden müssen.

## Entscheidung
1. **Laufzeit-Isolation via Dispatch-Namespace:**  
   Verwendung von Cloudflare Workers for Platforms mit dem Dispatch-Namespace `actanex-tenants`. Jeder Kunde läuft als eigenständiges Worker-Script unter `<subdomain>.hub.actanex.app`.
2. **Datenbank-Isolation:**  
   Jeder Mandant erhält eine dedizierte Cloudflare D1-Datenbank (`actanex_db_<subdomain>`).
3. **4-Stufen Provisionierungs-Engine:**  
   - **Stufe 1:** Automatische D1-Erstellung via Cloudflare REST API.
   - **Stufe 2:** Upload des Standalone-Worker-Bundles in den Dispatch-Namespace mit Bindings (`DB`, `STORAGE`, `PLATFORM_KV`).
   - **Stufe 3:** Migration des D1-Schemas (`schema.sql`), Einspielen der Stammdaten und Anlage des Inhabers als `Admin` mit Default-Passwort `Start123!` (oder Passwort aus Onboarding).
   - **Stufe 4:** KV-Status auf `active` setzen und Health-Check.

## Konsequenzen
* **Positiv:** Vollständige Daten- und CPU-Isolation zwischen Mandanten. Schnelle Zero-Touch-Bereitstellung nach Stripe Checkout.
* **Beachtung:** Provisionierungs-Engine benötigt Cloudflare API Token mit Berechtigungen für D1 und Workers Scripts.
