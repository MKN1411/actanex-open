# Leitfaden: 2-Repository-Aufteilung (Core Quellcode vs. Produktiv-Instanz)

**Version:** 2.5  
**Stand:** 21. August 2026  

Dieses Dokument beschreibt das standardisierte Verfahren, um die Plattform bei Bedarf in **zwei getrennte Repositories** aufzuteilen:
1. **Zentrales Quellcode-Repository (Public / Open-Source Core):** Reiner Code, Dokumentation, Vorlagen, CI-Tests, ohne Testdaten oder persönliche Rechnungsmetadaten.
2. **Produktiv-Instanz-Repository (Private Operations & Deployment):** Ihre persönliche Produktivumgebung mit Ihren echten Secrets, Cloudflare Bindings und automatisierten Workflow-Ausführungen.

---

## 1. Übersicht der Trennung

```
┌─────────────────────────────────────────────────────────────┐
│ 1. CORE REPOSITORY (Public / Community)                     │
│    https://github.com/MKN1411/Freelancer-Evidence-Billing-Hub│
│                                                             │
│    • src/Worker (Cloudflare D1 Schema & TypeScript API)     │
│    • src/Web (Pages Frontend)                               │
│    • src/Worker/db/init_clean_database.sql (Clean Schema)   │
│    • docker-compose.yml & start-local-docker.ps1            │
│    • Vorlagen & Dokumentation (docs/, LICENSE, etc.)        │
│    • Keine persönlichen Kundennamen, keine Produktiv-Secrets│
└──────────────────────────────┬──────────────────────────────┘
                               │ Release-Tagging / Git Submodul / Action
                               ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. INSTANZ REPOSITORY (Private / Produktiv)                 │
│    https://github.com/MKN1411/Evidence-Hub-Instance         │
│                                                             │
│    • .github/workflows (Aktive produktive Workflows)        │
│    • Repository Secrets (LEXWARE_API_KEY, CF_API_TOKEN etc.)│
│    • wrangler.toml (Produktiv-Binding der D1-Datenbank)     │
│    • GoBD-Jahresarchive & Hash-Manifeste                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Bereinigung vor der Open-Source-Freigabe (Checkliste)

Bevor das Core-Repository auf *Public* gestellt wird, muss sichergestellt sein:
- [x] **Keine Test- oder Realdaten im Code:** Initialisierung erfolgt über `src/Worker/db/init_clean_database.sql`.
- [x] **Keine Secrets in Git-Historie:** Alle Variablen liegen in GitHub Secrets oder Worker Secrets.
- [x] **Keine hardcodierten PII-Pfade:** Skripte (`start-local-docker.ps1`) nutzen dynamische Pfade (`$PSScriptRoot`).

---

## 3. Schritt-für-Schritt-Anleitung zur Erstellung des Instanz-Repos

### Schritt 1: Privates Instanz-Repo auf GitHub anlegen
Erstellen Sie ein neues, privates Repository auf GitHub (z. B. `MKN1411/Evidence-Hub-Instance`).

### Schritt 2: Secrets im Instanz-Repo hinterlegen
Hinterlegen Sie unter *Settings $\rightarrow$ Secrets and variables $\rightarrow$ Actions*:
* `LEXWARE_API_KEY`: Ihr echter Lexware Office API-Schlüssel.
* `RESEND_API_KEY`: Ihr Resend E-Mail API-Schlüssel für OTP.
* `CF_ACCOUNT_ID`: Ihre Cloudflare Account-ID.
* `CF_API_TOKEN`: Ihr Cloudflare API-Token mit D1- und R2-Berechtigungen.

### Schritt 3: Cloudflare Produktiv-Datenbank initialisieren
```powershell
npx wrangler d1 create evidence-hub-prod-db
npx wrangler d1 execute evidence-hub-prod-db --file=./src/Worker/db/init_clean_database.sql --remote
```
