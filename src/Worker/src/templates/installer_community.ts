/**
 * COMMUNITY INSTALLER TEMPLATE
 * Route: https://actanex.app/installer/community
 * Setup-Seite für ActaNex Free (Community Version) mit SQL-Blob & Speicherbegrenzungshinweis
 * (c) 2026 ActaNex Open Contributors
 */

export function renderCommunityInstaller(): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex Free (Community) – Setup-Assistent</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🌱</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --bg-main: #090d16;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --cyan: #38bdf8;
      --emerald: #10b981;
      --amber: #f59e0b;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top center, #064e3b 0%, var(--bg-main) 60%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(15, 23, 42, 0.8);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1000px;
      width: 100%;
      margin: 0 auto;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 12px;
      text-decoration: none;
      color: #fff;
      font-weight: 800;
      font-size: 1.25rem;
    }
    .brand span { color: var(--emerald); }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      margin-left: 18px;
    }
    .nav-links a:hover { color: #fff; }
    main {
      flex: 1;
      max-width: 860px;
      width: 100%;
      margin: 40px auto;
      padding: 0 24px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 36px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.5);
    }
    .badge-free {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(16, 185, 129, 0.2);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #34d399;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 12px;
      color: #fff;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1.05rem;
      margin-bottom: 28px;
    }
    .highlight-banner {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.3);
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 28px;
      display: flex;
      align-items: center;
      gap: 16px;
      color: #a7f3d0;
    }
    .highlight-banner i { font-size: 1.8rem; color: #34d399; }
    .warning-box {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.35);
      border-radius: 14px;
      padding: 20px;
      margin-bottom: 32px;
      color: #fde68a;
    }
    .warning-box strong {
      color: #fff;
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 1rem;
      margin-bottom: 8px;
    }
    .setup-step {
      background: rgba(15, 23, 42, 0.5);
      border: 1px solid var(--border-subtle);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 18px;
    }
    .step-title {
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }
    .step-num {
      width: 28px;
      height: 28px;
      border-radius: 50%;
      background: var(--emerald);
      color: #000;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      font-size: 0.85rem;
    }
    pre {
      background: #020617;
      border: 1px solid var(--border-subtle);
      border-radius: 8px;
      padding: 12px 16px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.85rem;
      color: #38bdf8;
      overflow-x: auto;
      margin: 10px 0;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 12px 20px;
      border-radius: 10px;
      font-weight: 700;
      text-decoration: none;
      font-size: 0.9rem;
      cursor: pointer;
    }
    .btn-emerald {
      background: linear-gradient(135deg, var(--emerald), #059669);
      color: #fff;
    }
    .btn-outline {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-muted);
    }
    .btn-outline:hover { color: #fff; border-color: #94a3b8; }
    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 24px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.85rem;
      margin-top: 40px;
    }
    footer a { color: var(--cyan); text-decoration: none; margin: 0 8px; }
  </style>
</head>
<body>
  <header>
    <a href="https://actanex.app" class="brand">
      <i class="fa-solid fa-cube" style="color:var(--emerald);"></i>
      ActaNex <span>Free</span>
    </a>
    <div class="nav-links">
      <a href="https://actanex.app/installer"><i class="fa-solid fa-arrow-left"></i> Zurück zur Übersicht</a>
      <a href="https://actanex.app"><i class="fa-solid fa-house"></i> Startseite</a>
    </div>
  </header>

  <main>
    <div class="card">
      <div class="badge-free">
        <i class="fa-solid fa-circle-check"></i> 100% Kostenfrei &bull; Open Source
      </div>
      <h1>ActaNex Free (Community Version)</h1>
      <p class="subtitle">Installations-Leitfaden für die kostenfreie Community-Version mit lokalem SQL-Blob-Speicher.</p>

      <div class="highlight-banner">
        <i class="fa-solid fa-credit-card-slash"></i>
        <div>
          <strong style="font-size:1.05rem; display:block;">Keine Kreditkarte notwendig!</strong>
          <span>Sie benötigen weder eine Zahlungsart noch ein kostenpflichtiges Cloud-Abo. Die Community-Version ist dauerhaft frei nutzbar.</span>
        </div>
      </div>

      <div class="warning-box">
        <strong><i class="fa-solid fa-triangle-exclamation"></i> Wichtiger Hinweis zum Speicherlimit:</strong>
        <p style="font-size:0.9rem; line-height:1.6; margin-top:4px;">
          Die Community-Version nutzt eine <strong>lokale SQLite-Datenbank / SQL-Blob-Speicherung</strong>. 
          Dieses Format ist für Einzelanwender und Solo-Freelancer mit geringem Belegvolumen konzipiert. 
          Große PDF-Belegmengen oder Multi-User-Mandanten erfordern Cloud-Objektspeicher (z. B. Cloudflare R2 / D1 im Pro-Tarif).
        </p>
      </div>

      <h2 style="font-size:1.3rem; margin-bottom:16px; color:#fff;">Installations-Optionen:</h2>

      <!-- Option A -->
      <div class="setup-step">
        <div class="step-title">
          <div class="step-num">1</div>
          <span>Option A: Lokale Ausführung via Git & Node.js (Empfohlen)</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted);">Klonen Sie das Repository und starten Sie den lokalen Setup-Server auf Port 3000:</p>
        <pre>git clone https://github.com/MKN1411/actanex-open.git
cd actanex-open
npm install
npm run setup</pre>
        <a href="https://github.com/MKN1411/actanex-open" class="btn btn-outline" target="_blank" rel="noopener">
          <i class="fa-brands fa-github"></i> Repository auf GitHub öffnen
        </a>
      </div>

      <!-- Option B -->
      <div class="setup-step">
        <div class="step-title">
          <div class="step-num">2</div>
          <span>Option B: Docker 1-Klick Container</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted);">Starten Sie ActaNex isoliert im lokalen Docker-Container mit persistentem SQLite-Volume:</p>
        <pre>docker run -d -p 3000:3000 -v actanex-data:/data ghcr.io/mkn1411/actanex-open:latest</pre>
      </div>

      <!-- Option C -->
      <div class="setup-step" style="border-color:rgba(56, 189, 248, 0.3);">
        <div class="step-title" style="color:var(--cyan);">
          <i class="fa-solid fa-cloud-arrow-up"></i>
          <span>Mehr Speicherplatz & Cloudflare Edge gewünscht?</span>
        </div>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:12px;">
          Wenn Sie Ihre Instanz auf Ihrem eigenen Cloudflare-Konto mit 5 GB D1-Datenbank und unbegrenztem R2-Belegspeicher betreiben möchten:
        </p>
        <a href="https://actanex.app/installer/byol" class="btn btn-emerald">
          <i class="fa-solid fa-server"></i> Zum ActaNex Pro (Self Service BYOL) Installer (2,50 € / mtl.)
        </a>
      </div>
    </div>
  </main>

  <footer>
    &copy; 2026 Michael Kirst-Neshva &bull; ActaNex Open &bull; 
    <a href="https://actanex.app/impressum">Impressum</a> &bull;
    <a href="https://actanex.app/datenschutz">Datenschutz</a> &bull;
    <a href="https://actanex.app/nutzungsbedingungen">Nutzungsbedingungen</a>
  </footer>
</body>
</html>`;
}
