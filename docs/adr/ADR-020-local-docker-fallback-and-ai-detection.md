# ADR-020: Lokale Docker-Desktop Fallback-Infrastruktur & Lokale KI-Erkennung

## Status
Akzeptiert (Accepted)

## Datum
8. September 2026

## Kontext & Problemstellung
Der Freelancer Evidence & Billing Hub ist primär als serverlose Cloudflare-Lösung (Workers, D1, R2, Pages) konzipiert. Für Anwender mit besonderen Datenschutzanforderungen, Offline-Betriebsszenarien oder ohne Cloudflare-Account existiert eine lokale Docker-Laufzeitumgebung. Hierbei traten zwei Problemstellungen auf:
1. **Unvollständiges lokales Schema & Datenbank-Abweichungen:**
   Neuere relationale Tabellen und Spalten (z. B. 	rip_legs, operational_vouchers, Spalte xpense_date in 	rip_expenses, monthly_archive_seals) fehlten im lokalen Initial-Dump init_clean_database.sql, was im lokalen Betrieb zu SQL-Fehlern (Fehler beim Laden des Archivs, 
o such column: expense_date) und Endlos-Redirects führte.
2. **KI-Nutzung im lokalen Docker-Modus:**
   Im lokalen Betrieb steht die Cloudflare Workers AI Inferenz (@cf/...) nicht direkt zur Verfügung. Es bedurfte einer klaren Strategie zur Anbindung von Cloud-KI (Google Gemini via HTTPS) sowie der Erkennung lokaler KI-Services (z. B. Ollama auf Port 11434).

---

## Getroffene Entscheidungen

### 1. Robustes lokales D1-Schema-Bootstrapping
* Die Datei src/Worker/db/init_clean_database.sql wurde mit allen 21 D1-Migrationen synchronisiert.
* Der Docker-Worker bootstrappt beim Start automatisch fehlende Tabellen (	rips, 	rip_legs, operational_vouchers, oucher_upload_sessions, monthly_archive_seals) und Spalten (xpense_date), sodass die lokale SQLite-Datenbank absolut deckungsgleich mit der Cloudflare D1 Produktionsdatenbank ist.

### 2. Autonomer Offline-Start via PowerShell & Port-Konflikt-Lösung
* Das Startskript start-local-docker.ps1:
  * Prüft die Verfügbarkeit von Docker Desktop und startet diesen bei Bedarf.
  * Erkennt Port-Konflikte (z. B. Host-Port 8080 belegt) und wechselt automatisch auf Port 8085.
  * Öffnet nach erfolgreichem Start automatisch die Web-Oberfläche im Standard-Browser.

### 3. KI-Infrastrukturprüfung im lokalen Starter
* Beim Ausführen von start-local-docker.ps1 erfolgt ein automatischer Check:
  * **Lokaler Ollama AI Server:** Prüfung von http://localhost:11434/api/tags. Bei Verfügbarkeit werden vorhandene Offline-Modelle direkt im Terminal angezeigt.
  * **Google Gemini API Key:** Prüfung der Umgebungsvariablen $env:GEMINI_API_KEY zur transparenten Übergabe an den Docker-Container (docker-compose.yml).
  * Nutzerhinweis, dass der Gemini-Key jederzeit direkt in der Web-Oberfläche hinterlegt werden kann.

---

## Rechtliche & steuerliche Hinweise (Disclaimer)
* **Keine Garantie auf GoBD-Konformität im lokalen Betrieb:** Die lokale Bereitstellung via Docker stellt ein technisches Test- und Organisationswerkzeug dar. Eine GoBD-Zertifizierung oder rechtsverbindliche Bestätigung der Revisionssicherheit für lokale Docker-Instanzen wird weder garantiert noch zugesichert. Der Anwender trägt die volle Verantwortung für Datensicherung, Archivierung und Schutz vor Manipulation nach den BMF-Grundsätzen.

---

## Konsequenzen
* **Positiv:**
  * 100 % autarke Lauffähigkeit ohne Cloudflare-Abhängigkeit.
  * Identisches Datenbankschema lokal und in der Cloud.
  * Transparente KI-Unterstützung (Gemini oder lokales Ollama).
* **Aufwand:**
  * Docker Desktop für Windows muss auf dem Host installiert sein.
