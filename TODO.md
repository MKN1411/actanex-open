# 📌 Projekt-Backlog & Geplante Optimierungen (To-Do)

Dieses Dokument hält geplante Architektur- und Performance-Optimierungen fest, die für spätere Iterationen vorgemerkt sind.

---

## 🚀 Performance & Authentifizierung

### 1. Login-Performance & Entkopplung externer Lexware-Calls [ERLEDIGT ✅]
* **Problem:**  
  Direkt nach dem Login wurde im Rahmen von `loadSettings()` ein synchrones `await loadLexwareVendors(false)` ausgeführt, sowie wiederholte D1-Schema-Checks (`ALTER TABLE`, `INSERT OR IGNORE`) bei jedem Request.
* **Umgesetzte Lösung (Vorschläge 1, 3, 4):**
  * `loadLexwareVendors()` vollständig aus dem kritischen Login-Pfad entkoppelt und nur noch bei Aufruf des Konfigurations-Tabs geladen (mit In-Memory-Cache).
  * In-Memory Schema-Caching (`isSettingsEnsured`, `isProjectColumnsEnsured`, `isInternalOrgEnsured`) im Cloudflare Worker implementiert, wodurch D1-Write-Locks und 26+ `ALTER TABLE`-Checks pro Request entfallen.
  * `ensureInternalOrgAndProjects()` aus reinen Lese-Endpunkten (`/dashboard/stats`, `/customers`, `/projects`) entfernt.
  * **Ergebnis:** Login- und Ladezeiten drastisch von 6–10 Sekunden auf unter 0,5 Sekunden reduziert.

---

## 🎛️ Benutzeroberfläche & Multi-Environment

### 2. Umgebungs-Switch im Login-Screen (Environment Selector)
* **Ziel:**  
  Ein umschaltbarer Selector direkt im Anmeldefenster, um flexibel zwischen Cloud- und Offline-Instanzen zu wechseln, ohne URL-Parameter manuell eingeben zu müssen:
  * ☁️ **Cloudflare Live (Produktion)**
  * 🧪 **Cloudflare Demo**
  * 🐳 **Lokaler Docker-Desktop (http://localhost:8787)**
* **Details:**
  * Speicherung der Nutzerpräferenz im localStorage (vidence_selected_env).
  * Transparente Anzeige des aktiven Backends in der Benutzeroberfläche.

---

## 🔒 Version 3.0 Roadmap: Echte Revisionssicherheit & Kryptografische Integrität (Weg B)

### 3. Echte SHA-256 Hash-Kette & Merkle-Root-Integritätsnachweis
* **Ausgangslage (Status Quo v2.13.0):**
  Die Tabelle `audit_events` fungiert als detailliertes Anwendungs- und Änderungsprotokoll (Event-Logging). Der Testdaten-Reset ist mit doppelter Sicherheitsabfrage und E-Mail-OTP (2FA) geschützt.
* **Geplante Architektur & Härtung für Version 3.0:**
  1. **Kryptografische SHA-256 Hash-Kette (`audit_events`):**
     * Einführung der relationalen Spalten `previous_event_hash` und `event_hash` in `audit_events`.
     * Jeder Event wird deterministisch aus den Werten des Vorgängers und dem aktuellen Payload signiert:
       $$\text{Hash}_n = \text{SHA256}(\text{ID}_n + \text{Timestamp} + \text{EventType} + \text{Payload} + \text{Hash}_{n-1})$$
     * Eine nachträgliche Modifikation oder das Herausschneiden von Datensätzen macht die gesamte nachfolgende Kette mathematisch ungültig.
  2. **Echter Merkle-Tree & Monatsabschluss:**
     * Berechnung eines echten binären Merkle-Tree-Root-Hashes über sämtliche Zeit-, Reise- und Belegeinträge des Abrechnungsmonats.
     * Festes relationales Setzen auf `is_locked = 1` (Schreib- und Änderungssperre für versiegelte Monate).
  3. **Integritäts-Verifizierer im Web-Cockpit:**
     * Interaktiver Prüf-Button `[🔍 Hash-Kette mathematisch validieren]`: Traversiert die gesamte Ereigniskette vom Genesis-Block bis zum aktuellen Datensatz und liefert einen visuellen Audit-Report (*100 % intakt / Keine Manipulationen festgestellt*).
  4. **Unveränderliche WORM-Archivierung (Cloudflare R2 Object Lock):**
     * Automatischer Export der Monatsarchive und Prüfberichte in einen Cloudflare R2-Bucket mit aktivierter *Object Retention Policy* (Compliance Mode).
