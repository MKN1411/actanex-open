# 📌 Projekt-Backlog & Geplante Optimierungen (To-Do)

Dieses Dokument hält geplante Architektur- und Performance-Optimierungen fest, die für spätere Iterationen vorgemerkt sind.

---

## 🚀 Performance & Authentifizierung

### 1. Login-Performance & Entkopplung externer Lexware-Calls
* **Problem:**  
  Direkt nach dem Login wird aktuell im Rahmen von loadSettings() ein synchrones wait loadLexwareVendors(false) ausgeführt. Dieser Endpoint fragt live über die Lexware Office API (https://api.lexware.io/v1/contacts) alle Kontakte ab, was je nach Lexware-Serverauslastung 5–8 Sekunden dauern kann und die Anzeige des Dashboards blockiert.
* **Geplante Lösung:**
  * loadLexwareVendors() aus dem kritischen Login-Pfad herausnehmen und asynchron im Hintergrund laden (non-blocking).
  * Die restlichen initialen Abfragen (loadSettings(), loadCustomers(), loadProjects(), loadDashboardStats()) parallel via Promise.all() ausführen.
  * **Ziel:** Login-Zeit und Dashboard-Erscheinen unter 1 Sekunde.

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
