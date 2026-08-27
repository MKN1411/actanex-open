# ADR-007: Autarker lokaler Betrieb mit Docker Desktop & SQLite

## Status
**Akzeptiert**

## Kontext
Um maximale Datensouveränität zu garantieren und das Risiko eines Provider Lock-ins (Cloudflare) vollständig zu eliminieren, muss das gesamte System im Notfall oder offline auf einem beliebigen Entwickler-Laptop oder lokalen Server betrieben werden können.

## Entscheidung
Wir stellen eine vollständige Containerisierung für den lokalen Betrieb bereit:
1. **`docker-compose.yml`:**
   * Kapselt den Node.js Runtime-Worker und das Web-Frontend in einem leichtgewichtigen Alpine-Container.
   * Mappt die Ports `8080` (Frontend) und `8787` (Backend).
2. **Standard-SQLite Local Storage:**
   * Verwendet die lokale SQLite-Emulation von Wrangler (`wrangler dev --local`), sodass keine externe Cloudflare-Verbindung erforderlich ist.
3. **1-Klick PowerShell Starter (`start-local-docker.ps1`):**
   * Vollständig parametrisiertes Skript ohne hardcodierte persönliche Pfade (PII-frei), das Docker prüft, startet und den Browser öffnet.
4. **Init-Schema (`init_clean_database.sql`):**
   * Ermöglicht das Erstellen einer 100 % sauberen, leeren Datenbank ohne bestehende Backups.

## Konsequenzen
* **Positiv:** Vollkommene Unabhängigkeit von Cloudflare; 100 %ige Offline-Fähigkeit; uneingeschränkte Datensouveränität.
* **Trade-off:** Lokale Container-Ausführung erfordert die Installation von Docker Desktop auf dem Host-Rechner.
