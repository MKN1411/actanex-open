/**
 * ActaNex - SPA Router & Dynamic Subnav Controller
 * Version 3.0.0
 */

const viewCache = {};
let currentActiveView = "";

function openNewTravelEntry() {
  switchView('travel');
  const form = document.getElementById('travel-form');
  if (form) {
    form.reset();
    form.scrollIntoView({ behavior: 'smooth' });
    const custSel = document.getElementById('travel-customer-id');
    if (custSel) custSel.focus();
  }
}

function scrollToTravelTrips() {
  switchView('travel');
  loadTripsList();
  setTimeout(() => {
    const listEl = document.getElementById('trips-list-tbody') || document.querySelector('.card:last-child');
    if (listEl) listEl.scrollIntoView({ behavior: 'smooth' });
  }, 200);
}

const MODULE_DEFINITIONS = {
  "dashboard": {
    title: "Dashboard",
    icon: "fa-chart-pie",
    viewPath: "views/dashboard.html",
    actions: [
      { id: "overview", label: "Übersicht & KPIs", icon: "fa-gauge-high", fn: "switchView('dashboard'); loadDashboardStats();" },
      { id: "budgets", label: "Projekt-Budgets", icon: "fa-bars-progress", fn: "switchView('dashboard'); scrollToBudgets();" },
      { id: "lexsync", label: "Lexware Komplett-Sync", icon: "fa-rotate", fn: "syncFullLexwareStatus();" },
      { id: "unassigned", label: "Unbearbeitete Belege", icon: "fa-inbox", fn: "switchView('vouchers');" }
    ]
  },
  "timesheets": {
    title: "Zeiterfassung",
    icon: "fa-clock",
    viewPath: "views/timesheets.html",
    actions: [
      { id: "list", label: "Zeiten & Erfassung", icon: "fa-list-check", fn: "switchView('timesheets');" },
      { id: "actachron", label: "ActaChron (PWA Stempeluhr)", icon: "fa-stopwatch", external: "/pwa/time-tracker.html" }
    ]
  },
  "travel": {
    title: "Reisekosten",
    icon: "fa-train-subway",
    viewPath: "views/travel.html",
    actions: [
      { id: "list", label: "Reise Übersicht", icon: "fa-route", fn: "scrollToTravelTrips();" },
      { id: "create", label: "Neue Reise erfassen", icon: "fa-plus-circle", fn: "openNewTravelEntry();" },
      { id: "scan", label: "Belege per Smartphone (QR)", icon: "fa-qrcode", fn: "openMobileScanModalForTravel();" },
      { id: "actavault", label: "ActaVault (PWA Belege)", icon: "fa-vault", external: "/pwa/receipt-inbox.html" }
    ]
  },
  "vouchers": {
    title: "Belege & Inbox",
    icon: "fa-receipt",
    viewPath: "views/vouchers.html",
    actions: [
      { id: "list", label: "Belege & Inbox", icon: "fa-inbox", fn: "switchView('vouchers'); loadOperationalVouchers();" },
      { id: "create", label: "Neuen Beleg erfassen", icon: "fa-plus-circle", fn: "openVoucherModal();" },
      { id: "scan", label: "Beleg scannen per Handy (QR)", icon: "fa-qrcode", fn: "openMobileScanModal('voucher');" },
      { id: "export_datev", label: "DATEV Export (Belege)", icon: "fa-file-csv", fn: "exportVouchersDatev();" },
      { id: "export_zip", label: "Beleg-Archiv (ZIP)", icon: "fa-file-zipper", fn: "exportVouchersZip();" }
    ]
  },
  "customers": {
    title: "Kunden & Projekte",
    icon: "fa-building-user",
    viewPath: "views/customers.html",
    actions: [
      { id: "list", label: "Kunden & Mandanten", icon: "fa-users-gear", fn: "switchView('customers'); loadCustomers();" },
      { id: "lexsync", label: "Lexware Kontakte Sync", icon: "fa-rotate", fn: "syncLexwareContacts();" },
      { id: "quotes", label: "Lexware Angebote Sync", icon: "fa-file-invoice", fn: "syncQuotations();" }
    ]
  },
  "billing": {
    title: "Abrechnung",
    icon: "fa-file-invoice-dollar",
    viewPath: "views/billing.html",
    actions: [
      { id: "hierarchy", label: "Abrechnungsübersicht", icon: "fa-file-invoice", fn: "switchView('billing'); loadBillingHierarchy();" },
      { id: "sync_invoices", label: "Rechnungen synchronisieren", icon: "fa-rotate", fn: "syncInvoices();" },
      { id: "approval", label: "OTP Kundenfreigabe Portal", icon: "fa-signature", fn: "switchView('approval-portal');" }
    ]
  },
  "approval-portal": {
    title: "Kundenfreigabe",
    icon: "fa-signature",
    viewPath: "views/approval.html",
    actions: [
      { id: "admin", label: "Freigabe-Verwaltung", icon: "fa-list", fn: "showAdminApprovalOverview();" },
      { id: "back", label: "Zurück zur Abrechnung", icon: "fa-arrow-left", fn: "switchView('billing');" }
    ]
  },
  "audit": {
    title: "GoBD Audit",
    icon: "fa-fingerprint",
    viewPath: "views/audit.html",
    actions: [
      { id: "logs", label: "Revisionsprotokolle", icon: "fa-scroll", fn: "switchView('audit'); loadAuditLogs();" }
    ]
  },
  "backup": {
    title: "Backup & Export",
    icon: "fa-cloud-arrow-down",
    viewPath: "views/backup.html",
    actions: [
      { id: "sql", label: "Disaster Recovery SQL", icon: "fa-database", fn: "downloadDisasterRecoverySql();" },
      { id: "ts_zip", label: "Leistungsnachweise (PDF ZIP)", icon: "fa-file-zipper", fn: "exportTimesheetPdfsZip();" },
      { id: "tax_zip", label: "Steuer-Belege (ZIP)", icon: "fa-folder-archive", fn: "exportTaxReceiptsZip();" },
      { id: "csv", label: "Buchungsdaten (CSV)", icon: "fa-file-excel", fn: "exportAccountingDataCsv();" }
    ]
  },
  "tax-reports": {
    title: "Steuern & EÜR",
    icon: "fa-calculator",
    viewPath: "views/tax-reports.html",
    actions: [
      { id: "euer", label: "EÜR & Vorsteuer", icon: "fa-chart-column", fn: "switchView('tax-reports'); loadTaxReportsSummary();" },
      { id: "travel_tax", label: "Amtliches Fahrtenbuch", icon: "fa-car-side", fn: "switchView('tax-reports'); switchTaxTab('travel');" },
      { id: "calc", label: "Neu berechnen", icon: "fa-rotate", fn: "loadTaxReportsSummary();" }
    ]
  },
  "settings": {
    title: "Konfiguration",
    icon: "fa-gear",
    viewPath: "views/settings.html",
    actions: [
      { id: "general", label: "Grundeinstellungen & Stundensätze", icon: "fa-sliders", fn: "switchView('settings'); loadSettings();" },
      { id: "vehicle", label: "Kfz-Vollkosten-Planer", icon: "fa-car", fn: "openVehiclePlanningModal();" },
      { id: "lexware", label: "Lexware API-Schlüssel", icon: "fa-key", fn: "switchView('settings'); document.getElementById('cfg-lexware-api-key')?.focus();" },
      { id: "email", label: "E-Mail-Vorlagen & Signatur", icon: "fa-envelope", fn: "switchView('settings'); document.getElementById('cfg-email-templates-accordion')?.scrollIntoView({ behavior: 'smooth' });" }
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
  if (moduleKey === "time-capture") moduleKey = "timesheets";
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
      const call = act.fn ? (act.fn.endsWith(";") ? act.fn : `${act.fn};`) : "";
      html += `
        <div class="subnav-menu-item ${isActive ? 'active' : ''}" onclick="${call}" title="${act.label}">
          <i class="fa-solid ${act.icon}"></i>
          <span>${act.label}</span>
        </div>`;
    }
  });

  container.innerHTML = html;
}

