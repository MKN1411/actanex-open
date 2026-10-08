/**
 * COMMUNITY INSTALLER TEMPLATE
 * Route: https://actanex.app/installer/community
 * Setup-Seite für ActaNex Free (Community Version) mit Cloudflare D1 SQL-Blob & Speicherbegrenzungshinweis
 * Unterstützt dynamische URL-Parameter (?subdomain=...&email=...)
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
      --border-focus: rgba(16, 185, 129, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --cyan: #38bdf8;
      --emerald: #10b981;
      --amber: #f59e0b;
      --indigo: #6366f1;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top center, #064e3b 0%, var(--bg-main) 60%);
      color: var(--text-main);
      font-family: 'Plus Jakarta Sans', sans-serif;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      line-height: 1.6;
    }
    header {
      padding: 18px 24px;
      border-bottom: 1px solid var(--border-subtle);
      background: rgba(15, 23, 42, 0.85);
      backdrop-filter: blur(12px);
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 1100px;
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
    .nav-links { display: flex; gap: 16px; align-items: center; }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #fff; }
    .btn-outline {
      border: 1px solid rgba(255, 255, 255, 0.15);
      background: rgba(30, 41, 59, 0.5);
      color: #e2e8f0;
      padding: 6px 14px;
      border-radius: 8px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-outline:hover {
      border-color: rgba(255, 255, 255, 0.35);
      color: #fff;
    }
    main {
      flex: 1;
      max-width: 960px;
      width: 100%;
      margin: 36px auto;
      padding: 0 20px;
    }
    .badge-pill {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 16px;
      border-radius: 9999px;
      font-size: 0.8rem;
      font-weight: 700;
      letter-spacing: 0.5px;
      background: rgba(16, 185, 129, 0.15);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
      margin-bottom: 16px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 36px;
      backdrop-filter: blur(16px);
      box-shadow: 0 20px 40px -15px rgba(0,0,0,0.6);
      margin-bottom: 28px;
    }
    h1 {
      font-size: 2.2rem;
      font-weight: 800;
      margin-bottom: 12px;
      letter-spacing: -0.5px;
    }
    p.lead {
      color: var(--text-muted);
      font-size: 1.05rem;
      margin-bottom: 24px;
    }
    .subdomain-alert-banner {
      display: none;
      background: rgba(14, 165, 233, 0.12);
      border: 1px solid rgba(56, 189, 248, 0.4);
      border-radius: 14px;
      padding: 18px 22px;
      margin-bottom: 28px;
      color: #e0f2fe;
    }
    .alert-box {
      border-radius: 12px;
      padding: 18px 20px;
      margin-bottom: 24px;
      font-size: 0.9rem;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      line-height: 1.55;
    }
    .alert-box.green {
      background: rgba(16, 185, 129, 0.12);
      border: 1px solid rgba(16, 185, 129, 0.35);
      color: #a7f3d0;
    }
    .alert-box.amber {
      background: rgba(245, 158, 11, 0.12);
      border: 1px solid rgba(245, 158, 11, 0.35);
      color: #fde68a;
    }
    .form-group { margin-bottom: 18px; }
    label {
      display: block;
      font-size: 0.82rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #cbd5e1;
      margin-bottom: 8px;
    }
    input, select {
      width: 100%;
      background: rgba(15, 23, 42, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.12);
      border-radius: 10px;
      padding: 12px 14px;
      color: #fff;
      font-size: 0.92rem;
      font-family: inherit;
      outline: none;
      transition: all 0.2s;
    }
    input:focus, select:focus {
      border-color: var(--emerald);
      box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 13px 24px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-emerald {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
      box-shadow: 0 4px 15px rgba(5, 150, 105, 0.35);
    }
    .btn-emerald:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(5, 150, 105, 0.5);
    }
    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
    }
    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
      transform: none !important;
    }
    .terminal-box {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 16px 20px;
      margin-top: 14px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.84rem;
      color: #e2e8f0;
      white-space: pre-wrap;
      overflow-x: auto;
    }
    .options-grid {
      display: grid;
      gap: 20px;
      margin-top: 24px;
    }
    .option-card {
      background: rgba(30, 41, 59, 0.5);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 16px;
      padding: 24px;
    }
    .option-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 12px;
    }
    .option-badge {
      width: 32px;
      height: 32px;
      border-radius: 50%;
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: 0.9rem;
    }
    footer {
      border-top: 1px solid var(--border-subtle);
      padding: 28px 20px;
      text-align: center;
      color: var(--text-dim);
      font-size: 0.82rem;
      margin-top: auto;
    }
    footer a { color: var(--text-muted); text-decoration: none; }
    footer a:hover { color: var(--cyan); }
  </style>
</head>
<body>
  <header>
    <a href="https://actanex.app" class="brand">
      <i class="fa-solid fa-cube text-emerald-400"></i>
      <div>ActaNex <span>Free Community</span></div>
    </a>
    <div class="nav-links">
      <a href="https://actanex.app">Hauptseite</a>
      <a href="https://actanex.app/installer">Installer-Hub</a>
      <a href="https://actanex.app/update" class="btn-outline">
        <i class="fa-solid fa-arrows-rotate"></i> Update-Center
      </a>
      <a href="https://actanex.app/installer/byol">BYOL Installer</a>
    </div>
  </header>

  <main>
    <div class="card">
      <div class="badge-pill">
        <i class="fa-solid fa-check"></i> 100% Kostenfrei &bull; Keine Kreditkarte erforderlich
      </div>

      <h1>ActaNex Free (Community Version)</h1>
      <p class="lead">
        Installations- &amp; Setup-Assistent für die kostenfreie Community-Version mit Cloudflare D1 SQL-Blob Speicher oder lokalem Betrieb.
      </p>

      <!-- Dynamic Subdomain Context Banner (Visible if query params exist) -->
      <div id="subdomainContextBanner" class="subdomain-alert-banner">
        <div style="display:flex; align-items:flex-start; gap:14px;">
          <i class="fa-solid fa-link text-cyan-400" style="font-size:1.3rem; margin-top:3px;"></i>
          <div>
            <strong style="color:#fff; font-size:1rem;" id="bannerTitle">Reservierte Subdomain erkannt:</strong>
            <p style="margin-top:4px; font-size:0.9rem;" id="bannerDesc">
              Ihre gewählte Subdomain wurde übernommen. Sie können ActaNex Free hier direkt in Cloudflare mit D1-Speicher bereitstellen.
            </p>
          </div>
        </div>
      </div>

      <!-- No Credit Card Badge -->
      <div class="alert-box green">
        <i class="fa-solid fa-credit-card text-emerald-400" style="font-size:1.25rem; margin-top:2px;"></i>
        <div>
          <strong>Keine Kreditkarte notwendig!</strong><br>
          Für ActaNex Free benötigen Sie weder ein Zahlungsmittel bei uns noch ein kostenpflichtiges Cloud-Abo. Die Community-Version nutzt das dauerhaft kostenlose Cloudflare Free-Kontingent.
        </div>
      </div>

      <!-- Storage Limit Warning -->
      <div class="alert-box amber">
        <i class="fa-solid fa-triangle-exclamation text-amber-400" style="font-size:1.25rem; margin-top:2px;"></i>
        <div>
          <strong>Wichtiger Hinweis zum Speicherlimit:</strong><br>
          Die Free-Version nutzt <strong>Cloudflare D1 SQL-Blob / lokalen Speicher</strong> (ohne R2-Objektspeicher). 
          Dieses Format ist für Einzelanwender und Solo-Freelancer mit geringem Belegvolumen konzipiert (max. 8 MiB pro Beleg, bis 5 GB Gesamtdatenbank). 
          Große PDF-Mengen oder Multi-User-Mandanten erfordern Cloud-Objektspeicher (z. B. Cloudflare R2 im Pro-Tarif).
        </div>
      </div>

      <!-- Primary Option: Cloudflare 1-Click Free SaaS Deployment -->
      <div class="option-card" style="border-color: rgba(16, 185, 129, 0.4); background: rgba(6, 78, 59, 0.15);">
        <div class="option-header">
          <div class="option-badge">1</div>
          <div>
            <h3 style="font-size:1.15rem; font-weight:800; color:#fff;">Option 1: Cloudflare Edge 1-Klick Setup (Free Plan mit D1)</h3>
            <p style="font-size:0.85rem; color:var(--text-muted);">
              Direkte Bereitstellung in Ihrem kostenfreien Cloudflare-Konto mit 100.000 Requests/Tag &amp; 5 GB D1 SQL-Blob.
            </p>
          </div>
        </div>

        <form id="freeDeployForm" onsubmit="handleFreeDeployment(event)">
          <div class="grid-2">
            <div class="form-group">
              <label for="cfAccountId">Cloudflare Account ID *</label>
              <input type="text" id="cfAccountId" placeholder="z. B. 01a23b45c67d89e0f1a23b45c67d89e0" required autocomplete="off" spellcheck="false">
            </div>
            <div class="form-group">
              <label for="cfApiToken">Cloudflare API Token *</label>
              <input type="password" id="cfApiToken" placeholder="Token mit Workers & D1 Edit Rechten" required autocomplete="off">
            </div>
            <div class="form-group">
              <label for="workerName">Worker Script Name *</label>
              <input type="text" id="workerName" value="actanex-open-worker" required>
            </div>
            <div class="form-group">
              <label for="d1DbName">D1 SQL-Datenbank Name *</label>
              <input type="text" id="d1DbName" value="actanex-open-db" required>
            </div>
            <div class="form-group">
              <label for="adminEmail">Admin E-Mail *</label>
              <input type="email" id="adminEmail" placeholder="name@ihre-firma.de" required>
            </div>
            <div class="form-group">
              <label for="adminPassword">Initiales Master-Passwort *</label>
              <input type="password" id="adminPassword" placeholder="Mindestens 10 Zeichen" required>
            </div>
          </div>

          <!-- Hidden storage mode forced to D1 -->
          <input type="hidden" id="fileStorageMode" value="D1">
          <input type="hidden" id="r2BucketName" value="">

          <div style="display:flex; gap:12px; align-items:center; flex-wrap:wrap; margin-top:10px;">
            <button type="submit" class="btn btn-emerald" id="btnDeployFree">
              <i class="fa-solid fa-rocket"></i> Kostenlos in Cloudflare bereitstellen (0 €)
            </button>
            <span style="font-size:0.82rem; color:var(--text-muted);">D1-Modus aktiv &bull; Kein R2 erforderlich</span>
          </div>

          <div id="deployConsole" class="terminal-box" style="display:none; max-height:220px;"></div>
        </form>
      </div>

      <!-- Alternative Local Options -->
      <div class="options-grid">
        <div class="option-card">
          <div class="option-header">
            <div class="option-badge" style="background:rgba(56,189,248,0.2); color:#38bdf8;">2</div>
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff;">Option 2: Docker 1-Klick Container (Lokal)</h3>
              <p style="font-size:0.82rem; color:var(--text-muted);">Isolierter Betrieb auf Ihrem lokalen Server oder NAS mit persistentem SQLite-Volume.</p>
            </div>
          </div>
          <div class="terminal-box">docker run -d -p 3000:3000 -v actanex-data:/data ghcr.io/mkn1411/actanex-open:latest</div>
        </div>

        <div class="option-card">
          <div class="option-header">
            <div class="option-badge" style="background:rgba(148,163,184,0.2); color:#cbd5e1;">3</div>
            <div>
              <h3 style="font-size:1.05rem; font-weight:700; color:#fff;">Option 3: Lokale Node.js Installation via Git</h3>
              <p style="font-size:0.82rem; color:var(--text-muted);">Quellcode klonen und lokalen Zero-Dependency Server starten.</p>
            </div>
          </div>
          <div class="terminal-box">git clone https://github.com/MKN1411/actanex-open.git
cd actanex-open
npm install
npm run setup</div>
        </div>
      </div>

      <!-- Upgrade / Switch Banner -->
      <div style="margin-top:28px; padding:20px; border-radius:14px; background:rgba(30,41,59,0.4); border:1px solid rgba(255,255,255,0.08); display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
        <div>
          <strong style="color:#fff;">Mehr Speicherplatz &amp; R2 Objektspeicher gewünscht?</strong>
          <p style="font-size:0.82rem; color:var(--text-muted); margin-top:2px;">
            Wenn Sie unbegrenzte PDF-Belege und R2-Objektspeicher im BYOL-Tarif nutzen möchten:
          </p>
        </div>
        <a href="https://actanex.app/installer/byol" class="btn btn-secondary" style="font-size:0.85rem;">
          <i class="fa-solid fa-arrow-up-right-from-square"></i> Zum Pro BYOL Installer (2,50 € / mtl.)
        </a>
      </div>
    </div>
  </main>

  <footer>
    <div style="max-width:850px; margin:0 auto 12px; font-size:0.8rem; line-height:1.5;">
      <strong>Rechtlicher Hinweis:</strong> ActaNex ist ein technisches Organisationswerkzeug und Softwarelösung. 
      Keine Steuer- oder Rechtsberatung. Keine Garantiezusagen für das Bestehen steuerlicher Betriebsprüfungen.
    </div>
    &copy; 2026 Michael Kirst-Neshva &bull; ActaNex Open &bull; 
    <a href="https://actanex.app/impressum">Impressum</a> &bull;
    <a href="https://actanex.app/datenschutz">Datenschutz</a> &bull;
    <a href="https://actanex.app/nutzungsbedingungen">Nutzungsbedingungen</a>
  </footer>

  <script>
    // 1. Parse URL Parameters (?subdomain=...&email=...)
    const params = new URLSearchParams(window.location.search);
    const subParam = params.get("subdomain");
    const emailParam = params.get("email");

    if (subParam || emailParam) {
      const banner = document.getElementById("subdomainContextBanner");
      const title = document.getElementById("bannerTitle");
      const desc = document.getElementById("bannerDesc");

      if (banner) banner.style.display = "block";
      if (subParam) {
        title.textContent = "Reservierte Subdomain erkannt: " + subParam + ".open.actanex.app";
        desc.textContent = "Ihre Wunsch-Subdomain " + subParam + " wurde übernommen. Sie können die kostenfreie Community-Version hier mit D1 SQL-Blob Speicher einrichten.";
        const workerInput = document.getElementById("workerName");
        const dbInput = document.getElementById("d1DbName");
        if (workerInput) workerInput.value = "actanex-" + subParam + "-worker";
        if (dbInput) dbInput.value = "actanex-" + subParam + "-db";
      }
      if (emailParam) {
        const emailInput = document.getElementById("adminEmail");
        if (emailInput) emailInput.value = emailParam;
      }
    }

    function logConsole(msg) {
      const c = document.getElementById("deployConsole");
      c.style.display = "block";
      c.textContent += msg + "\\n";
      c.scrollTop = c.scrollHeight;
    }

    async function handleFreeDeployment(e) {
      e.preventDefault();
      const btn = document.getElementById("btnDeployFree");
      btn.disabled = true;

      const payload = {
        cfAccountId: document.getElementById("cfAccountId").value.trim(),
        cfApiToken: document.getElementById("cfApiToken").value.trim(),
        workerName: document.getElementById("workerName").value.trim(),
        d1DbName: document.getElementById("d1DbName").value.trim(),
        fileStorageMode: "D1",
        r2BucketName: "",
        adminEmail: document.getElementById("adminEmail").value.trim(),
        adminPassword: document.getElementById("adminPassword").value.trim(),
        adminFullName: "Administrator",
        jwtSecret: Array.from(crypto.getRandomValues(new Uint8Array(32)), b => b.toString(16).padStart(2, "0")).join(""),
        gitHubRepo: "MKN1411/actanex-open",
        gitHubBranch: "main"
      };

      const c = document.getElementById("deployConsole");
      c.textContent = "";
      logConsole("=== Starte ActaNex Free Cloudflare Edge Bereitstellung ===");
      logConsole("[1/4] Prüfe Cloudflare Account & Token...");

      try {
        const res = await fetch("/api/v1/installer/provision", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success) {
          logConsole("✓ Cloudflare Account & Berechtigungen validiert.");
          logConsole("✓ D1 SQL-Datenbank '" + payload.d1DbName + "' erfolgreich bereitgestellt.");
          logConsole("✓ Dateispeichermodus D1 (SQL-Blob, ohne R2) aktiviert.");
          logConsole("✓ GoBD- & Schemamigrationen (0001–0020) eingespielt.");
          logConsole("✓ Master-Admin '" + payload.adminEmail + "' in D1 angelegt.");

          const liveUrl = (data.resources && data.resources.workerScript && data.resources.workerScript.liveUrl) 
            ? data.resources.workerScript.liveUrl 
            : "https://" + payload.workerName + ".workers.dev";

          logConsole("=================================================");
          logConsole("🎉 ERFOLG: Ihre kostenlose ActaNex-Instanz ist online!");
          logConsole("👉 URL: " + liveUrl);
          logConsole("🔑 Login: " + payload.adminEmail);
          logConsole("=================================================");
          alert("Glückwunsch! Ihre kostenfreie ActaNex-Instanz wurde erfolgreich bereitgestellt.");
        } else {
          logConsole("✕ Bereitstellungsfehler: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        logConsole("✕ Netzwerkfehler: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
