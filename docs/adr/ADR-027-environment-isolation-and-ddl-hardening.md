# ADR-027: Worker-Namensraum-Isolation, Bereinigung von Init-Schemas und Deaktivierung kaskadierender Bereinigung

## Status
Akzeptiert

## Kontext & Problemstellung
Im Rahmen des Multi-Repository-Setups (mit separaten Instanzen für Produktion, Showcase-Demo und Open-Source-Forks) kam es zu einem Konfigurationskonflikt:
1. Im Demo-Repository war in `src/Worker/wrangler.jsonc` der Worker-Name identisch mit der Produktionsinstanz (`evidence-hub-worker`) konfiguriert.
2. Bei einem Deployment des Demo-Showcase überschrieb der Cloudflare-Wrangler-Prozess die D1-Datenbankbindung (`DB`) des produktiven Workers auf die Demo-Datenbank (`evidence-hub-demo-db`). Die produktive Datenbank `evidence-hub-db` blieb zwar mit allen Echtdaten vollständig intakt, der Produktions-Worker lieferte jedoch temporär nur die leeren Demo-Datensätze aus.
3. Die Datei `src/Worker/db/init_clean_database.sql` enthielt vormals `INSERT`-Statements mit Contoso-Musterdaten, was die Gefahr einer versehentlichen Datenvermischung barg.
4. Im Worker-Code existierte in `billing/hierarchy` ein Hintergrund-Aufruf `purgeDemoDataFromProduction`, der bei Nicht-Demo-Requests ausgeführt wurde.

## Entscheidung
1. **Strikte Trennung der Worker-Namensräume:**
   * Produktion (`Freelancer-Evidence-Billing-Hub`, `ActaNex`, `open-evidence-billing-hub`): `"name": "evidence-hub-worker"`
   * Demo-Instanzen (`demo-evidence-billing-hub`): `"name": "evidence-hub-demo-worker"`
   * ActaNex-Demo (`ActaNex-Demo`): `"name": "actanex-demo-worker"`
   Jede Instanz ist fest an ihre jeweilige D1-Datenbank (`evidence-hub-db` vs. `evidence-hub-demo-db` vs. `actanex-demo-db`) gebunden.

2. **Reines DDL-Schema für `init_clean_database.sql`:**
   * Sämtliche `INSERT`-Statements wurden restlos aus `init_clean_database.sql` entfernt.
   * Die Datei enthält künftig ausschließlich Tabellen- und Indexdefinitionen (`CREATE TABLE IF NOT EXISTS`, `CREATE INDEX IF NOT EXISTS`).

3. **Entfernung automatischer Bereinigungsroutinen:**
   * Der Hintergrund-Aufruf `purgeDemoDataFromProduction` im Pfad `GET /api/v1/billing/hierarchy` sowie bei `ensureInternalOrg` wurde vollständig entfernt.
   * In Produktionsumgebungen dürfen keine stillen Löschoperationen im Hintergrund ablaufen.

## Konsequenzen & Vorteile
* **Keine Überlappung von Bindungen:** Deployments aus Demo- oder Entwicklungs-Repositories können die Produktionskonfiguration unter keinen Umständen mehr beeinflussen.
* **GoBD- & Revisionssicherheit:** Die Produktionsdatenbank `evidence-hub-db` ist isoliert und vor unabsichtlichen DDL/DML-Eingriffen geschützt.
* **Transparenz:** Klare Trennung zwischen Datenbankschema (DDL) und optionalen Entwicklungs-Seed-Daten.