async function switchView(viewName, actionId = "") {
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
  document.querySelectorAll(".view-panel").forEach(p => {
    p.classList.remove("active");
    p.style.display = "none";
  });

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
      targetPanel.style.display = "block";
      targetPanel.innerHTML = viewCache[viewName];
      mainContainer.appendChild(targetPanel);
    } catch (err) {
      console.error(`Error loading view ${viewName}:`, err);
      return;
    }
  } else {
    targetPanel.classList.add("active");
    targetPanel.style.display = "block";
  }

  // 4. Trigger Module Data Loaders Safely
  const safeCall = (fn, name) => {
    try {
      if (typeof fn === "function") fn();
    } catch (err) {
      console.warn(`Error running data loader for ${name}:`, err);
    }
  };

  if (viewName === "dashboard") safeCall(loadDashboardStats, "loadDashboardStats");
  if (viewName === "timesheets" || viewName === "time-capture") {
    safeCall(populateCustomerDropdowns, "populateCustomerDropdowns");
  }
  if (viewName === "travel") {
    safeCall(populateTravelCustomerDropdowns, "populateTravelCustomerDropdowns");
    safeCall(toggleTravelFields, "toggleTravelFields");
    safeCall(loadTripsList, "loadTripsList");
  }
  if (viewName === "vouchers") {
    safeCall(populateVoucherDropdowns, "populateVoucherDropdowns");
    safeCall(loadOperationalVouchers, "loadOperationalVouchers");
  }
  if (viewName === "customers") safeCall(loadCustomers, "loadCustomers");
  if (viewName === "billing") safeCall(loadBillingHierarchy, "loadBillingHierarchy");
  if (viewName === "approval-portal") safeCall(showAdminApprovalOverview, "showAdminApprovalOverview");
  if (viewName === "audit") safeCall(loadAuditLogs, "loadAuditLogs");
  if (viewName === "settings") safeCall(loadSettings, "loadSettings");
  if (viewName === "backup") safeCall(loadBackupFilterDropdowns, "loadBackupFilterDropdowns");
  if (viewName === "tax-reports") {
    safeCall(loadTaxFilterDropdowns, "loadTaxFilterDropdowns");
    safeCall(loadTaxReportsSummary, "loadTaxReportsSummary");
  }
}
