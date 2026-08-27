/**
 * ActaNex - SPA Router & Dynamic Subnav Controller
 * Version 3.0.0
 */

const viewCache = {};
let currentActiveView = "";

const MODULE_DEFINITIONS = {
  "dashboard": {
    title: "Dashboard",
    icon: "fa-chart-pie",
    viewPath: "views/dashboard.html",
    actions: [
      { id: "overview", label: "Übersicht & KPIs", icon: "fa-gauge-high", fn: "loadDashboardStats" },
      { id: "budgets", label: "Projekt-Budgets", icon: "fa-bars-progress", fn: "scrollToBudgets" },
      { id: "unassigned", label: "Unbearbeitete Belege", icon: "fa-inbox", fn: "switchView('vouchers')" }
    ]
  },
  "timesheets": {
    title: "Zeiterfassung",
    icon: "fa-clock",
    viewPath: "views/timesheets.html",
    actions: [
      { id: "list", label: "Zeiten Übersicht", icon: "fa-list-check", fn: "loadTimeEntries" },
      { id: "create", label: "Neue Zeit erfassen", icon: "fa-plus-circle", fn: "openNewTimeEntryForm" },
      { id: "actachron", label: "ActaChron (PWA Stempeluhr)", icon: "fa-stopwatch", external: "/pwa/time-tracker.html" },
      { id: "summary", label: "Stundensummen & Nachweise", icon: "fa-chart-column", fn: "showTimesheetSummary" }
    ]
  },
  "travel": {
    title: "Reisekosten",
    icon: "fa-train-subway",
    viewPath: "views/travel.html",
    actions: [
      { id: "list", label: "Reise Übersicht", icon: "fa-route", fn: "loadTrips" },
      { id: "create", label: "Neue Reise erfassen", icon: "fa-plus-circle", fn: "openNewTripForm" },
      { id: "legs", label: "Etappen-Builder (VMA)", icon: "fa-map-location-dot", fn: "openTripLegsModal" },
      { id: "actavault", label: "ActaVault (PWA Belege)", icon: "fa-vault", external: "/pwa/receipt-inbox.html" }
    ]
  },
  "vouchers": {
    title: "Belege & Inbox",
    icon: "fa-receipt",
    viewPath: "views/vouchers.html",
    actions: [
      { id: "list", label: "Beleg-Übersicht & Inbox", icon: "fa-inbox", fn: "loadVouchers" },
      { id: "create", label: "Neuen Beleg erfassen", icon: "fa-plus-circle", fn: "openNewVoucherForm" },
      { id: "scan", label: "AI Vision Scanner", icon: "fa-wand-magic-sparkles", fn: "openVoucherScanner" },
      { id: "rules", label: "Händler-Regeln (Lernen)", icon: "fa-brain", fn: "openMerchantRulesModal" }
    ]
  },
  "customers": {
    title: "Kunden & Cockpit",
    icon: "fa-building-user",
    viewPath: "views/customers.html",
    actions: [
      { id: "list", label: "Kunden & Mandanten", icon: "fa-users-gear", fn: "loadCustomers" },
      { id: "projects", label: "Projekt-Übersicht", icon: "fa-folder-tree", fn: "loadProjects" },
      { id: "lexsync", label: "Lexware Sync", icon: "fa-rotate", fn: "syncWithLexware" }
    ]
  },
  "billing": {
    title: "Abrechnung",
    icon: "fa-file-invoice-dollar",
    viewPath: "views/billing.html",
    actions: [
      { id: "hierarchy", label: "Abrechnungsübersicht", icon: "fa-file-invoice", fn: "loadBillingHierarchy" },
      { id: "approval", label: "OTP Kundenportal", icon: "fa-signature", fn: "switchView('approval-portal')" },
      { id: "reminders", label: "Mahnwesen & Erinnerungen", icon: "fa-bell", fn: "checkApprovalReminders" }
    ]
  },
  "approval-portal": {
    title: "Kundenfreigabe",
    icon: "fa-signature",
    viewPath: "views/approval.html",
    actions: [
      { id: "admin", label: "Freigabe-Verwaltung", icon: "fa-list", fn: "showAdminApprovalOverview" },
      { id: "test", label: "Zero-Trust OTP Test", icon: "fa-shield-halved", fn: "testOtpFlow" }
    ]
  },
  "audit": {
    title: "GoBD Audit",
    icon: "fa-fingerprint",
    viewPath: "views/audit.html",
    actions: [
      { id: "logs", label: "Revisionsprotokolle", icon: "fa-scroll", fn: "loadAuditLogs" },
      { id: "seals", label: "Monatsarchive versiegeln", icon: "fa-lock", fn: "openSealMonthModal" }
    ]
  },
  "backup": {
    title: "Backup & Export",
    icon: "fa-cloud-arrow-down",
    viewPath: "views/backup.html",
    actions: [
      { id: "sql", label: "Disaster Recovery SQL", icon: "fa-database", fn: "downloadFullSqlBackup" },
      { id: "datev", label: "DATEV EXTF 700 Export", icon: "fa-file-csv", fn: "exportDatevExtf" },
      { id: "lexware", label: "Lexware Offline-CSV", icon: "fa-file-excel", fn: "exportLexwareCsv" },
      { id: "bundle", label: "Diagnose-Bundle", icon: "fa-box-archive", fn: "downloadDiagnosticsBundle" }
    ]
  },
  "settings": {
    title: "Konfiguration",
    icon: "fa-gear",
    viewPath: "views/settings.html",
    actions: [
      { id: "tax", label: "Steuersätze & Pauschalen", icon: "fa-percent", fn: "scrollToSettingsSection('tax')" },
      { id: "profile", label: "Firmenprofil & EÜR", icon: "fa-id-card", fn: "scrollToSettingsSection('profile')" },
      { id: "mail", label: "E-Mail & Benachrichtigung", icon: "fa-envelope", fn: "scrollToSettingsSection('email')" }
    ]
  }
};

