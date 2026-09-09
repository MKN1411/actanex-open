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
