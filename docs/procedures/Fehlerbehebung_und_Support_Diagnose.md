# 🩺 Fehlerbehebung, Systemdiagnose & Support-Logfiles

**Gültig ab:** Version 2.5.0 LTS (Release August 2026)  
**Zielgruppe:** Anwender (Freelancer), Administratoren & Entwickler-Support  

Dieser Leitfaden beschreibt, wie Sie bei Fehlern, Schnittstellenproblemen oder unerwartetem Verhalten eine aussagekräftige Fehlerdiagnose erstellen und Logfiles für den Entwickler-Support bereitstellen können.

---

## 🚀 Übersicht der 3 Diagnose-Möglichkeiten

```
┌────────────────────────────────────────────────────────────────────────┐
│ 1. In-App 1-Klick Diagnose-Bundle (Web-App > Backup > Support-Diagnose)│
├────────────────────────────────────────────────────────────────────────┤
│ 2. Cloudflare Live-Streaming Logs (`npx wrangler tail`)               │
├────────────────────────────────────────────────────────────────────────┤
│ 3. Lokale Docker Desktop Container-Logs (`docker compose logs`)        │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 🩺 Methode 1: Das 1-Klick-Diagnose-Bundle (Empfohlen für alle Anwender)

Wenn Sie in der Web-Oberfläche auf einen Fehler stoßen:

1. Öffnen Sie in der linken Menüleiste den Punkt **`💾 Backup & Exporte`**.
2. Scrollen Sie zu **Karte 5: `Support- & System-Diagnose`**.
3. Klicken Sie auf den Button **`[🩺 Diagnose-Logfile herunterladen (.json)]`**.
4. Es wird automatisch eine Datei namens `evidence_hub_diagnostics_JJJJ-MM-TT.json` auf Ihren PC heruntergeladen.

### 🔒 Was enthält dieses Diagnose-Bundle (und was nicht)?
* **Enthalten:**
  * App- & Schema-Version (`v2.5.0`).
  * Server-Gesundheitsstatus (Cloudflare Worker & Bindings-Prüfung).
  * Verbindungsstatus zu Lexware Office & E-Mail-Dienst (aktiv/inaktiv).
  * Tabellen-Gesundheitscheck (Anzahl der Datensätze zur Prüfung auf Vollständigkeit).
  * Die letzten 30 System- und Fehlerereignisse aus dem GoBD-Audit-Trail.
  * Browser-Umgebung (Engine, Bildschirmauflösung, Speicher-Verfügbarkeit).
* **Aus Datenschutzgründen NICHT enthalten:**
  * ❌ Keine Passwörter oder kryptografischen Salts.
  * ❌ Keine API-Keys oder Zugangsdaten.
  * ❌ Keine vertraulichen Kundennamen oder Rechnungsbeträge.
* **Verwendung:**  
  Sie können diese `.json`-Datei gefahrlos an ein GitHub Issue anhängen oder per E-Mail an den Entwickler-Support senden.

---

## 💻 Methode 2: Cloudflare Worker Live-Logs (Für Cloudflare-Betreiber)

Wenn Sie die Anwendung auf Cloudflare Pages / Workers hosten und einen Fehler in Echtzeit mitverfolgen möchten:

1. Öffnen Sie ein Terminal (PowerShell oder Bash) im Projektordner:
   ```powershell
   cd src/Worker
   npx wrangler tail
   ```
2. Führen Sie nun in der Web-App die Aktion aus, die den Fehler verursacht hat.
3. Im Terminal sehen Sie jeden HTTP-Request, alle `console.error`-Ausgaben sowie vollständige TypeScript-Stack-Traces in Echtzeit.
4. **Log in Datei speichern:**
   ```powershell
   npx wrangler tail > worker_error.log
   ```

---

## 🐳 Methode 3: Docker Desktop Logs (Für lokale Offline-Nutzer)

Wenn Sie den Hub autark über Docker Desktop betreiben:

### Variante A: Über PowerShell / Terminal
Führen Sie im Projektordner folgenden Befehl aus:
```powershell
docker compose logs --tail=200 > evidence_hub_docker.log
```

### Variante B: Über die grafische Docker Desktop Oberfläche
1. Öffnen Sie **Docker Desktop**.
2. Klicken Sie auf den Container-Stack `freelancer-evidence-billing-hub` (bzw. `open-evidence-billing-hub`).
3. Wählen Sie den Container `backend` oder `frontend` aus.
4. Klicken Sie auf den Reiter **`Logs`**, kopieren Sie die Fehlermeldung oder speichern Sie den Logverlauf.

---

## ❓ Häufige Fehlerbilder & Sofortlösungen

### 1. Lexware-Synchronisation meldet „Ungültiger API-Schlüssel“
* **Ursache:** Der API-Schlüssel in Lexware wurde neu generiert oder die Cloudflare-Secret-Variable `LEXWARE_API_KEY` ist nicht gesetzt.
* **Lösung:** Führen Sie `npx wrangler secret put LEXWARE_API_KEY` aus und tragen Sie Ihren aktuellen Schlüssel ein.

### 2. Nachweis-Genehmigungslink für Kunden funktioniert nicht
* **Ursache:** Die Domain oder Worker-URL in den Einstellungen stimmt nicht mit der Produktiv-URL überein.
* **Lösung:** Prüfen Sie im Menü *⚙️ Einstellungen* die hinterlegte *Webhook- & Callback-URL* sowie die E-Mail-Absenderadresse.

### 3. Login schlägt nach Datenbank-Wiederherstellung fehl
* **Ursache:** Bei der Wiederherstellung eines Backups wurden die Passwörter aus dem Backup eingespielt.
* **Lösung:** Verwenden Sie das Passwort, das zum Zeitpunkt der Backup-Erstellung für diesen Benutzer gültig war.