function toggleSubnavCollapse() {
  const col = document.getElementById("subnav-column");
  const icon = document.getElementById("subnav-toggle-icon");
  if (col) {
    col.classList.toggle("collapsed");
    if (icon) {
      icon.className = col.classList.contains("collapsed") ? "fa-solid fa-angles-right" : "fa-solid fa-angles-left";
    }
  }
}

function updateSubnav(moduleKey, activeActionId = "") {
  const mod = MODULE_DEFINITIONS[moduleKey];
  if (!mod) return;

  const titleEl = document.getElementById("subnav-active-title");
  if (titleEl) {
    titleEl.innerHTML = `<i class="fa-solid ${mod.icon}" style="color: #38bdf8;"></i> <span>${mod.title}</span>`;
  }

  const container = document.getElementById("subnav-context-items");
  if (!container) return;

  let html = `<div class="subnav-section-title">Aktionen & Navigation</div>`;
  mod.actions.forEach((act, idx) => {
    const isActive = activeActionId ? (act.id === activeActionId) : (idx === 0);
    if (act.external) {
      html += `
        <a href="${act.external}" target="_blank" class="subnav-menu-item" title="${act.label}">
          <i class="fa-solid ${act.icon}" style="color: #38bdf8;"></i>
          <span>${act.label}</span>
          <i class="fa-solid fa-arrow-up-right-from-square" style="margin-left: auto; font-size: 0.7rem; opacity: 0.6;"></i>
        </a>`;
    } else {
      html += `
        <div class="subnav-menu-item ${isActive ? 'active' : ''}" onclick="${act.fn ? act.fn + '()' : ''}" title="${act.label}">
          <i class="fa-solid ${act.icon}"></i>
          <span>${act.label}</span>
        </div>`;
    }
  });

  container.innerHTML = html;
}

async function switchView(viewName, actionId = "") {
  // Alias mapping
  if (viewName === "time-capture") viewName = "timesheets";
  
  const mod = MODULE_DEFINITIONS[viewName];
  if (!mod) return;

  currentActiveView = viewName;

  // 1. Update Rail Buttons
  document.querySelectorAll(".rail-item").forEach(r => r.classList.remove("active"));
  const railBtn = document.getElementById(`rail-btn-${viewName}`) || document.getElementById(`rail-btn-${viewName === 'timesheets' ? 'time-capture' : viewName}`);
  if (railBtn) railBtn.classList.add("active");

  // 2. Update Subnav Column
  updateSubnav(viewName, actionId);

  // 3. Load or Switch View Partial
  const mainContainer = document.getElementById("main-view-container");
  if (!mainContainer) return;

  // Hide all panels
  document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));

  let targetPanel = document.getElementById(`view-${viewName}`);
  if (!targetPanel) {
    try {
      if (!viewCache[viewName]) {
        const res = await fetch(mod.viewPath);
        if (!res.ok) throw new Error(`View ${mod.viewPath} nicht gefunden`);
        viewCache[viewName] = await res.text();
      }
      targetPanel = document.createElement("div");
      targetPanel.id = `view-${viewName}`;
      targetPanel.className = "view-panel active";
      targetPanel.innerHTML = viewCache[viewName];
      mainContainer.appendChild(targetPanel);
    } catch (err) {
      console.error(`Error loading view ${viewName}:`, err);
      return;
    }
  } else {
    targetPanel.classList.add("active");
  }

  // 4. Trigger Module Data Loaders
  if (viewName === "dashboard" && typeof loadDashboardStats === "function") loadDashboardStats();
  if (viewName === "timesheets" && typeof loadTimeEntries === "function") loadTimeEntries();
  if (viewName === "travel" && typeof loadTrips === "function") loadTrips();
  if (viewName === "vouchers" && typeof loadVouchers === "function") loadVouchers();
  if (viewName === "customers" && typeof loadCustomers === "function") loadCustomers();
  if (viewName === "billing" && typeof loadBillingHierarchy === "function") loadBillingHierarchy();
  if (viewName === "approval-portal" && typeof showAdminApprovalOverview === "function") showAdminApprovalOverview();
  if (viewName === "audit" && typeof loadAuditLogs === "function") loadAuditLogs();
  if (viewName === "settings" && typeof loadSettings === "function") loadSettings();
}
