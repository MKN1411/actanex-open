/**
 * ACTANEX UPDATE & WARTUNGS-CENTER TEMPLATE
 * Route: https://actanex.app/update & /updater
 * Zero-Downtime Cloudflare Updates, Schema-Migrationen & Snapshot-Rollback
 * (c) 2026 ActaNex Open Contributors
 */

export function renderUpdaterPage(): string {
  return `<!DOCTYPE html>
<html lang="de" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex Update-Center – Cloudflare Instanz aktualisieren & sichern</title>
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>🔄</text></svg>">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
  <style>
    :root {
      --bg-main: #090d16;
      --bg-card: rgba(17, 24, 39, 0.75);
      --border-subtle: rgba(255, 255, 255, 0.08);
      --border-focus: rgba(56, 189, 248, 0.5);
      --text-main: #f8fafc;
      --text-muted: #94a3b8;
      --text-dim: #64748b;
      --cyan: #38bdf8;
      --indigo: #6366f1;
      --emerald: #10b981;
      --amber: #f59e0b;
      --rose: #f43f5e;
    }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      background: radial-gradient(circle at top center, #1e1b4b 0%, var(--bg-main) 60%);
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
    .brand span { color: var(--cyan); }
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
      max-width: 1000px;
      width: 100%;
      margin: 36px auto;
      padding: 0 20px;
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
      margin-bottom: 10px;
      letter-spacing: -0.5px;
    }
    p.lead {
      color: var(--text-muted);
      font-size: 1rem;
      margin-bottom: 24px;
      line-height: 1.6;
    }
    .info-box {
      border-radius: 12px;
      padding: 16px 20px;
      margin-bottom: 24px;
      font-size: 0.88rem;
      display: flex;
      gap: 14px;
      align-items: flex-start;
      line-height: 1.5;
    }
    .info-box.blue {
      background: rgba(56, 189, 248, 0.1);
      border: 1px solid rgba(56, 189, 248, 0.3);
      color: #bae6fd;
    }
    .info-box.amber {
      background: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      color: #fde68a;
    }
    .info-box.emerald {
      background: rgba(16, 185, 129, 0.1);
      border: 1px solid rgba(16, 185, 129, 0.3);
      color: #a7f3d0;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
    }
    @media (max-width: 768px) {
      .grid-2 { grid-template-columns: 1fr; }
    }
    .form-group {
      margin-bottom: 18px;
    }
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
      border-color: var(--cyan);
      box-shadow: 0 0 0 3px rgba(56, 189, 248, 0.2);
    }
    .btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 10px;
      padding: 12px 22px;
      border-radius: 10px;
      font-size: 0.95rem;
      font-weight: 700;
      cursor: pointer;
      border: none;
      transition: all 0.2s;
      text-decoration: none;
    }
    .btn-primary {
      background: linear-gradient(135deg, #0284c7, #4f46e5);
      color: #fff;
      box-shadow: 0 4px 15px rgba(2, 132, 199, 0.35);
    }
    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(2, 132, 199, 0.5);
    }
    .btn-success {
      background: linear-gradient(135deg, #059669, #10b981);
      color: #fff;
    }
    .btn-secondary {
      background: rgba(30, 41, 59, 0.8);
      border: 1px solid rgba(255, 255, 255, 0.15);
      color: #e2e8f0;
    }
    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
      transform: none !important;
    }
    .status-panel {
      background: #020617;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 12px;
      padding: 18px 20px;
      margin-top: 20px;
      font-family: 'JetBrains Mono', monospace;
      font-size: 0.84rem;
      color: #e2e8f0;
      white-space: pre-wrap;
      overflow-x: auto;
      max-height: 280px;
    }
    .checkbox-row {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      margin: 16px 0;
      font-size: 0.88rem;
      color: #cbd5e1;
      cursor: pointer;
    }
    .checkbox-row input {
      width: 18px;
      height: 18px;
      margin-top: 2px;
      accent-color: var(--cyan);
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
      <i class="fa-solid fa-cube text-cyan-400"></i>
      <div>ActaNex <span>Update-Center</span></div>
    </a>
    <div class="nav-links">
      <a href="https://actanex.app">Hauptseite</a>
      <a href="https://actanex.app/installer">Installer-Hub</a>
      <a href="https://actanex.app/installer/byol">BYOL Setup</a>
      <a href="https://actanex.app/installer/community">Free Community</a>
    </div>
  </header>

  <main>
    <div class="card">
      <div style="display:inline-flex; align-items:center; gap:8px; padding:4px 14px; border-radius:9999px; background:rgba(56,189,248,0.12); border:1px solid rgba(56,189,248,0.35); color:var(--cyan); font-size:0.75rem; font-weight:700; margin-bottom:16px;">
        <i class="fa-solid fa-shield-halved"></i> Zero-Downtime • D1 Snapshot Pflichtsicherung
      </div>
      <h1>ActaNex Instanz aktualisieren &amp; warten</h1>
      <p class="lead">
        Bringen Sie Ihre bestehende Cloudflare-Instanz auf den neuesten Stand. Alle Benutzer, Passwörter, Lexware-Keys, Zeiteinträge und Belege bleiben vollständig erhalten. Vor jedem Update wird automatisch eine Cloudflare-Sicherung erstellt.
      </p>

      <div class="info-box blue">
        <i class="fa-solid fa-circle-info" style="font-size:1.2rem; margin-top:2px;"></i>
        <div>
          <strong>Rechtefreie Vorprüfung:</strong> Sie können Ihren Cloudflare-Account jederzeit gefahrlos auf installierte Instanzen scannen und ausstehende Schemaänderungen prüfen. Keine Änderungen werden ohne Ihre ausdrückliche Bestätigung durchgeführt.
        </div>
      </div>

      <form id="updateForm" onsubmit="handleCheckUpdate(event)">
        <div class="grid-2">
          <div class="form-group">
            <label for="cfAccountId">Cloudflare Account ID *</label>
            <input type="text" id="cfAccountId" placeholder="z. B. 01a23b45c67d89e0f1a23b45c67d89e0" required autocomplete="off" spellcheck="false">
          </div>
          <div class="form-group">
            <label for="cfApiToken">Cloudflare API Token *</label>
            <input type="password" id="cfApiToken" placeholder="Bearer Token (Workers, D1, R2 Edit)" required autocomplete="off">
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-bottom:24px; flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" onclick="discoverInstances()" id="btnDiscover">
            <i class="fa-solid fa-radar"></i> Instanzen im Account erkennen
          </button>
          <span id="discoveryStatus" style="font-size:0.85rem; color:var(--text-muted); align-self:center;"></span>
        </div>

        <div id="instanceSelectBox" class="form-group" style="display:none;">
          <label for="discoveredSelect">Erkannte ActaNex-Instanz</label>
          <select id="discoveredSelect" onchange="applyDiscoveredInstance()">
            <option value="">Bitte Instanz wählen...</option>
          </select>
        </div>

        <div class="grid-2">
          <div class="form-group">
            <label for="workerName">Worker Script Name *</label>
            <input type="text" id="workerName" value="actanex-open-worker" required>
          </div>
          <div class="form-group">
            <label for="d1DbName">D1 SQL-Datenbank Name *</label>
            <input type="text" id="d1DbName" value="actanex-open-db" required>
          </div>
          <div class="form-group">
            <label for="r2BucketName">R2 Object Storage Bucket (optional bei D1-Mode)</label>
            <input type="text" id="r2BucketName" value="actanex-open-storage">
          </div>
          <div class="form-group">
            <label for="fileStorageMode">Speichermodus</label>
            <select id="fileStorageMode">
              <option value="R2">Cloudflare R2 (Objektspeicher)</option>
              <option value="D1">Cloudflare D1 (SQL-Blob, ohne R2)</option>
            </select>
          </div>
          <div class="form-group">
            <label for="gitHubRepo">Quell-Repository</label>
            <input type="text" id="gitHubRepo" value="MKN1411/actanex-open" required>
          </div>
          <div class="form-group">
            <label for="gitHubBranch">Zielversion (Branch, Tag oder Commit)</label>
            <input type="text" id="gitHubBranch" value="main" required>
          </div>
        </div>

        <div style="display:flex; gap:12px; margin-top:10px; flex-wrap:wrap;">
          <button type="submit" class="btn btn-primary" id="btnCheck">
            <i class="fa-solid fa-magnifying-glass"></i> Update prüfen
          </button>
          <button type="button" class="btn btn-secondary" onclick="loadBackups()" id="btnLoadBackups">
            <i class="fa-solid fa-clock-rotate-left"></i> Sicherungen laden
          </button>
        </div>
      </form>

      <!-- Update Plan Panel (Hidden initially) -->
      <div id="updatePlanPanel" style="display:none; margin-top:28px; padding-top:24px; border-top:1px solid var(--border-subtle);">
        <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:12px; color:#fff;">
          <i class="fa-solid fa-list-check text-cyan-400"></i> Geplantes Update
        </h3>
        <div id="updatePlanSummary" class="status-panel"></div>

        <label class="checkbox-row">
          <input type="checkbox" id="confirmUpdate">
          <span>Ich bestätige das Update. Die Zielversion darf Codeanpassungen aktualisieren. Vor dem Rollout wird eine vollständige Sicherung in Cloudflare D1 erstellt.</span>
        </label>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
          <button type="button" class="btn btn-success" id="btnApplyUpdate" onclick="applyUpdate()" disabled>
            <i class="fa-solid fa-rocket"></i> Update jetzt ausführen
          </button>
          <button type="button" class="btn btn-secondary" onclick="createBackupManual()">
            <i class="fa-solid fa-download"></i> Nur Sicherung erstellen
          </button>
        </div>
      </div>

      <!-- Execution Log Panel -->
      <div id="logPanel" class="status-panel" style="display:none;"></div>

      <!-- Backups & Rollback Section -->
      <div id="backupsPanel" style="display:none; margin-top:28px; padding-top:24px; border-top:1px solid var(--border-subtle);">
        <h3 style="font-size:1.25rem; font-weight:800; margin-bottom:12px; color:#fff;">
          <i class="fa-solid fa-box-archive text-amber-400"></i> Cloudflare-Sicherungen &amp; Rollback
        </h3>
        <p style="font-size:0.85rem; color:var(--text-muted); margin-bottom:16px;">
          Stellen Sie einen vorherigen Stand wieder her oder laden Sie vollständige SQL-Dumps herunter.
        </p>

        <div class="form-group">
          <label for="backupSelect">Vorhandene Sicherungen</label>
          <select id="backupSelect" onchange="showSelectedBackupDetails()">
            <option value="">Keine Sicherung ausgewählt</option>
          </select>
        </div>
        <div id="backupDetailsBox" class="status-panel" style="display:none; max-height:160px;"></div>

        <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
          <button type="button" class="btn btn-secondary" id="btnDownloadSql" onclick="downloadBackupSql()" disabled>
            <i class="fa-solid fa-file-code"></i> SQL-Dump herunterladen
          </button>
          <button type="button" class="btn btn-secondary" id="btnCheckRestore" onclick="checkRestorePlan()" disabled>
            <i class="fa-solid fa-rotate-left"></i> Wiederherstellung prüfen
          </button>
        </div>

        <div id="restorePlanPanel" style="display:none; margin-top:20px; padding:16px; border-radius:12px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3);">
          <div id="restoreSummaryText" style="font-size:0.85rem; color:#fca5a5; margin-bottom:12px;"></div>
          <label class="checkbox-row" style="color:#fca5a5;">
            <input type="checkbox" id="confirmRestore">
            <span>Achtung: Ich bestätige die Wiederherstellung. Alle Datenänderungen seit diesem Sicherungszeitpunkt werden auf diesen Stand zurückgesetzt.</span>
          </label>
          <button type="button" class="btn" style="background:#dc2626; color:#fff;" id="btnExecuteRestore" onclick="executeRestore()" disabled>
            <i class="fa-solid fa-triangle-exclamation"></i> Wiederherstellung jetzt ausführen
          </button>
        </div>
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
    let discoveredInstancesList = [];
    let currentPlan = null;
    let currentBackups = [];
    let currentRestorePlan = null;

    function log(msg) {
      const panel = document.getElementById("logPanel");
      panel.style.display = "block";
      panel.textContent += msg + "\\n";
      panel.scrollTop = panel.scrollHeight;
    }

    function clearLog() {
      const panel = document.getElementById("logPanel");
      panel.textContent = "";
      panel.style.display = "none";
    }

    function getCredentials() {
      return {
        cfAccountId: document.getElementById("cfAccountId").value.trim(),
        cfApiToken: document.getElementById("cfApiToken").value.trim(),
        workerName: document.getElementById("workerName").value.trim(),
        d1DbName: document.getElementById("d1DbName").value.trim(),
        r2BucketName: document.getElementById("r2BucketName").value.trim(),
        fileStorageMode: document.getElementById("fileStorageMode").value,
        gitHubRepo: document.getElementById("gitHubRepo").value.trim(),
        gitHubBranch: document.getElementById("gitHubBranch").value.trim()
      };
    }

    async function discoverInstances() {
      const creds = getCredentials();
      const statusEl = document.getElementById("discoveryStatus");
      const btn = document.getElementById("btnDiscover");
      if (!creds.cfAccountId || !creds.cfApiToken) {
        statusEl.textContent = "Bitte Account-ID und API-Token eingeben.";
        return;
      }

      btn.disabled = true;
      statusEl.textContent = "Suche nach ActaNex-Instanzen im Cloudflare-Account...";
      try {
        const res = await fetch("/api/v1/installer/discover", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds)
        });
        const data = await res.json();
        if (data.success && data.instances && data.instances.length > 0) {
          discoveredInstancesList = data.instances;
          statusEl.textContent = "✓ " + data.instances.length + " Instanz(en) gefunden.";
          const sel = document.getElementById("discoveredSelect");
          sel.innerHTML = '<option value="">Gefundene Instanz auswählen...</option>';
          data.instances.forEach(i => {
            const opt = document.createElement("option");
            opt.value = i.workerName;
            opt.textContent = i.workerName + " (Version: " + (i.version || "Altinstallation") + ")";
            sel.appendChild(opt);
          });
          document.getElementById("instanceSelectBox").style.display = "block";
        } else {
          statusEl.textContent = "Keine vorhandenen Instanzen gefunden (neu einrichten).";
        }
      } catch (err) {
        statusEl.textContent = "Fehler bei der Erkennung: " + err.message;
      } finally {
        btn.disabled = false;
      }
    }

    function applyDiscoveredInstance() {
      const selVal = document.getElementById("discoveredSelect").value;
      const inst = discoveredInstancesList.find(i => i.workerName === selVal);
      if (inst) {
        document.getElementById("workerName").value = inst.workerName;
        document.getElementById("d1DbName").value = inst.d1DbName || "actanex-open-db";
        if (inst.r2BucketName) document.getElementById("r2BucketName").value = inst.r2BucketName;
        if (inst.fileStorageMode) document.getElementById("fileStorageMode").value = inst.fileStorageMode;
      }
    }

    async function handleCheckUpdate(e) {
      e.preventDefault();
      clearLog();
      const creds = getCredentials();
      const btn = document.getElementById("btnCheck");
      btn.disabled = true;
      log("Prüfe Version, GitHub-Releases und Cloudflare-Ressourcen...");

      try {
        const res = await fetch("/api/v1/installer/update-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds)
        });
        const data = await res.json();
        if (data.success) {
          currentPlan = data;
          document.getElementById("updatePlanPanel").style.display = "block";
          const summary = [
            "Installierte Version : " + data.installedVersion,
            "Zielversion          : " + data.targetVersion + " (Commit: " + data.targetCommit + ")",
            "Worker Script        : " + data.resources.worker,
            "D1 Datenbank         : " + data.resources.database,
            "Speichermodus        : " + (data.resources.fileStorageMode || "R2"),
            "Ausstehende Migration: " + (data.migrations ? data.migrations.length : 0) + " Schema-Dateien",
            ...(data.changes ? data.changes : [])
          ].join("\\n");
          document.getElementById("updatePlanSummary").textContent = summary;
          log("✓ Update-Prüfung erfolgreich abgeschlossen. Bereit zur Ausführung.");
        } else {
          log("✕ Prüfung fehlgeschlagen: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        log("✕ Netzwerkfehler: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    document.getElementById("confirmUpdate").addEventListener("change", function() {
      document.getElementById("btnApplyUpdate").disabled = !this.checked || !currentPlan;
    });

    async function applyUpdate() {
      if (!currentPlan) return;
      const creds = getCredentials();
      const btn = document.getElementById("btnApplyUpdate");
      btn.disabled = true;
      log("\\n=== Starte Update-Rollout ===");
      log("1. Erstelle automatische Cloudflare D1 & Worker Sicherung...");

      try {
        const payload = {
          ...creds,
          targetCommit: currentPlan.targetCommit,
          planId: currentPlan.planId
        };

        const res = await fetch("/api/v1/installer/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (data.success) {
          log("✓ Sicherung erfolgreich gespeichert. Backup-ID: " + data.backupId);
          log("✓ Schema-Migrationen eingespielt: " + data.migrations);
          log("✓ Worker Script aktualisiert auf Version " + data.version);
          log("✓ D1 Wiederherstellungspunkt: " + data.bookmark);
          log("🎉 Update erfolgreich abgeschlossen! Ihre Instanz ist sofort unter der Worker-URL verfügbar.");
          alert("Update erfolgreich abgeschlossen!");
          loadBackups();
        } else {
          log("✕ Update fehlgeschlagen: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        log("✕ Fehler beim Rollout: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    async function loadBackups() {
      const creds = getCredentials();
      const btn = document.getElementById("btnLoadBackups");
      btn.disabled = true;
      try {
        const res = await fetch("/api/v1/installer/backup-list", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(creds)
        });
        const data = await res.json();
        if (data.success && data.backups) {
          currentBackups = data.backups;
          document.getElementById("backupsPanel").style.display = "block";
          const sel = document.getElementById("backupSelect");
          sel.innerHTML = '<option value="">Sicherungsstand auswählen...</option>';
          data.backups.forEach(b => {
            const opt = document.createElement("option");
            opt.value = b.id;
            opt.textContent = new Date(b.createdAt).toLocaleString("de-DE") + " | " + (b.version || "Version unbekannt") + " | " + Math.round(b.sqlBytes/1024) + " KiB SQL";
            sel.appendChild(opt);
          });
          log("✓ " + data.backups.length + " Sicherungen geladen.");
        } else {
          log("Keine Sicherungen gefunden oder Zugriff verweigert.");
        }
      } catch (err) {
        log("Fehler beim Laden der Sicherungen: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }

    function showSelectedBackupDetails() {
      const bId = document.getElementById("backupSelect").value;
      const b = currentBackups.find(item => item.id === bId);
      const box = document.getElementById("backupDetailsBox");
      const btnDl = document.getElementById("btnDownloadSql");
      const btnCheckRes = document.getElementById("btnCheckRestore");

      if (b) {
        box.style.display = "block";
        box.textContent = [
          "Sicherungs-ID : " + b.id,
          "Erstellt am   : " + new Date(b.createdAt).toLocaleString("de-DE"),
          "Version       : " + (b.version || "Altinstallation"),
          "SQL Dump Größe: " + (b.sqlBytes ? (b.sqlBytes/1024).toFixed(1) + " KiB" : "n/a"),
          "Release-ID    : " + (b.releaseId || "n/a")
        ].join("\\n");
        btnDl.disabled = false;
        btnCheckRes.disabled = false;
      } else {
        box.style.display = "none";
        btnDl.disabled = true;
        btnCheckRes.disabled = true;
      }
    }

    async function downloadBackupSql() {
      const bId = document.getElementById("backupSelect").value;
      if (!bId) return;
      const creds = getCredentials();
      try {
        log("Lade SQL-Dump herunter...");
        const res = await fetch("/api/v1/installer/backup-download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, backupId: bId })
        });
        const data = await res.json();
        if (data.sql) {
          const blob = new Blob([data.sql], { type: "application/sql" });
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = "actanex-" + bId + ".sql";
          a.click();
          log("✓ SQL-Dump erfolgreich heruntergeladen.");
        }
      } catch (err) {
        log("Download fehlgeschlagen: " + err.message);
      }
    }

    async function checkRestorePlan() {
      const bId = document.getElementById("backupSelect").value;
      if (!bId) return;
      const creds = getCredentials();
      try {
        log("Prüfe Wiederherstellungs-Möglichkeit...");
        const res = await fetch("/api/v1/installer/restore-plan", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...creds, backupId: bId })
        });
        const data = await res.json();
        if (data.success) {
          currentRestorePlan = data;
          document.getElementById("restorePlanPanel").style.display = "block";
          document.getElementById("restoreSummaryText").textContent = "Sicherungszeitpunkt: " + new Date(data.createdAt).toLocaleString("de-DE") + " (Version: " + data.version + ").";
        }
      } catch (err) {
        log("Wiederherstellungsprüfung fehlgeschlagen: " + err.message);
      }
    }

    document.getElementById("confirmRestore").addEventListener("change", function() {
      document.getElementById("btnExecuteRestore").disabled = !this.checked || !currentRestorePlan;
    });

    async function executeRestore() {
      if (!currentRestorePlan) return;
      const bId = document.getElementById("backupSelect").value;
      const creds = getCredentials();
      const btn = document.getElementById("btnExecuteRestore");
      btn.disabled = true;
      log("\\n=== Führe Rollback / Wiederherstellung aus ===");

      try {
        const res = await fetch("/api/v1/installer/restore", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...creds,
            backupId: bId,
            restorePlanId: currentRestorePlan.restorePlanId,
            confirmRestore: true,
            restoreDatabase: true
          })
        });
        const data = await res.json();
        if (data.success) {
          log("✓ Wiederherstellung erfolgreich abgeschlossen! Sicherheitskopie vor dem Rollback: " + data.safetyBackupId);
          alert("Wiederherstellung erfolgreich!");
        } else {
          log("✕ Wiederherstellung fehlgeschlagen: " + (data.error || "Unbekannter Fehler"));
        }
      } catch (err) {
        log("✕ Fehler: " + err.message);
      } finally {
        btn.disabled = false;
      }
    }
  </script>
</body>
</html>`;
}
