/**
 * ActaNex - Dashboard Module
 * Version 3.0.0
 */

async function loadDashboardStats() {
  try {
    const res = await apiRequest("/dashboard/stats");
    if (!res.ok) throw new Error("Fehler beim Abrufen der Dashboard-Statistiken");
    const data = await res.json();

    // 1. KPI Cards
    const openAmount = (data.openBilling?.totalNet || 0);
    const openHours = (data.openBilling?.hours || 0);
    const pastRevenue = (data.past3Months?.totalRevenueNet || 0);
    const forecast = (data.forecast3Months?.totalForecastNet || 0);

    const openEl = document.getElementById("dash-open-amount") || document.getElementById("dash-open-total");
    const openSubEl = document.getElementById("dash-open-subtitle") || document.getElementById("dash-open-sub");
    const pastEl = document.getElementById("dash-past-revenue");
    const forecastEl = document.getElementById("dash-forecast") || document.getElementById("dash-forecast-total");
    const activeProjEl = document.getElementById("dash-active-projects-count") || document.getElementById("dash-projects-count");

    if (openEl) openEl.innerText = formatCurrency(openAmount);
    if (openSubEl) openSubEl.innerText = `${openHours.toFixed(1)} h Zeiten • ${formatCurrency(data.openBilling?.travelAmountNet || 0)} Spesen`;
    if (pastEl) pastEl.innerText = formatCurrency(pastRevenue);
    if (forecastEl) forecastEl.innerText = formatCurrency(forecast);
    if (activeProjEl) activeProjEl.innerText = (data.projects?.length || 0);

    // 2. Budget Grid & Laufende Projekte
    const budgetContainer = document.getElementById("dash-budget-grid") || document.getElementById("dash-projects-grid");
    if (budgetContainer) {
      const projects = data.projects || [];
      if (projects.length === 0) {
        budgetContainer.innerHTML = `
          <div class="card" style="grid-column: 1 / -1; padding: 24px; text-align: center; color: var(--text-muted); background: #f8fafc; border-radius: 8px; border: 1px dashed var(--border);">
            <i class="fa-solid fa-folder-open" style="font-size: 1.5rem; margin-bottom: 8px; color: #94a3b8; display: block;"></i>
            Keine aktiven Projekte vorhanden. Legen Sie unter <strong>Kunden & Projekte</strong> ein neues Projekt an oder synchronisieren Sie Lexware.
          </div>
        `;
      } else {
        budgetContainer.innerHTML = projects.map(p => {
          const budgetNet = p.totalBudgetNet || (p.plannedHours ? p.plannedHours * p.defaultHourlyRate : 0);
          const recordedNet = p.recordedAmountNet || 0;
          const usagePct = p.budgetUsagePercent !== undefined ? p.budgetUsagePercent : (budgetNet > 0 ? Math.min(100, Math.round((recordedNet / budgetNet) * 100)) : 0);
          const isInternal = (p.projectNumber || '').startsWith('INT-') || p.id === 'prj_internal_admin';
          const isOverBudget = usagePct >= 90;
          const barColor = usagePct > 90 ? '#ef4444' : usagePct > 75 ? '#f59e0b' : '#3b82f6';

          return `
            <div class="card" style="padding: 16px; border: 1px solid var(--border); background: #f8fafc; border-radius: 8px; border-left: 4px solid ${isInternal ? '#94a3b8' : (isOverBudget ? '#ef4444' : '#3b82f6')}; transition: transform 0.15s ease;" onmouseover="this.style.transform='translateY(-2px)'" onmouseout="this.style.transform='translateY(0)'">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <strong style="color: #1e293b; font-size: 0.95rem;">${escapeHtml(p.name)}</strong><br>
                  <small style="color: var(--text-muted);">${escapeHtml(p.customerName || '')} • ${escapeHtml(p.projectNumber || '')}</small>
                </div>
                <span class="badge" style="background: ${isInternal ? '#f1f5f9' : '#e0f2fe'}; color: ${isInternal ? '#64748b' : '#0369a1'}; font-weight: 600;">
                  ${p.defaultHourlyRate > 0 ? p.defaultHourlyRate.toFixed(2) + ' €/h' : 'Intern'}
                </span>
              </div>
              
              <div style="margin: 12px 0 6px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px;">
                  <span style="color: #475569;">Budget-Auslastung</span>
                  <span style="color: ${barColor};">${usagePct}%</span>
                </div>
                <div style="background: #e2e8f0; border-radius: 4px; height: 8px; overflow: hidden;">
                  <div style="background: ${barColor}; width: ${Math.min(100, usagePct)}%; height: 100%; border-radius: 4px;"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.78rem; color: var(--text-muted); margin-top: 10px; padding-top: 8px; border-top: 1px solid #e2e8f0;">
                <span>Gebucht: <strong>${(p.recordedHours || 0).toFixed(1)} h</strong> (${formatCurrency(recordedNet)})</span>
                <span>Rest: <strong>${(p.remainingHours || 0).toFixed(1)} h</strong> (${formatCurrency(p.remainingBudgetNet || 0)})</span>
              </div>
            </div>`;
        }).join("");
      }
    }

    // 3. Recent Timesheets Table
    const tsTableBody = document.getElementById("dash-recent-timesheets-body") || document.getElementById("timesheet-table-body");
    if (tsTableBody) {
      const recent = data.recentTimesheets || [];
      if (recent.length === 0) {
        tsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Noch keine Leistungsnachweise erstellt.</td></tr>`;
      } else {
        tsTableBody.innerHTML = recent.map(ts => {
          let badgeClass = "badge-secondary";
          let badgeIcon = "fa-clock";
          let badgeLabel = ts.status || "Entwurf";

          if (ts.status === "Approved") {
            badgeClass = "badge-success";
            badgeIcon = "fa-check-double";
            badgeLabel = "Freigegeben";
          } else if (ts.status === "Invoiced") {
            badgeClass = "badge-success";
            badgeIcon = "fa-file-invoice-dollar";
            badgeLabel = `Fakturiert (${ts.lexware_invoice_number || 'Rechnung'})`;
          } else if (ts.status === "PendingSignature" || ts.status === "Submitted") {
            badgeClass = "badge-warning";
            badgeIcon = "fa-signature";
            badgeLabel = "Zur Prüfung";
          } else if (ts.status === "Rejected") {
            badgeClass = "badge-danger";
            badgeIcon = "fa-circle-xmark";
            badgeLabel = "Beanstandet";
          } else if (ts.is_invoice_canceled === 1) {
            badgeClass = "badge-danger";
            badgeIcon = "fa-ban";
            badgeLabel = "Rechnung storniert";
          } else if (ts.status === "Draft") {
            badgeClass = "badge-warning";
            badgeIcon = "fa-pen";
            badgeLabel = "Entwurf";
          }

          return `
            <tr class="clickable-row" onclick="switchView('billing')">
              <td><strong>${ts.period} (v${ts.version_number || 1}.0)</strong></td>
              <td>${escapeHtml(ts.customer_name)}<br><small style="color:var(--text-muted);">${escapeHtml(ts.project_name || '')} (${escapeHtml(ts.project_number || '')})</small></td>
              <td>${(ts.total_billable_hours || ts.total_actual_hours || 0).toFixed(1)} h</td>
              <td>${formatCurrency(ts.total_reimbursable_expenses || 0)}</td>
              <td><strong>${formatCurrency(ts.total_amount_net || 0)}</strong></td>
              <td><span class="badge ${badgeClass}"><i class="fa-solid ${badgeIcon}"></i> ${badgeLabel}</span></td>
              <td>
                <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;" onclick="event.stopPropagation(); openTimesheetModal('${ts.id}', '${ts.status}')">
                  <i class="fa-solid fa-folder-open"></i> Öffnen
                </button>
              </td>
            </tr>
          `;
        }).join("");
      }
    }
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function scrollToBudgets() {
  switchView('dashboard');
  setTimeout(() => {
    const el = document.getElementById("dash-budget-grid") || document.getElementById("dash-projects-grid");
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      el.style.transition = "all 0.3s ease";
      el.style.boxShadow = "0 0 0 3px rgba(56, 189, 248, 0.5)";
      setTimeout(() => { el.style.boxShadow = ""; }, 1500);
    }
  }, 150);
}
