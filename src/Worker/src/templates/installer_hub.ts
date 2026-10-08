/**
 * INSTALLER HUB TEMPLATE
 * Route: https://actanex.app/installer
 * Übersicht & Paket-Auswahl für Installer
 * (c) 2026 ActaNex Open Contributors
 */

export function renderInstallerHub(): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex Setup & Installation – Installer-Übersicht</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🚀</text></svg>">
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
      --indigo: #6366f1;
      --emerald: #10b981;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top center, #1e1b4b 0%, var(--bg-main) 60%);
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
      max-width: 1200px;
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
    .brand span { color: var(--cyan); }
    .nav-links a {
      color: var(--text-muted);
      text-decoration: none;
      font-size: 0.9rem;
      margin-left: 18px;
      transition: color 0.2s;
    }
    .nav-links a:hover { color: #fff; }
    main {
      flex: 1;
      max-width: 1100px;
      width: 100%;
      margin: 40px auto;
      padding: 0 24px;
    }
    .hero {
      text-align: center;
      margin-bottom: 48px;
    }
    .badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 6px 14px;
      border-radius: 9999px;
      background: rgba(99, 102, 241, 0.15);
      border: 1px solid rgba(99, 102, 241, 0.3);
      color: #a5b4fc;
      font-size: 0.85rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    h1 {
      font-size: 2.5rem;
      font-weight: 800;
      margin-bottom: 16px;
      background: linear-gradient(135deg, #fff 40%, var(--cyan) 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    p.subtitle {
      color: var(--text-muted);
      font-size: 1.1rem;
      max-width: 680px;
      margin: 0 auto;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
      margin-top: 32px;
    }
    .card {
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: 20px;
      padding: 32px;
      backdrop-filter: blur(16px);
      display: flex;
      flex-direction: column;
      position: relative;
      transition: transform 0.2s, border-color 0.2s;
    }
    .card:hover {
      transform: translateY(-4px);
      border-color: rgba(56, 189, 248, 0.3);
    }
    .card.highlight {
      border-color: rgba(16, 185, 129, 0.4);
      background: rgba(17, 24, 39, 0.85);
      box-shadow: 0 0 30px rgba(16, 185, 129, 0.1);
    }
    .card-tag {
      position: absolute;
      top: 16px;
      right: 16px;
      padding: 4px 10px;
      border-radius: 9999px;
      font-size: 0.75rem;
      font-weight: 700;
    }
    .tag-free { background: rgba(16, 185, 129, 0.2); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.3); }
    .tag-pro { background: rgba(56, 189, 248, 0.2); color: #38bdf8; border: 1px solid rgba(56, 189, 248, 0.3); }
    .tag-coming { background: rgba(148, 163, 184, 0.15); color: #94a3b8; border: 1px solid rgba(148, 163, 184, 0.2); }
    .card-title {
      font-size: 1.35rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 8px;
    }
    .card-price {
      font-size: 2rem;
      font-weight: 800;
      color: #fff;
      margin-bottom: 16px;
    }
    .card-price span {
      font-size: 0.9rem;
      color: var(--text-dim);
      font-weight: 500;
    }
    .card-desc {
      color: var(--text-muted);
      font-size: 0.9rem;
      line-height: 1.6;
      margin-bottom: 24px;
      flex: 1;
    }
    .notice-box {
      background: rgba(234, 88, 12, 0.1);
      border: 1px solid rgba(234, 88, 12, 0.25);
      border-radius: 10px;
      padding: 12px;
      margin-bottom: 20px;
      font-size: 0.8rem;
      color: #fdba74;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 14px 20px;
      border-radius: 12px;
      font-weight: 700;
      font-size: 0.95rem;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-primary {
      background: linear-gradient(135deg, var(--emerald), #059669);
      color: #fff;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.3);
    }
    .btn-primary:hover { opacity: 0.95; transform: scale(1.02); }
    .btn-pro {
      background: linear-gradient(135deg, var(--indigo), #4f46e5);
      color: #fff;
      box-shadow: 0 4px 14px rgba(99, 102, 241, 0.3);
    }
    .btn-pro:hover { opacity: 0.95; transform: scale(1.02); }
    .btn-disabled {
      background: rgba(255, 255, 255, 0.05);
      color: var(--text-dim);
      cursor: not-allowed;
      border: 1px solid rgba(255, 255, 255, 0.05);
    }
    .disclaimer-card {
      background: rgba(15, 23, 42, 0.6);
      border: 1px solid var(--border-subtle);
      border-radius: 16px;
      padding: 20px;
      margin-top: 40px;
      font-size: 0.85rem;
      color: var(--text-dim);
      text-align: center;
    }
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
      <i class="fa-solid fa-cube" style="color:var(--cyan);"></i>
      ActaNex <span>Open</span>
    </a>
    <div class="nav-links">
      <a href="https://actanex.app"><i class="fa-solid fa-house"></i> Startseite</a>
      <a href="https://actanex.app/update" style="color:#38bdf8; font-weight:700;"><i class="fa-solid fa-arrows-rotate"></i> Update-Center</a>
      <a href="https://actanex.app/#pakete"><i class="fa-solid fa-tags"></i> Pakete &amp; Preise</a>
    </div>
  </header>

  <main>
    <div class="hero">
      <div class="badge"><i class="fa-solid fa-cubes"></i> Installations-Zentrum</div>
      <h1>Wählen Sie Ihre Bereitstellungs-Methode</h1>
      <p class="subtitle">Wählen Sie zwischen der kostenlosen Community-Version, der Pro Self-Service-Installation oder führen Sie ein Update einer bestehenden Instanz durch.</p>
    </div>

    <!-- Update-Banner -->
    <div style="background:rgba(56,189,248,0.1); border:1px solid rgba(56,189,248,0.3); border-radius:14px; padding:16px 22px; margin-bottom:28px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:16px;">
      <div style="display:flex; align-items:center; gap:12px;">
        <i class="fa-solid fa-arrows-rotate" style="color:#38bdf8; font-size:1.3rem;"></i>
        <div>
          <strong style="color:#fff;">Bestehende ActaNex-Instanz aktualisieren?</strong>
          <p style="font-size:0.85rem; color:var(--text-muted); margin:0;">Nutzen Sie das automatisierte Update-Center mit D1-Snapshot-Pflichtsicherung vor dem Rollout.</p>
        </div>
      </div>
      <a href="https://actanex.app/update" class="btn btn-pro" style="padding:10px 18px; font-size:0.88rem;">
        <i class="fa-solid fa-arrow-right"></i> Zum Update-Center
      </a>
    </div>

    <div class="grid">
      <!-- 1. Community Version (Free) -->
      <div class="card highlight">
        <span class="card-tag tag-free">Kostenlos &bull; Kein Abo</span>
        <div class="card-title">ActaNex Free (Community)</div>
        <div class="card-price">0,00 € <span>dauerhaft frei</span></div>
        <div class="card-desc">
          Die Open-Source-Version für Einsteiger & Solo-Freelancer. Läuft mit SQLite / lokalem SQL-Blob-Speicher.
          <ul style="margin-top:12px; padding-left:18px; font-size:0.85rem; color:var(--text-muted);">
            <li>100% kostenfrei & Open Source</li>
            <li>Keine Kreditkarte notwendig</li>
            <li>Zeiterfassung & Reisekosten</li>
          </ul>
        </div>
        <div class="notice-box">
          <strong><i class="fa-solid fa-triangle-exclamation"></i> Hinweis zum Speicherlimit:</strong><br>
          Nutzung von lokalem SQLite/SQL-Blob Speicher. Das Speichervolumen ist für Einzelstarter mit geringem Belegaufkommen ausgelegt.
        </div>
        <a href="https://actanex.app/installer/community" class="btn btn-primary">
          <i class="fa-solid fa-play"></i> Zum Community-Installer
        </a>
      </div>

      <!-- 2. Pro Self Service (BYOL) -->
      <div class="card">
        <span class="card-tag tag-pro">BYOL &bull; Cloudflare</span>
        <div class="card-title">ActaNex Pro (Self Service)</div>
        <div class="card-price">2,50 € <span>/ Monat</span></div>
        <div class="card-desc">
          Automatisierter Bereitstellungs- & Update-Assistent für Ihr eigenes Cloudflare-Konto (Bring Your Own License/Account).
          <ul style="margin-top:12px; padding-left:18px; font-size:0.85rem; color:var(--text-muted);">
            <li>Cloudflare D1 & R2 Speicher</li>
            <li>Inklusive Update- & Backup-Wizard</li>
            <li>Limits aus Cloudflare workers:free</li>
          </ul>
        </div>
        <div style="font-size:0.8rem; color:var(--text-dim); margin-bottom:20px;">
          <i class="fa-solid fa-cloud"></i> Erfordert Cloudflare Account & API-Token.
        </div>
        <a href="https://actanex.app/installer/byol" class="btn btn-pro">
          <i class="fa-solid fa-server"></i> Zum BYOL-Installer
        </a>
      </div>

      <!-- 3. Pro Managed (Demnächst verfügbar) -->
      <div class="card" style="opacity: 0.75;">
        <span class="card-tag tag-coming">Demnächst verfügbar</span>
        <div class="card-title">ActaNex Pro (Managed)</div>
        <div class="card-price">5,00 € <span>/ Monat</span></div>
        <div class="card-desc">
          Vollständig verwaltetes Hosting auf ActaNex-Infrastruktur mit eigener Wunsch-Subdomain (<code>*.hub.actanex.app</code>).
          <ul style="margin-top:12px; padding-left:18px; font-size:0.85rem; color:var(--text-dim);">
            <li>Zero-Touch Einrichtung ohne Cloudflare-Konto</li>
            <li>Tägliche automatisierte D1-Sicherungen</li>
            <li>Automatisches Update-Management</li>
          </ul>
        </div>
        <button class="btn btn-disabled" disabled>
          <i class="fa-solid fa-clock"></i> Demnächst verfügbar
        </button>
      </div>

      <!-- 4. Pro+ Managed (Demnächst verfügbar) -->
      <div class="card" style="opacity: 0.75;">
        <span class="card-tag tag-coming">Demnächst verfügbar</span>
        <div class="card-title">ActaNex Pro+ (Managed)</div>
        <div class="card-price">8,50 € <span>/ Monat</span></div>
        <div class="card-desc">
          High-Performance Enterprise Hosting mit Cloudflare Pro Plan Merkmalen, erweiterter WAF und priorisierter KI-Inferenz.
          <ul style="margin-top:12px; padding-left:18px; font-size:0.85rem; color:var(--text-dim);">
            <li>Cloudflare Pro Edge Performance</li>
            <li>Priorisierte Gemini & LLaMA KI-Inferenz</li>
            <li>Unbegrenzte Revisionshistorie</li>
          </ul>
        </div>
        <button class="btn btn-disabled" disabled>
          <i class="fa-solid fa-clock"></i> Demnächst verfügbar
        </button>
      </div>
    </div>

    <div class="disclaimer-card">
      <i class="fa-solid fa-shield-halved" style="color:var(--cyan); margin-right:6px;"></i>
      <strong>Rechtlicher Hinweis:</strong> ActaNex ist eine technische Softwarelösung und Rechenhilfe. Keine Steuer- oder Rechtsberatung. 
      Keine Garantiezusagen über behördliche Prüfungen. Die Verantwortung für die steuerliche Richtigkeit verbleibt beim Anwender.
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
