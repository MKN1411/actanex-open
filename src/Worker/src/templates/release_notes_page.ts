export function renderReleaseNotesPage(): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="utf-8">
  <title>Release Notes – ActaNex (ACNX)</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><rect width='100' height='100' rx='20' fill='%230f172a'/><path d='M25 75 L50 25 L75 75 Z' fill='none' stroke='%2306b6d4' stroke-width='10' stroke-linejoin='round'/><circle cx='50' cy='58' r='7' fill='%2338bdf8'/></svg>">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --bg: #0b1120;
      --card-bg: rgba(30, 41, 59, 0.75);
      --card-border: rgba(56, 189, 248, 0.2);
      --cyan: #06b6d4;
      --cyan-bright: #38bdf8;
      --text: #f8fafc;
      --text-muted: #94a3b8;
      --accent: #2563eb;
      --emerald: #10b981;
      --purple: #a855f7;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: var(--bg);
      color: var(--text);
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      padding: 30px 20px;
      line-height: 1.6;
      display: flex;
      justify-content: center;
    }
    .container {
      max-width: 920px;
      width: 100%;
    }
    .header-bar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 30px;
      flex-wrap: wrap;
      gap: 16px;
      padding-bottom: 20px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 14px;
    }
    .logo-box {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      background: linear-gradient(135deg, #0284c7, #2563eb);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      color: #fff;
      box-shadow: 0 4px 14px rgba(2, 132, 199, 0.35);
    }
    .header-title h1 {
      font-size: 1.6rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .header-title p {
      font-size: 0.85rem;
      color: var(--text-muted);
    }
    .header-actions {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      border-radius: 8px;
      font-size: 0.85rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.2s ease;
      border: none;
    }
    .btn-outline {
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
    }
    .btn-outline:hover {
      background: rgba(255, 255, 255, 0.1);
      border-color: rgba(255, 255, 255, 0.3);
      color: #fff;
    }
    .btn-primary {
      background: #0284c7;
      color: #fff;
    }
    .btn-primary:hover {
      background: #0369a1;
    }
    .release-card {
      background: var(--card-bg);
      backdrop-filter: blur(12px);
      border: 1px solid var(--card-border);
      border-radius: 14px;
      padding: 24px;
      margin-bottom: 24px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      position: relative;
    }
    .release-card.current {
      border-color: rgba(56, 189, 248, 0.5);
      box-shadow: 0 10px 30px rgba(56, 189, 248, 0.15);
    }
    .release-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 10px;
    }
    .version-title {
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .badge {
      display: inline-block;
      padding: 3px 10px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 700;
      font-family: ui-monospace, monospace;
    }
    .badge-latest {
      background: rgba(16, 185, 129, 0.2);
      color: #34d399;
      border: 1px solid rgba(16, 185, 129, 0.4);
    }
    .badge-previous {
      background: rgba(148, 163, 184, 0.15);
      color: #94a3b8;
      border: 1px solid rgba(148, 163, 184, 0.25);
    }
    .release-meta {
      font-size: 0.85rem;
      color: var(--text-muted);
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .section-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--cyan-bright);
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-top: 18px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .feature-list {
      list-style: none;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .feature-item {
      display: flex;
      align-items: flex-start;
      gap: 10px;
      font-size: 0.9rem;
      color: #e2e8f0;
      background: rgba(15, 23, 42, 0.5);
      padding: 10px 14px;
      border-radius: 8px;
      border-left: 3px solid var(--cyan);
    }
    .feature-item.highlight {
      border-left-color: #38bdf8;
      background: rgba(14, 165, 233, 0.08);
    }
    .feature-item.fix {
      border-left-color: #a855f7;
    }
    .feature-item.security {
      border-left-color: #10b981;
    }
    .feature-icon {
      margin-top: 2px;
      color: var(--cyan-bright);
      font-size: 1rem;
    }
    .feature-text strong {
      color: #fff;
    }
    .tag {
      display: inline-block;
      font-size: 0.7rem;
      padding: 2px 6px;
      border-radius: 4px;
      background: rgba(255, 255, 255, 0.1);
      color: #cbd5e1;
      margin-left: 6px;
      font-family: ui-monospace, monospace;
    }
    .footer-note {
      text-align: center;
      margin-top: 40px;
      font-size: 0.8rem;
      color: var(--text-muted);
      padding-top: 20px;
      border-top: 1px solid rgba(255, 255, 255, 0.08);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header-bar">
      <div class="header-left">
        <div class="logo-box">
          <i class="fa-solid fa-code-branch"></i>
        </div>
        <div class="header-title">
          <h1>ActaNex Release Notes <span style="font-size:0.8rem; font-weight:normal; color:var(--cyan-bright);">(ACNX)</span></h1>
          <p>Offizielle Versionshistorie, Features & Sicherheitsupdates</p>
        </div>
      </div>
      <div class="header-actions">
        <button onclick="window.history.length > 1 ? window.history.back() : window.close()" class="btn btn-outline">
          <i class="fa-solid fa-arrow-left"></i> Zurück zur App
        </button>
        <a href="https://github.com/MKN1411/actanex-open/releases" target="_blank" rel="noopener noreferrer" class="btn btn-primary">
          <i class="fa-brands fa-github"></i> GitHub Releases
        </a>
      </div>
    </div>

    <!-- RELEASE v3.3.1 -->
    <div class="release-card current">
      <div class="release-header">
        <div>
          <div class="version-title">
            <span>Version 3.3.1</span>
            <span class="badge badge-latest"><i class="fa-solid fa-sparkles"></i> Aktuell (GA)</span>
          </div>
          <div class="release-meta">
            <span><i class="fa-regular fa-calendar"></i> 09. Oktober 2026</span>
            <span><i class="fa-solid fa-tag"></i> v3.3.1-ga</span>
            <span><i class="fa-solid fa-shield-halved"></i> GoBD-konform</span>
          </div>
        </div>
      </div>

      <div class="section-title"><i class="fa-solid fa-file-invoice-dollar"></i> Wichtigste Neuerungen & Features</div>
      <ul class="feature-list">
        <li class="feature-item highlight">
          <i class="fa-solid fa-layer-group feature-icon"></i>
          <div class="feature-text">
            <strong>3-Ebenen Stundenzettel-Konsolidierung:</strong>
            Stundenzettel können nun wahlweise über <em>Ebene 1 (Kunde gesamt)</em>, <em>Ebene 2 (Projekt)</em> oder <em>Ebene 3 (Monat/Periode)</em> zur Unterschrift eingereicht und exportiert werden.
            <span class="tag">#Billing</span> <span class="tag">#Timesheet</span>
          </div>
        </li>
        <li class="feature-item highlight">
          <i class="fa-solid fa-user-shield feature-icon"></i>
          <div class="feature-text">
            <strong>Empfänger-Rollen-Auswahl:</strong>
            Flexible Steuerung, an wen der Nachweis adressiert wird (Auftragskunde / Rechnungsempfänger, Endkunde vor Ort oder manuelle Adresse).
            <span class="tag">#Signatur</span>
          </div>
        </li>
        <li class="feature-item">
          <i class="fa-solid fa-print feature-icon"></i>
          <div class="feature-text">
            <strong>Projektgruppierte DIN A4 Druckausgabe & Betragsunterdrückung:</strong>
            Posten werden nach Projekten sauber gegliedert. Auf Wunsch werden Stundensätze und Beträge für reine Leistungsnachweise ausgeblendet (<code>hide_rates</code>).
            <span class="tag">#PDF</span> <span class="tag">#Export</span>
          </div>
        </li>
        <li class="feature-item security">
          <i class="fa-solid fa-cloud-arrow-up feature-icon"></i>
          <div class="feature-text">
            <strong>Flotten-Update & GitHub Discovery v2.0:</strong>
            Cloudflare Workers for Platforms Multi-Tenant-Orchestrierung mit automatischer GitHub Release-Erkennung, Test-Branch-Schleuse für Dev-Instanzen und Mandanten-Opt-Out.
            <span class="tag">#Platform</span>
          </div>
        </li>
        <li class="feature-item">
          <i class="fa-solid fa-credit-card feature-icon"></i>
          <div class="feature-text">
            <strong>Stripe Customer Portal Integration:</strong>
            Direkte Verlinkung und Status-Synchronisation für Self-Service-Abonnements & Kündigungen über Stripe Billing.
            <span class="tag">#Stripe</span>
          </div>
        </li>
      </ul>
    </div>

    <!-- RELEASE v3.2.4 -->
    <div class="release-card">
      <div class="release-header">
        <div>
          <div class="version-title">
            <span>Version 3.2.4</span>
            <span class="badge badge-previous">Vorgängerversion</span>
          </div>
          <div class="release-meta">
            <span><i class="fa-regular fa-calendar"></i> 05. Oktober 2026</span>
            <span><i class="fa-solid fa-tag"></i> v3.2.4-ga</span>
          </div>
        </div>
      </div>

      <div class="section-title"><i class="fa-solid fa-circle-check"></i> Verbesserungen & Fixes</div>
      <ul class="feature-list">
        <li class="feature-item">
          <i class="fa-solid fa-calculator feature-icon"></i>
          <div class="feature-text">
            <strong>Spesen & Verpflegungsmehraufwand (VMA 2026):</strong>
            Aktualisierte Pauschalen für In- und Auslandsreisen nach aktuellem BMF-Schreiben 2026.
          </div>
        </li>
        <li class="feature-item fix">
          <i class="fa-solid fa-bug feature-icon"></i>
          <div class="feature-text">
            <strong>Belegextraktion Fallback:</strong>
            Cloudflare LLaMA Vision Fallback bei temporären Aussetzern externer LLM-APIs.
          </div>
        </li>
      </ul>
    </div>

    <!-- RELEASE v3.2.0 -->
    <div class="release-card">
      <div class="release-header">
        <div>
          <div class="version-title">
            <span>Version 3.2.0</span>
            <span class="badge badge-previous">Meilenstein</span>
          </div>
          <div class="release-meta">
            <span><i class="fa-regular fa-calendar"></i> 20. September 2026</span>
            <span><i class="fa-solid fa-tag"></i> v3.2.0-ga</span>
          </div>
        </div>
      </div>

      <div class="section-title"><i class="fa-solid fa-star"></i> Meilenstein-Funktionen</div>
      <ul class="feature-list">
        <li class="feature-item security">
          <i class="fa-solid fa-lock feature-icon"></i>
          <div class="feature-text">
            <strong>Merkle-Root-Monatssiegel (GoBD § 146 AO):</strong>
            Kryptografische Verkettung aller Monatsbuchungen mit SHA-256 Hash und Prüfprotokoll.
          </div>
        </li>
        <li class="feature-item">
          <i class="fa-solid fa-envelope feature-icon"></i>
          <div class="feature-text">
            <strong>Passwortloses OTP-Freigabeportal:</strong>
            E-Mail-Einmalpasswörter für Kunden ohne festes Benutzerkonto.
          </div>
        </li>
      </ul>
    </div>

    <div class="footer-note">
      ActaNex Platform &bull; Freelancer Evidence & Billing Hub &bull; &copy; 2026 Michael Kirst-Neshva &bull; Alle Rechte vorbehalten.
    </div>
  </div>
</body>
</html>`;
}
