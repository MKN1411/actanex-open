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
* [.NET 9 SDK](https://dotnet.microsoft.com/download)
* [Node.js v20+](https://nodejs.org/) (optional für Worker-Entwicklung)
* [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (`npm install -g wrangler`)

### 1. Repository klonen & bauen
```bash
git clone https://github.com/YOUR_USERNAME/Freelancer-Evidence-Billing-Hub.git
cd Freelancer-Evidence-Billing-Hub
dotnet restore
dotnet build
dotnet test
```

### 2. Demo-Lauf für Dokumentenerzeugung ausführen
```bash
dotnet run --project src/Engine/EvidenceHub.Cli/EvidenceHub.Cli.csproj -- --demo
```
Erzeugt ein Muster-PDF und ein Muster-XLSX im Ordner `output/`.

---

## Pull Request Richtlinien
* Erstellen Sie einen aussagekräftigen Feature-Branch (`feature/neues-feature` oder `fix/behebe-fehler`).
* Fügen Sie bei Änderungen an der Engine entsprechende xUnit-Tests in `tests/EvidenceHub.Engine.Tests` hinzu.
* Alle Tests müssen lokal mit `dotnet test` erfolgreich durchlaufen.
