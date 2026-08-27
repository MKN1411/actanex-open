# 📖 Notfall- & Wiederherstellungshandbuch (Disaster Recovery)

Dieses Handbuch ist so geschrieben, dass Sie die gesamte Anwendung **auch ohne tiefes technisches Vorwissen Schritt für Schritt wiederherstellen** können – egal ob auf einem neuen Cloudflare-Konto oder lokal auf Ihrem eigenen PC mit **Docker Desktop**.

---

## 📋 1. Checkliste: Was wird benötigt?

### A. Voraussetzungen auf Ihrem PC / Laptop (Lokal)
Sie müssen auf Ihrem Computer lediglich ein Standardprogramm installiert haben:

1. **Für Cloudflare-Wiederherstellung: Node.js (LTS)**
   * **Option 1 (Empfohlen: 1-Klick per PowerShell):**
     ```powershell
     winget install OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
     ```
   * **Option 2 (Manueller Download im Browser):**
     Von [https://nodejs.org](https://nodejs.org) (Version LTS herunterladen und durchklicken).

2. **Für lokalen Betrieb: Docker Desktop für Windows**
   * **Option 1 (1-Klick per PowerShell):**
     ```powershell
     winget install Docker.DockerDesktop --accept-package-agreements --accept-source-agreements
     ```
   * **Option 2 (Manueller Download im Browser):**
     Von [https://www.docker.com/products/docker-desktop/](https://www.docker.com/products/docker-desktop/).

3. **Ihre gesicherten Dateien (aus dem Backup-Center):**
   * Der Projekt-Quellcodeordner.
   * Ihre heruntergeladene SQL-Sicherungsdatei (z. B. `evidence_hub_database_dump_YYYY-MM-DD.sql`) – oder das mitgelieferte Initial-Schema `src/Worker/db/init_clean_database.sql` für einen leeren Neustart.

---

### B. Voraussetzungen bei Cloudflare (Online-Hosting)
Cloudflare ist der Dienst, der Ihre Web-App, die Datenbank und den Dateispeicher kostenlos im Internet bereitstellt:

1. **Kostenloser Cloudflare-Account:**
   * Falls nicht vorhanden: Kostenlos registrieren unter [https://dash.cloudflare.com/sign-up](https://dash.cloudflare.com/sign-up).
2. **Keine manuellen API-Tokens nötig:**
   * Der Befehl `npx wrangler login` im Terminal öffnet automatisch Ihren Browser und verbindet Ihren PC mit einem Klick mit Cloudflare.
3. **Ihre API-Schlüssel (für Schnittstellen):**
   * **Lexware API-Schlüssel:** In Lexware Office unter *Einstellungen > Erweiterungen / Schnittstellen*.
   * **Resend API-Schlüssel (optional):** Unter [resend.com](https://resend.com) für den automatischen E-Mail-Versand der Kunden-Freigabelinks.

---

## 🐳 2. Lokaler 1-Klick-Betrieb unter Windows mit Docker Desktop (Völlig ohne Cloudflare)

Wenn Sie die Plattform komplett autark auf Ihrem eigenen Windows-Rechner laufen lassen möchten:

### Schritt 1: Docker Desktop starten
Stellen Sie sicher, dass **Docker Desktop** auf Ihrem PC installiert und gestartet ist (Symbol in der Windows-Taskleiste ist grün/aktiv).

### Schritt 2: PowerShell-Starter ausführen
Im Projektordner liegt das fertige Skript `start-local-docker.ps1`. Sie können es direkt in der PowerShell starten oder per Rechtsklick: *„Mit PowerShell ausführen“*.

Alternativ können Sie den folgenden kopierbaren Code in Ihr PowerShell-Fenster einfügen:

```powershell
# ==============================================================================
# LOKALER DOCKER DESKTOP START (Kopierbarer PowerShell-Code)
# ==============================================================================

# 1. Variablen (Anonym & ohne feste Pfade)
$FrontendPort     = 8080                                      # Web-Oberfläche Port
$BackendPort      = 8787                                      # API-Port
$LexwareApiKey    = "IHR_LEXWARE_API_KEY_HIER_EINTRAGEN"      # Optional: Lexware Key
$ResendApiKey     = "IHR_RESEND_API_KEY_HIER_EINTRAGEN"       # Optional: E-Mail Key
$JwtSecret        = "lokaler-geheimer-schluessel-mindestens-32-zeichen"
$ProjectDir       = $PSScriptRoot                             # Nutzt automatisch den aktuellen Ordner

if (-not $ProjectDir) { $ProjectDir = Get-Location }

# 2. Umgebungsvariablen setzen
$env:PORT_FRONTEND   = $FrontendPort
$env:PORT_BACKEND    = $BackendPort
$env:LEXWARE_API_KEY = $LexwareApiKey
$env:RESEND_API_KEY  = $ResendApiKey
$env:JWT_SECRET      = $JwtSecret

# 3. Docker Container im Hintergrund starten
Set-Location $ProjectDir
docker compose up -d --remove-orphans

Write-Host "✅ Evidence Hub läuft lokal auf: http://localhost:$FrontendPort" -ForegroundColor Green
Start-Process "http://localhost:$FrontendPort"
```

### Schritt 3: Datenbank vorbereiten (Wählen Sie Fall A oder Fall B)

#### Fall A: Sie haben ein DB-Backup (`.sql`)
Spielen Sie Ihren exportierten SQL-Dump in den lokalen Container ein:
```powershell
docker exec -i evidence-hub-local sh -c "npx --prefix /app/src/Worker wrangler d1 execute evidence-hub-db --file=/app/evidence_hub_database_dump_YYYY-MM-DD.sql --local"
```

#### Fall B: Sie haben KEIN Backup und möchten eine komplett frische, leere DB starten
Führen Sie einfach diesen einen Befehl aus, um das saubere Initial-Schema zu laden:
```powershell
docker exec -i evidence-hub-local sh -c "npx --prefix /app/src/Worker wrangler d1 execute evidence-hub-db --file=/app/src/Worker/db/init_clean_database.sql --local"
```
*💡 Sobald die leere Datenbank initialisiert ist, öffnen Sie die Web-App (`http://localhost:8080`) und klicken Sie auf **„Lexware Sync“** – alle Kunden und Daten werden automatisch frisch aus Ihrem Lexware Office geladen!*

---

## ⚡ 3. Schritt-für-Schritt: Wiederherstellung auf Cloudflare (ca. 10 Minuten)

Folgen Sie einfach diesen 5 Schritten der Reihe nach in Ihrer **PowerShell**:

### Schritt 1: Terminal im Projektordner öffnen
1. Drücken Sie die **Windows-Taste**, tippen Sie `PowerShell` ein und drücken Sie **Enter**.
2. Wechseln Sie in Ihren Projektordner:
   ```powershell
   cd "$PSScriptRoot" # oder Pfad zu Ihrem Projektordner
   ```

### Schritt 2: Mit Cloudflare verbinden
```powershell
npx wrangler login
```
*Es öffnet sich automatisch Ihr Browser. Klicken Sie auf **„Allow / Genehmigen“**.*

---

### Schritt 3: Neue Datenbank & Speicher anlegen
```powershell
cd src/Worker
npx wrangler d1 create evidence-hub-db
npx wrangler r2 bucket create evidence-hub-documents
```
*Cloudflare gibt Ihnen nach dem ersten Befehl eine `database_id` (z. B. `d1-xxxx-xxxx`). Tragen Sie diese in die Datei `src/Worker/wrangler.toml` in der Zeile `database_id = "..."` ein.*

---

### Schritt 4: Datenbank befüllen (Wählen Sie Fall A oder Fall B)

* **Fall A (Mit Backup-Datei):**
  ```powershell
  npx wrangler d1 execute evidence-hub-db --file=./evidence_hub_database_dump_YYYY-MM-DD.sql --remote
  ```
* **Fall B (Frische, leere Datenbank ohne Backup starten):**
  ```powershell
  npx wrangler d1 execute evidence-hub-db --file=./db/init_clean_database.sql --remote
  ```

---

### Schritt 5: Anwendung live schalten (Backend & Web-Oberfläche)
1. **API-Schlüssel in Cloudflare hinterlegen:**
   ```powershell
   npx wrangler secret put LEXWARE_API_KEY
   npx wrangler secret put RESEND_API_KEY
   npx wrangler secret put JWT_SECRET
   ```

2. **Backend & Frontend deployen:**
   ```powershell
   npx wrangler deploy
   cd ../Web
   npx wrangler pages deploy . --project-name=evidence-hub-web
   ```

🎉 **Ergebnis:** Ihre Anwendung ist unter Ihrer Cloudflare-Adresse sofort wieder weltweit voll funktionsfähig erreichbar!

---

## 🔒 4. Revisionssicherheit: Nachweis der Unverfälschtheit (GoBD)

Nachdem Sie Ihre Daten wiederhergestellt haben:
1. Öffnen Sie in der Web-App den Menüpunkt **GoBD Protokolle**.
2. Dort sehen Sie die lückenlose Historie aller bisherigen Buchungs- und Monatsabschlüsse.
3. Die angezeigten **SHA-256 Hashes** stimmen exakt mit den Hashes auf Ihren bereits versendeten Monats-PDFs überein – damit ist gegenüber dem Finanzamt mathematisch lückenlos bewiesen, dass keine Daten nachträglich manipuliert wurden.

---

## 🔑 5. Erstanmeldung, Zugangsdaten & Profil-Sicherheit

### Bei Start mit einer frischen/leeren Datenbank:
1. **Standard-Zugangsdaten:**
   * **E-Mail:** `admin@example.com`
   * **Passwort:** `Start123!`
2. **Automatische Ersteinrichtungs-Aufforderung:**
   * Beim ersten Login erkennt das System die Standardwerte automatisch und öffnet sofort das Sicherheitsfenster:  
     *„⚠️ Ersteinrichtung: Zugangsdaten ändern“*.
   * Vergeben Sie hier Ihren **Namen**, Ihre **persönliche E-Mail** und Ihr **eigenes sicheres Passwort** (min. 8 Zeichen).
   * Nach dem Speichern ist der Hub dauerhaft mit Ihren individuellen PBKDF2-gehashten Zugangsdaten geschützt.

### Bei Wiederherstellung aus einem DB-Backup:
* Wenn Sie ein bestehendes Backup (`.sql`) einspielen, bleiben Ihre **zuvor vergebenen persönlichen Zugangsdaten zu 100 % erhalten**. Das System überschreibt Ihre Kontodaten bei Wiederherstellungen niemals.

### Spätere Änderung von E-Mail, Name oder Passwort:
* Im Menü **`⚙️ Einstellungen`** können Sie unter **`8. Administrator-Zugangsdaten & Profil ändern`** jederzeit Ihre Anmeldedaten und Ihr Passwort unter Eingabe des aktuellen Kennworts anpassen.

