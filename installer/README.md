# 🚀 ActaNex Open - Automatischer Cloudflare Installer & Setup-Wizard

Dieser interaktive Setup-Wizard ermöglicht die vollautomatische Bereitstellung von **ActaNex Open** in Ihrem Cloudflare-Konto inklusive:
- **D1 SQL-Datenbank** (`actanex-open-db`)
- **R2 Object Storage Bucket** (`actanex-open-storage`)
- **Schemamigrationen & GoBD-Tabellen** (0001–0020)
- **Verschlüsselte Cloudflare Worker Secrets** (`JWT_SECRET`, `ADMIN_INITIAL_EMAIL`, `ADMIN_INITIAL_PASSWORD`, `LEXWARE_API_KEY`, etc.)
- **Administrator-Bootstrap** mit kryptographisch sicherem PBKDF2-Hash

---

## ⚡ Schnellstart

### Methode 1: Lokaler Setup-Server (Empfohlen – 1-Klick im Browser)
Führen Sie im Projektverzeichnis folgenden Befehl aus:

```bash
npm run setup
# oder direkt ohne npm-Install:
node installer/server.js
```

Der Server öffnet automatisch die interaktive Web-Oberfläche unter:  
👉 **`http://localhost:3000`**

Dort geben Sie Ihre Cloudflare Account-ID und das API-Token ein. Der Server erledigt die gesamte Provisionierung, Migration und Secret-Speicherung via Cloudflare REST API v4.

---

### Methode 2: Standalone-Browser & Skript-Generator (Ohne Node-Server)
Öffnen Sie einfach [`installer/index.html`](index.html) direkt in einem beliebigen Web-Browser (z. B. Doppelklick).

Im Formular können Sie:
1. Alle Werte und Passwörter eingeben und verifizieren
2. Kryptographisch sichere 256-Bit JWT-Secrets und Passwörter generieren
3. Im Reiter **"Modus B: Skript-Generator"** ein schlüsselfertiges PowerShell- (`setup-cloudflare.ps1`) oder Bash-Skript (`setup-cloudflare.sh`) herunterladen, das die Installation lokal über Wrangler ausführt.

---

## 🛡️ Gespeicherte Cloudflare Secrets

Folgende Secrets werden im Cloudflare Worker verschlüsselt hinterlegt:

| Secret-Name | Zweck | Speichermethode |
| :--- | :--- | :--- |
| `JWT_SECRET` | Signierung von Auth-Tokens & GoBD-Sessions | Cloudflare Worker Secret (AES-256) |
| `ADMIN_INITIAL_EMAIL` | E-Mail-Adresse des Administrators | Cloudflare Worker Secret |
| `ADMIN_INITIAL_PASSWORD`| Initiales Master-Passwort | D1 User Table (PBKDF2 SHA-256) & Worker Secret |
| `LEXWARE_API_KEY` | *(Optional)* Lexware Office API-Schlüssel | Cloudflare Worker Secret |
| `RESEND_API_KEY` | *(Optional)* Resend API-Schlüssel für Freigaben | Cloudflare Worker Secret |

---

## 📋 Benötigte Cloudflare Token-Berechtigungen

Erstellen Sie im Cloudflare Dashboard (*Mein Profil > API-Tokens > Benutzerdefiniert*) ein Token mit:
- **Account > Workers Scripts > Bearbeiten**
- **Account > D1 > Bearbeiten**
- **Account > Workers R2 Storage > Bearbeiten**
- **Account > Cloudflare Pages > Bearbeiten**
- **Account > Kontoeinstellungen > Lesen**
