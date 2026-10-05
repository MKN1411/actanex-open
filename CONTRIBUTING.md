# Beitragen zum Freelancer Evidence & Billing Hub

Vielen Dank für Ihr Interesse an der Weiterentwicklung dieser Plattform! Wir freuen uns über Feedback, Fehlerberichte, Verbesserungsvorschläge und Pull Requests aus der Freelancer- und Entwickler-Community.

---

## Entwicklungsprinzipien

1. **GoBD- und Revisionssicherheit:**
   * Genehmigte Stundenzettel-Versionen dürfen niemals in der Datenbank überschrieben werden.
   * Korrekturen erzeugen stets eine neue Version ($n+1$).
   * Alle Dokumente und Datensätze müssen mit deterministischem SHA-256 gehasht werden.

2. **Lexware-Entkopplung:**
   * Lexware bleibt das führende System für Buchhaltung und Rechnungsnummern.
   * Rechnungen werden per API stets als Entwurf angelegt (`finalize=false`).
   * API-Rate-Limits (max. 2 Requests/s) müssen strikt eingehalten werden.

3. **Portabilität & 0 € Fixkosten:**
   * Das System soll ohne teure Cloud-Infrastruktur betrieben werden können (Cloudflare Free Tier + GitHub Actions).
   * Alle Pfade und Secrets müssen über Umgebungsvariablen konfigurierbar sein.

---

## Lokale Entwicklung starten

### Voraussetzungen
* [Node.js v20+](https://nodejs.org/)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### 1. Repository klonen & Dependencies installieren
```bash
git clone https://github.com/MKN1411/ActaNex.git
cd ActaNex
cd src/Worker && npm install
```

### 2. Lokalen Entwicklungsserver starten
```bash
# Cloudflare Worker lokal ausführen:
npm run dev

# Frontend (Pages) lokal bereitstellen:
npx serve ../Web
```

---

## Pull Request Richtlinien
* Erstellen Sie einen aussagekräftigen Feature-Branch (`feature/neues-feature` oder `fix/behebe-fehler`).
* Achten Sie bei Änderungen am Worker auf TypeScript-Typsicherheit (`npm run build` im Worker-Verzeichnis).
* Prüfen Sie GoBD-relevante Änderungen auf Unveränderbarkeit und SHA-256 Integrität.
