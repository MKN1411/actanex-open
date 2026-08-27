# 🔄 Update-, Staging- & Versions-Strategie

**Gültig ab:** Version 2.5 (August 2026)  
**Zielgruppe:** Freelancer (Nicht-Entwickler), Entwickler & Open-Source-Maintainer  

Dieses Dokument erklärt einfach und praxisnah, wie Updates für den **Evidence & Billing Hub** funktionieren, wie Web-Oberflächen und Backend-Funktionen sicher aktualisiert werden und wie sowohl Einsteiger als auch erfahrene Entwickler neue Versionen risikofrei testen können.

---

## 🧩 1. Die drei Schichten eines Updates verstehen

Ein Update des Evidence & Billing Hubs kann drei verschiedene Komponenten betreffen:

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Web-Oberfläche (Frontend)    │ index.html, Styles & JS   │
├─────────────────────────────────┼───────────────────────────┤
│ 2. Backend & Logik (API)        │ index.ts (Worker Engine)  │
├─────────────────────────────────┼───────────────────────────┤
│ 3. Datenbank-Struktur (Schema)  │ db/00xx_migration.sql     │
└─────────────────────────────────┘───────────────────────────┘
```

### Warum Updates für Webseiten und Funktionen so sicher sind:
* **Zustandslosigkeit (Stateless):** Das Web-Frontend und die Worker-API speichern selbst **keine Daten** – sie sind reine Ausführungsprogramme.
* **Trennung von Code und Daten:** Alle Ihre echten Daten (Zeiten, Kunden, Rechnungsnummern, Einstellungen) liegen sicher in der **Cloudflare D1 Datenbank** und im **R2 Objektspeicher**.
* **Nahtloser Austausch:** Wenn Sie eine neue `index.html` oder `index.ts` einspielen, verbindet sich die neue Version sofort wieder mit Ihrer bestehenden Datenbank. Ihre Daten bleiben zu 100 % erhalten.

---

## 🛡️ 2. Anleitung für Nicht-Entwickler (Safety-First in 3 Schritten)

Wenn Sie kein Programmierer sind und einfach nur die neueste Version sicher nutzen möchten:

```
[1. 1-Klick Backup] ──► [2. Lokaler Test mit Docker] ──► [3. Live Deploy]
```

### Schritt 1: 1-Klick-Sicherheitsnetz
Öffnen Sie vor jedem Update Ihre laufende Web-App, gehen Sie auf **`💾 Backup & Exporte`** und laden Sie den **Disaster Recovery SQL-Dump** (`evidence_hub_database_dump.sql`) herunter. Damit haben Sie ein vollständiges Sicherheitsnetz auf Ihrem PC.

### Schritt 2: Update lokal mit Docker Desktop ausprobieren (0 % Risiko)
1. Ziehen Sie den neuen Code in Ihren lokalen Projektordner.
2. Starten Sie das Skript:
   ```powershell
   .\start-local-docker.ps1
   ```
3. **Ergebnis:** Die neue Version öffnet sich auf `http://localhost:8080`. Sie können alle neuen Buttons, Ansichten und Funktionen in Ruhe testen. Ihre Live-Instanz im Internet wird dabei **zu keinem Zeitpunkt berührt**.

### Schritt 3: Live schalten
Wenn lokal alles einwandfrei funktioniert, schalten Sie die neue Version mit einem Befehl live:
```powershell
# Backend ausrollen:
cd src/Worker && npx wrangler deploy

# Web-Oberfläche ausrollen:
cd ../Web && npx wrangler pages deploy . --project-name=open-evidence-billing-hub
```

---

## 💻 3. Anleitung für Entwickler (Branching & Staging)

Wenn Sie eigene Code-Anpassungen vornehmen oder Updates vorab auf einer echten Cloud-Staging-Umgebung testen möchten:

### 3.1 Empfohlene Git-Repository-Struktur
* **`main`**: Ihr produktiver Live-Zweig (verbunden mit Ihrer Produktiv-Cloudflare-Instanz).
* **`staging` / `dev`**: Ihr Entwicklungs- und Test-Zweig.
* **`upstream`**: Das offizielle Community-Repository (`open-evidence-billing-hub`).

### 3.2 Upstream-Updates holen & mergen
```powershell
# 1. Community-Repo als Upstream hinterlegen (nur 1x erforderlich):
git remote add upstream https://github.com/GITHUB_USERNAME/open-evidence-billing-hub.git

# 2. Neueste Version in einen Test-Branch laden:
git fetch upstream
git checkout -b test-update-v2.6
git merge upstream/main

# 3. Lokale Tests durchführen oder eigene Anpassungen mergen
# 4. Wenn alles stabil ist -> In den Produktiv-Branch übernehmen:
git checkout main
git merge test-update-v2.6
git push origin main
```

### 3.3 Automatische Preview-URLs in Cloudflare
Cloudflare Pages erstellt für jeden Git-Branch (z. B. `staging`) automatisch eine kostenlose, isolierte **Preview-URL** (z. B. `https://staging.ihr-hub.pages.dev`). So können Sie neue Webseiten-Funktionen online testen, bevor Sie sie auf `main` veröffentlichen.

---

## 📐 4. Entwickler-Leitlinie für unser Kern-Team (Inkrementelle Migrationen)

Damit zukünftige Updates für Anwender immer **100 % abwärtskompatibel** bleiben, gilt für alle Weiterentwicklungen folgender verbindlicher Standard:

1. **Inkrementelle SQL-Dateien:**
   * Jede Schema-Erweiterung erhält eine neue, fortlaufende Datei im Ordner `src/Worker/db/` (z. B. `0018_feature_name.sql`, `0019_feature_name.sql`).
2. **Keine destruktiven Änderungen:**
   * Vorhandene Spalten werden niemals umbenannt oder gelöscht.
   * Neue Spalten werden mit `ALTER TABLE ... ADD COLUMN` und sicheren Default-Werten hinzugefügt.
3. **Idempotenz:**
   * Alle Tabellen- und Spalten-Statements müssen mehrfach ausführbar sein (`IF NOT EXISTS`), ohne Fehler zu werfen.
4. **Unberührte Benutzerdaten bei Server-Neustarts:**
   * Initialisierungsroutinen (wie `ensureAuthTables`) prüfen immer, ob bereits Benutzer existieren (`userCount === 0`), und überschreiben niemals bestehende Benutzerkonten oder Passwörter.
