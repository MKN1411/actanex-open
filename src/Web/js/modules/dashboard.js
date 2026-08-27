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

    const openEl = document.getElementById("dash-open-amount");
    const openSubEl = document.getElementById("dash-open-subtitle");
    const pastEl = document.getElementById("dash-past-revenue");
    const forecastEl = document.getElementById("dash-forecast");
    const activeProjEl = document.getElementById("dash-active-projects-count");

    if (openEl) openEl.innerText = formatCurrency(openAmount);
    if (openSubEl) openSubEl.innerText = `${openHours.toFixed(1)} h Zeiten • 0,00 € Spesen`;
    if (pastEl) pastEl.innerText = formatCurrency(pastRevenue);
    if (forecastEl) forecastEl.innerText = formatCurrency(forecast);
    if (activeProjEl) activeProjEl.innerText = (data.projects?.length || 0);

    // 2. Budget Grid
    const budgetContainer = document.getElementById("dash-budget-grid");
    if (budgetContainer) {
      const projects = data.projects || [];
      if (projects.length === 0) {
        budgetContainer.innerHTML = `<div class="card" style="grid-column: 1/-1; text-align: center; color: var(--text-muted);">Keine aktiven Projekte vorhanden.</div>`;
      } else {
        budgetContainer.innerHTML = projects.map(p => {
          const budgetNet = p.totalBudgetNet || 0;
          const recordedNet = p.recordedAmountNet || 0;
          const usagePct = budgetNet > 0 ? Math.min(100, Math.round((recordedNet / budgetNet) * 100)) : 0;
          const isInternal = (p.projectNumber || '').startsWith('INT-');
          const isOverBudget = usagePct >= 90;

          return `
            <div class="card" style="border-left: 4px solid ${isInternal ? '#94a3b8' : (isOverBudget ? 'var(--warning)' : 'var(--primary)')};">
              <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                  <strong style="font-size: 0.95rem; color: var(--text);">${escapeHtml(p.name)}</strong>
                  <div style="font-size: 0.75rem; color: var(--text-muted);">${escapeHtml(p.customerName)} • ${escapeHtml(p.projectNumber)}</div>
                </div>
                <span class="badge ${isInternal ? 'badge-secondary' : 'badge-info'}">
                  ${p.defaultHourlyRate > 0 ? p.defaultHourlyRate.toFixed(2) + ' €/h' : 'Intern'}
                </span>
              </div>
              
              <div style="margin: 12px 0 6px 0;">
                <div style="display: flex; justify-content: space-between; font-size: 0.78rem; font-weight: 600; margin-bottom: 4px;">
                  <span>Budget-Auslastung</span>
                  <span>${usagePct}%</span>
                </div>
                <div class="progress-track">
                  <div class="progress-bar" style="width: ${usagePct}%; background: ${isOverBudget ? 'var(--warning)' : 'var(--primary)'};"></div>
                </div>
              </div>

              <div style="display: flex; justify-content: space-between; font-size: 0.75rem; color: var(--text-muted); margin-top: 8px;">
                <span>Gebucht: <strong>${(p.recordedHours || 0).toFixed(1)} h</strong> (${formatCurrency(recordedNet)})</span>
                <span>Rest: <strong>${(p.remainingHours || 0).toFixed(1)} h</strong> (${formatCurrency(p.remainingBudgetNet || 0)})</span>
              </div>
            </div>`;
        }).join("");
      }
    }

    // 3. Recent Timesheets Table
    const tsTableBody = document.getElementById("dash-recent-timesheets-body");
    if (tsTableBody) {
      const recent = data.recentTimesheets || [];
      if (recent.length === 0) {
        tsTableBody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 24px;">Noch keine Leistungsnachweise erstellt.</td></tr>`;
      } else {
        tsTableBody.innerHTML = recent.map(ts => `
          <tr class="clickable-row" onclick="switchView('billing')">
            <td><strong>${ts.period}</strong></td>
            <td>${escapeHtml(ts.customer_name)}<br><small style="color:var(--text-muted);">${escapeHtml(ts.project_name)}</small></td>
            <td>${(ts.total_actual_hours || 0).toFixed(1)} h</td>
            <td>${formatCurrency(ts.total_reimbursable_expenses || 0)}</td>
            <td><strong>${formatCurrency(ts.total_amount_net || 0)}</strong></td>
            <td><span class="badge ${ts.status === 'Invoiced' ? 'badge-success' : 'badge-warning'}">${ts.status}</span></td>
            <td><button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.75rem;"><i class="fa-solid fa-eye"></i> Details</button></td>
          </tr>
        `).join("");
      }
    }
  } catch (err) {
    console.error("Dashboard error:", err);
  }
}

function scrollToBudgets() {
  const el = document.getElementById("dash-budget-grid");
  if (el) el.scrollIntoView({ behavior: "smooth" });
}
