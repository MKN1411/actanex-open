    // 📊 STEUERN, EÜR-COCKPIT & REISEBERICHTE
    // ==========================================
    let currentTaxReportData = null;

    function switchTaxTab(tabName) {
      const btnCockpit = document.getElementById("tax-tab-btn-cockpit");
      const btnTravel = document.getElementById("tax-tab-btn-travel");
      const panelCockpit = document.getElementById("tax-tab-panel-cockpit");
      const panelTravel = document.getElementById("tax-tab-panel-travel");

      if (tabName === "cockpit") {
        if (btnCockpit) { btnCockpit.className = "btn btn-primary"; }
        if (btnTravel) { btnTravel.className = "btn btn-outline"; }
        if (panelCockpit) panelCockpit.style.display = "block";
        if (panelTravel) panelTravel.style.display = "none";
      } else {
        if (btnCockpit) { btnCockpit.className = "btn btn-outline"; }
        if (btnTravel) { btnTravel.className = "btn btn-primary"; }
        if (panelCockpit) panelCockpit.style.display = "none";
        if (panelTravel) panelTravel.style.display = "block";
      }
    }

    function setTaxReportPreset(preset) {
      const yearSelect = document.getElementById("tax-filter-year");
      const monthSelect = document.getElementById("tax-filter-month");
      const now = new Date();
      const curYear = String(now.getFullYear());
      const curMonth = String(now.getMonth() + 1).padStart(2, "0");

      if (preset === "current_month") {
        if (yearSelect) yearSelect.value = curYear;
        if (monthSelect) monthSelect.value = curMonth;
      } else if (preset === "last_month") {
        let prevM = now.getMonth();
        let y = now.getFullYear();
        if (prevM === 0) {
          prevM = 12;
          y--;
        }
        if (yearSelect) yearSelect.value = String(y);
        if (monthSelect) monthSelect.value = String(prevM).padStart(2, "0");
      } else if (preset === "q1") {
        if (yearSelect) yearSelect.value = curYear;
        if (monthSelect) monthSelect.value = "all";
      } else if (preset === "year") {
        if (yearSelect) yearSelect.value = curYear;
        if (monthSelect) monthSelect.value = "all";
      } else if (preset === "q2" || preset === "q3" || preset === "q4") {
        if (yearSelect) yearSelect.value = curYear;
        if (monthSelect) monthSelect.value = "all";
      }

      loadTaxReportsSummary();
    }

    async function loadTaxFilterDropdowns() {
      const custSelect = document.getElementById("tax-filter-customer");
      if (!custSelect) return;

      try {
        const res = await fetch(`${API_BASE}/customers?includeArchived=true`);
        if (res.ok) {
          const data = await res.json();
          const customers = Array.isArray(data) ? data : (data.customers || []);
          custSelect.innerHTML = `<option value="all">Alle Kunden</option>` +
            customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        }
      } catch (e) {
        console.error("Error loading tax filter customers:", e);
      }

      onTaxCustomerChange();
    }

    async function onTaxCustomerChange() {
      const custSelect = document.getElementById("tax-filter-customer");
      const projSelect = document.getElementById("tax-filter-project");
      if (!custSelect || !projSelect) return;

      const custId = custSelect.value;
      if (custId === "all") {
        try {
          const res = await fetch(`${API_BASE}/projects?includeArchived=true`);
          if (res.ok) {
            const projects = await res.json();
            projSelect.innerHTML = `<option value="all">Alle Projekte</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      } else {
        try {
          const res = await fetch(`${API_BASE}/customers/${custId}/overview`);
          if (res.ok) {
            const data = await res.json();
            const projects = data.projects || [];
            projSelect.innerHTML = `<option value="all">Alle Projekte dieses Kunden</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      }

      loadTaxReportsSummary();
    }

    async function loadTaxReportsSummary() {
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";
      const customerId = document.getElementById("tax-filter-customer")?.value || "all";
      const projectId = document.getElementById("tax-filter-project")?.value || "all";

      const badgePeriod = document.getElementById("tax-elster-period-badge");
      if (badgePeriod) {
        badgePeriod.innerText = `Zeitraum: ${month !== 'all' ? month + '/' : ''}${year}`;
      }

      try {
        const queryParams = new URLSearchParams({
          year,
          month,
          customerId,
          projectId
        });

        const res = await fetch(`${API_BASE}/tax-reports/summary?${queryParams.toString()}`);
        if (!res.ok) throw new Error("Fehler beim Laden der Steuer-Zusammenfassung.");
        const data = await res.json();
        currentTaxReportData = data;

        const totals = data.totals || {};

        // 1. KPI Cards Tab 1
        if (document.getElementById("tax-kpi-revenue-net")) {
          document.getElementById("tax-kpi-revenue-net").innerText = formatCurrency(totals.revenue_net || 0);
        }
        if (document.getElementById("tax-kpi-revenue-gross")) {
          document.getElementById("tax-kpi-revenue-gross").innerText = `Brutto: ${formatCurrency(totals.revenue_gross || 0)}`;
        }
        if (document.getElementById("tax-kpi-expenses-net")) {
          document.getElementById("tax-kpi-expenses-net").innerText = formatCurrency(totals.total_expenses_deductible || 0);
        }
        if (document.getElementById("tax-kpi-profit")) {
          const profit = totals.preliminary_profit_euer || 0;
          const profitEl = document.getElementById("tax-kpi-profit");
          profitEl.innerText = formatCurrency(profit);
          profitEl.className = profit >= 0 ? "stat-val success" : "stat-val";
          profitEl.style.color = profit >= 0 ? "#16a34a" : "#dc2626";
        }
        if (document.getElementById("tax-kpi-vat-balance")) {
          const vatBal = totals.vat_balance || 0;
          const vatEl = document.getElementById("tax-kpi-vat-balance");
          vatEl.innerText = formatCurrency(vatBal);
          vatEl.style.color = vatBal >= 0 ? "#8b5cf6" : "#059669";
        }

        // 2. Elster USt-VA Box
        if (document.getElementById("elster-kz-81-base")) {
          document.getElementById("elster-kz-81-base").innerText = formatCurrency(totals.elster_kz_81_base || 0);
        }
        if (document.getElementById("elster-kz-81-tax")) {
          document.getElementById("elster-kz-81-tax").innerText = formatCurrency(totals.elster_kz_81_tax || 0);
        }
        if (document.getElementById("elster-kz-66-input")) {
          document.getElementById("elster-kz-66-input").innerText = formatCurrency(totals.elster_kz_66_input_tax || 0);
        }
        if (document.getElementById("elster-kz-83-balance")) {
          const vatBal = totals.vat_balance || 0;
          const balEl = document.getElementById("elster-kz-83-balance");
          balEl.innerText = formatCurrency(vatBal);
          balEl.style.color = vatBal >= 0 ? "#dc2626" : "#059669";
          const subEl = document.getElementById("elster-kz-83-sub");
          if (subEl) subEl.innerText = vatBal >= 0 ? "Zahllast an Finanzamt" : "Erstattungsanspruch vom Finanzamt";
        }

        // 3. EÜR Categories Table
        renderTaxCategoriesTable(data);

        // 4. Tab 2: Travel KPIs
        if (document.getElementById("travel-kpi-biz-km")) {
          document.getElementById("travel-kpi-biz-km").innerText = `${(totals.business_trip_km || 0).toLocaleString("de-DE")} km`;
        }
        if (document.getElementById("travel-kpi-biz-count")) {
          document.getElementById("travel-kpi-biz-count").innerText = `${totals.business_trip_count || 0} Fahrten (Hin- & Rück)`;
        }
        if (document.getElementById("travel-kpi-commute-km")) {
          document.getElementById("travel-kpi-commute-km").innerText = `${(totals.commute_trip_km || 0).toLocaleString("de-DE")} km`;
        }
        if (document.getElementById("travel-kpi-commute-count")) {
          document.getElementById("travel-kpi-commute-count").innerText = `${totals.commute_trip_count || 0} Fahrten (Einfache Entf.)`;
        }
        if (document.getElementById("travel-kpi-cost-sum")) {
          const costSum = (totals.business_trip_cost || 0) + (totals.commute_trip_cost || 0);
          document.getElementById("travel-kpi-cost-sum").innerText = formatCurrency(costSum);
        }
        if (document.getElementById("travel-kpi-vma-sum")) {
          document.getElementById("travel-kpi-vma-sum").innerText = formatCurrency(totals.business_trip_vma || 0);
        }
        if (document.getElementById("travel-kpi-total-deductible")) {
          document.getElementById("travel-kpi-total-deductible").innerText = formatCurrency(totals.travel_total_deductible || 0);
        }

        // 5. Render Trips Table
        renderTravelTripsTable(data.trips || []);

      } catch (err) {
        console.error("loadTaxReportsSummary error:", err);
      }
    }

    function renderTaxCategoriesTable(data) {
      const tbody = document.getElementById("tax-categories-tbody");
      if (!tbody) return;

      const cats = data.categories || {};
      const totals = data.totals || {};

      let html = `
        <tr style="background: #f0fdf4; font-weight: 700;">
          <td><i class="fa-solid fa-arrow-trend-up" style="color: #16a34a; margin-right: 6px;"></i> Betriebseinnahmen / Erlöse (Stundennachweise)</td>
          <td style="text-align: center;">${(data.timesheets || []).length} Rechnungen</td>
          <td style="text-align: right;">${formatCurrency(totals.revenue_net || 0)}</td>
          <td style="text-align: right; color: #16a34a;">+ ${formatCurrency(totals.revenue_net || 0)}</td>
          <td style="text-align: right;">${formatCurrency(totals.revenue_tax || 0)} (USt)</td>
          <td style="text-align: right;">${formatCurrency(totals.revenue_gross || 0)}</td>
        </tr>
      `;

      // 1. Reisekosten des Unternehmers
      const travelCatKeys = [
        { key: "TravelMileage", icon: "fa-car", defaultTax: "0,00 € (Pauschale)" },
        { key: "TravelTransport", icon: "fa-train-subway", defaultTax: "" },
        { key: "TravelVma", icon: "fa-utensils", defaultTax: "0,00 € (Pauschale)" },
        { key: "TravelLodging", icon: "fa-hotel", defaultTax: "" },
        { key: "TravelIncidentals", icon: "fa-taxi", defaultTax: "" },
        { key: "TravelOther", icon: "fa-ticket", defaultTax: "" },
        { key: "CommuteExpense", icon: "fa-location-dot", defaultTax: "0,00 € (Pauschale)" }
      ];

      for (const item of travelCatKeys) {
        const c = cats[item.key];
        if (!c || c.count === 0) continue;
        const taxDisplay = c.tax > 0 ? formatCurrency(c.tax) : (item.defaultTax || "0,00 €");
        html += `
          <tr>
            <td><i class="fa-solid ${item.icon}" style="color: #2563eb; margin-right: 6px;"></i> ${escapeHtml(c.label)}</td>
            <td style="text-align: center;">${c.count} ${item.key.includes('Expense') || item.key.includes('Mileage') ? 'Fahrten' : (item.key.includes('Vma') ? 'Tage' : 'Belege')}</td>
            <td style="text-align: right;">${formatCurrency(c.net)}</td>
            <td style="text-align: right; color: #ea580c;">- ${formatCurrency(c.deductible_net)}</td>
            <td style="text-align: right;">${taxDisplay}</td>
            <td style="text-align: right;">${formatCurrency(c.gross)}</td>
          </tr>
        `;
      }

      // 2. Laufende Betriebsausgaben & Belege (operational_vouchers)
      const voucherCatKeys = ["Hospitality", "Software", "Marketing", "OfficeSupplies", "Telecommunication", "Education", "Transit", "Other"];
      for (const key of voucherCatKeys) {
        const c = cats[key];
        if (!c || c.count === 0) continue;
        const isHosp = key === "Hospitality";
        html += `
          <tr>
            <td>
              <i class="fa-solid fa-receipt" style="color: #64748b; margin-right: 6px;"></i> ${escapeHtml(c.label)}
              ${isHosp ? `<br><small style="color: #64748b;">(70% abzugsfähig: ${formatCurrency(c.deductible_net)}, 30% nicht: ${formatCurrency(c.net - c.deductible_net)})</small>` : ''}
            </td>
            <td style="text-align: center;">${c.count} Belege</td>
            <td style="text-align: right;">${formatCurrency(c.net)}</td>
            <td style="text-align: right; color: #ea580c;">- ${formatCurrency(c.deductible_net)}</td>
            <td style="text-align: right;">${formatCurrency(c.tax)}</td>
            <td style="text-align: right;">${formatCurrency(c.gross)}</td>
          </tr>
        `;
      }

      // Summenzeile
      html += `
        <tr style="background: #f8fafc; font-weight: 800; border-top: 2px solid #0f172a;">
          <td>VORLÄUFIGER EÜR-SALDO / GEWINN</td>
          <td style="text-align: center;">-</td>
          <td style="text-align: right;">${formatCurrency((totals.revenue_net || 0) - (totals.vouchers_net || 0) - (totals.travel_total_deductible || 0))}</td>
          <td style="text-align: right; color: ${totals.preliminary_profit_euer >= 0 ? '#16a34a' : '#dc2626'}; font-size: 1.05rem;">
            ${formatCurrency(totals.preliminary_profit_euer || 0)}
          </td>
          <td style="text-align: right; color: #8b5cf6;">Vorsteuer: ${formatCurrency(totals.elster_kz_66_input_tax || 0)}</td>
          <td style="text-align: right;">Zahllast: ${formatCurrency(totals.vat_balance || 0)}</td>
        </tr>
      `;

      tbody.innerHTML = html;
    }

    function renderTravelTripsTable(trips) {
      const tbody = document.getElementById("travel-trips-tbody");
      if (!tbody) return;

      if (!trips || trips.length === 0) {
        tbody.innerHTML = `<tr><td colspan="10" style="text-align: center; color: var(--text-muted); padding: 24px;">Keine Fahrten für diesen Erfassungszeitraum vorhanden.</td></tr>`;
        return;
      }

      tbody.innerHTML = trips.map(t => {
        const isCommute = t.is_commute;
        const isCar = t.expense_type === "PersonalCar";
        const typeBadge = isCommute 
          ? `<span class="badge badge-warning" style="background:#fef3c7; color:#b45309;"><i class="fa-solid fa-location-dot"></i> Pendler (1. Stätte)</span>`
          : `<span class="badge badge-info" style="background:#dbeafe; color:#1e40af;"><i class="fa-solid ${isCar ? 'fa-car' : 'fa-train-subway'}"></i> Auswärtstätigkeit</span>`;
        
        let distBasis = "";
        let rateDisplay = "";
        if (isCommute) {
          distBasis = `${t.distance_km} km (einfach)`;
          rateDisplay = `${(t.rate_per_km || 0.30).toFixed(2)} €/km`;
        } else if (isCar) {
          distBasis = `${t.distance_km} km (Hin & Rück)`;
          rateDisplay = `${(t.rate_per_km || 0.30).toFixed(2)} €/km`;
        } else {
          distBasis = `<span class="badge" style="background: #e0f2fe; color: #0369a1;"><i class="fa-solid fa-train"></i> ${t.expense_type || 'Bahn/Flug'} (${t.expenses_count || 0} Belege)</span>`;
          rateDisplay = `Tats. Kosten`;
        }

        const travelCostVal = isCar ? (t.travel_cost || 0) : ((t.expenses_net || 0) + (t.travel_cost || 0));
        const hasLegs = t.legs && t.legs.length > 0;
        const routeText = t.route_display || (t.origin + ' ➔ ' + t.destination);

        return `
          <tr>
            <td><strong>${t.trip_date}</strong></td>
            <td>${typeBadge}</td>
            <td><strong>${escapeHtml(t.customer_name)}</strong><br><small style="color:var(--text-muted);">${escapeHtml(t.project_name)}</small></td>
            <td>
              <div style="font-weight: 600; color: #1e293b;">${escapeHtml(t.purpose)}</div>
              ${t.destination ? `<div style="font-size: 0.76rem; color: #2563eb; margin-top: 2px;"><i class="fa-solid fa-location-dot"></i> <strong>Ziel:</strong> ${escapeHtml(t.destination)}</div>` : ''}
            </td>
            <td>
              <div style="font-size: 0.8rem; font-weight: 600; color: #0f172a;">${escapeHtml(routeText)}</div>
              ${hasLegs ? `<div style="font-size: 0.74rem; color: var(--text-muted); margin-top: 2px;"><a href="javascript:void(0)" onclick="toggleTripLegsAccordion('${t.id}')" style="color: #2563eb; text-decoration: none; font-weight: 600;"><i class="fa-solid fa-chevron-down" id="leg-arrow-${t.id}"></i> ${t.legs.length} Etappen einblenden</a></div>` : ''}
            </td>
            <td style="text-align: right;"><strong>${distBasis}</strong></td>
            <td style="text-align: right;"><small>${rateDisplay}</small></td>
            <td style="text-align: right;">${formatCurrency(travelCostVal)}</td>
            <td style="text-align: right;">${t.vma_amount > 0 ? formatCurrency(t.vma_amount) : '-'}</td>
            <td style="text-align: right; font-weight: 700; color: #166534;">${formatCurrency(t.total_cost || 0)}</td>
          </tr>
          ${hasLegs ? `
            <tr id="legs-accordion-${t.id}" style="display: none; background: #f8fafc;">
              <td colspan="10" style="padding: 10px 16px; border-top: 1px dashed #cbd5e1;">
                <div style="font-weight: 700; font-size: 0.8rem; color: #475569; margin-bottom: 6px;">
                  <i class="fa-solid fa-route" style="color: #2563eb;"></i> Reiseroute & Etappen im Detail:
                </div>
                <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem; background: #fff; border: 1px solid #e2e8f0; border-radius: 4px;">
                  <thead>
                    <tr style="background: #f1f5f9; color: #475569; border-bottom: 1px solid #e2e8f0;">
                      <th style="padding: 4px 8px; width: 30px; text-align: center;">#</th>
                      <th style="padding: 4px 8px; width: 95px;">Datum</th>
                      <th style="padding: 4px 8px;">Von &rarr; Nach</th>
                      <th style="padding: 4px 8px; width: 130px;">Verkehrsmittel</th>
                      <th style="padding: 4px 8px; width: 110px; text-align: right;">KM / Betrag</th>
                      <th style="padding: 4px 8px;">Aufenthalt / Zweck</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${t.legs.map((leg, lIdx) => {
                      const isLegCar = leg.transport_type === 'PersonalCar';
                      const costOrKm = isLegCar ? `${leg.distance_km || 0} km (${formatCurrency(leg.travel_cost_net || 0)})` : formatCurrency(leg.travel_cost_net || 0);
                      return `
                        <tr style="border-bottom: 1px solid #f1f5f9;">
                          <td style="padding: 4px 8px; text-align: center; font-weight: 600; color: var(--text-muted);">${lIdx + 1}</td>
                          <td style="padding: 4px 8px;">${leg.date_leg || t.trip_date}</td>
                          <td style="padding: 4px 8px;"><strong>${escapeHtml(leg.start_location)}</strong> &rarr; <strong>${escapeHtml(leg.destination_location)}</strong></td>
                          <td style="padding: 4px 8px;">${escapeHtml(leg.transport_type || '-')}</td>
                          <td style="padding: 4px 8px; text-align: right; font-weight: 600;">${costOrKm}</td>
                          <td style="padding: 4px 8px; color: #64748b;">${leg.layover_hours ? `<strong>${leg.layover_hours}h</strong> ` : ''}${escapeHtml(leg.layover_purpose || '-')}</td>
                        </tr>
                      `;
                    }).join('')}
                  </tbody>
                </table>
              </td>
            </tr>
          ` : ''}
        `;
      }).join("");
    }

    function toggleTripLegsAccordion(tripId) {
      const row = document.getElementById(`legs-accordion-${tripId}`);
      const arrow = document.getElementById(`leg-arrow-${tripId}`);
      if (!row) return;
      if (row.style.display === "none") {
        row.style.display = "table-row";
        if (arrow) arrow.className = "fa-solid fa-chevron-up";
      } else {
        row.style.display = "none";
        if (arrow) arrow.className = "fa-solid fa-chevron-down";
      }
    }

    // 📄 PDF STEUERBERICHT (Finanzamt & EÜR)
    function openTaxReportPdf() {
      if (!currentTaxReportData) {
        alert("Bitte warten Sie, bis die Daten geladen sind.");
        return;
      }

      const d = currentTaxReportData;
      const totals = d.totals || {};
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";
      const periodStr = month !== "all" ? `${month}/${year}` : `Gesamtjahr ${year}`;

      const win = window.open("", "_blank");
      if (!win) {
        alert("Pop-up-Blocker aktiv. Bitte erlauben Sie Pop-ups für diese Seite.");
        return;
      }

      const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
      const sigDataUrl = useSig 
        ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : ""))
        : "";
      const city = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";
      const printDateStr = new Date().toLocaleDateString('de-DE');

      const contractorName = (globalSettings && globalSettings.contractor_full_name) || (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : (globalSettings.contractor_name || localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva"));
      const contractorTitle = (globalSettings && globalSettings.contractor_title) || "Senior IT Consultant & Enterprise Architect";
      const taxNr = (globalSettings && globalSettings.tax_number) || "123/456/78901";
      const vatId = (globalSettings && globalSettings.vat_id) || "DE123456789";

      let vouchersRows = (d.vouchers || []).map(v => `
        <tr>
          <td>${v.voucher_date}</td>
          <td>${escapeHtml(v.voucher_number)}</td>
          <td><strong>${escapeHtml(v.supplier_name)}</strong><br><small>${escapeHtml(v.description)}</small></td>
          <td>${escapeHtml(v.voucher_type)}</td>
          <td style="text-align: right;">${formatCurrency(v.amount_net)}</td>
          <td style="text-align: right;">${formatCurrency(v.tax_deductible_net)}</td>
          <td style="text-align: right;">${formatCurrency(v.tax_amount)} (${v.tax_rate}%)</td>
          <td style="text-align: right;"><strong>${formatCurrency(v.amount_gross)}</strong></td>
        </tr>
      `).join("");

      const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Steuer- & EÜR-Bericht - ${periodStr}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 14mm 15mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11px; }
            .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #1e293b; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
            .btn { background: #2563eb; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
            .a4-page { max-width: 800px; margin: 50px auto 20px auto; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 6px 8px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; color: #1e293b; }
            .box { background: #eff6ff; border: 1.5px solid #bfdbfe; border-radius: 6px; padding: 12px; margin-bottom: 16px; }
            .kpi-grid { display: grid; grid-template-columns: 1fr 1fr 1fr 1fr; gap: 10px; margin-bottom: 16px; }
            .kpi-card { border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px; text-align: center; }
            .kpi-val { font-size: 14px; font-weight: 800; margin-top: 4px; }
            @media print {
              body { padding: 0 !important; background: #fff !important; }
              .toolbar { display: none !important; }
              .a4-page { margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
              .box, .kpi-grid { page-break-inside: avoid !important; break-inside: avoid !important; }
              .signature-block { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div><strong>Steuer- & EÜR-Finanzamtbericht</strong> &bull; ${periodStr}</div>
            <button class="btn" onclick="window.print()">🖨️ Drucken / Als PDF speichern</button>
          </div>
          <div class="a4-page">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 18px; margin: 0 0 4px 0; color: #0f172a;">Steuer- & EÜR-Prüfbericht</h1>
                <div style="color: #64748b; font-size: 12px;">Erfassungszeitraum: <strong>${periodStr}</strong></div>
              </div>
              <div style="text-align: right; font-size: 11px;">
                <strong>${escapeHtml(contractorName)}</strong><br>
                ${escapeHtml(contractorTitle)}<br>
                Steuernummer: ${escapeHtml(taxNr)} | USt-IdNr.: ${escapeHtml(vatId)}
              </div>
            </div>

            <div class="kpi-grid">
              <div class="kpi-card">
                <div style="color:#64748b; font-size:10px;">Einnahmen Netto</div>
                <div class="kpi-val" style="color:#2563eb;">${formatCurrency(totals.revenue_net || 0)}</div>
              </div>
              <div class="kpi-card">
                <div style="color:#64748b; font-size:10px;">Ausgaben Abzugsfähig</div>
                <div class="kpi-val" style="color:#ea580c;">${formatCurrency(totals.total_expenses_deductible || 0)}</div>
              </div>
              <div class="kpi-card">
                <div style="color:#64748b; font-size:10px;">Vorläufiger EÜR-Gewinn</div>
                <div class="kpi-val" style="color:#16a34a;">${formatCurrency(totals.preliminary_profit_euer || 0)}</div>
              </div>
              <div class="kpi-card">
                <div style="color:#64748b; font-size:10px;">USt-Zahllast / Saldo</div>
                <div class="kpi-val" style="color:#8b5cf6;">${formatCurrency(totals.vat_balance || 0)}</div>
              </div>
            </div>

            <div class="box">
              <strong style="color: #1e40af; font-size: 12px;">🏛️ Elster USt-Voranmeldung Kennziffern-Übersicht:</strong>
              <div style="display: flex; justify-content: space-around; margin-top: 8px; font-size: 11px;">
                <div><strong>Kz 81 (Umsatz 19%):</strong> ${formatCurrency(totals.elster_kz_81_base || 0)} &bull; Steuer: <strong>${formatCurrency(totals.elster_kz_81_tax || 0)}</strong></div>
                <div><strong>Kz 66 (Vorsteuer):</strong> <strong>${formatCurrency(totals.elster_kz_66_input_tax || 0)}</strong></div>
                <div><strong>Kz 83 (Zahllast/Saldo):</strong> <strong style="color:${totals.vat_balance >= 0 ? '#dc2626' : '#16a34a'}">${formatCurrency(totals.vat_balance || 0)}</strong></div>
              </div>
            </div>

            <h3 style="font-size: 13px; margin: 16px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">1. Gliederung der Betriebsausgaben (EÜR)</h3>
            <table>
              <thead>
                <tr>
                  <th>Aufwandsposten</th>
                  <th style="text-align: center;">Anzahl</th>
                  <th style="text-align: right;">Netto</th>
                  <th style="text-align: right;">Abzugsfähig</th>
                  <th style="text-align: right;">Vorsteuer</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Dienstreisen / Auswärtstätigkeiten (Fahrtkosten + VMA)</td>
                  <td style="text-align: center;">${totals.business_trip_count || 0}</td>
                  <td style="text-align: right;">${formatCurrency(totals.business_trip_total || 0)}</td>
                  <td style="text-align: right; color:#ea580c;">${formatCurrency(totals.business_trip_total || 0)}</td>
                  <td style="text-align: right;">0,00 €</td>
                </tr>
                <tr>
                  <td>Fahrten Wohnung & 1. Betriebsstätte (Pendlerpauschale)</td>
                  <td style="text-align: center;">${totals.commute_trip_count || 0}</td>
                  <td style="text-align: right;">${formatCurrency(totals.commute_trip_cost || 0)}</td>
                  <td style="text-align: right; color:#ea580c;">${formatCurrency(totals.commute_trip_cost || 0)}</td>
                  <td style="text-align: right;">0,00 €</td>
                </tr>
                <tr>
                  <td>Betriebsausgaben-Belege gesamt (Vouchers)</td>
                  <td style="text-align: center;">${(d.vouchers || []).length}</td>
                  <td style="text-align: right;">${formatCurrency(totals.vouchers_net || 0)}</td>
                  <td style="text-align: right; color:#ea580c;">${formatCurrency(totals.vouchers_deductible_net || 0)}</td>
                  <td style="text-align: right;">${formatCurrency(totals.elster_kz_66_input_tax || 0)}</td>
                </tr>
                <tr style="font-weight: 700; background: #f8fafc;">
                  <td>GESAMT-AUSGABEN</td>
                  <td style="text-align: center;">-</td>
                  <td style="text-align: right;">${formatCurrency((totals.vouchers_net || 0) + (totals.travel_total_deductible || 0))}</td>
                  <td style="text-align: right; color:#ea580c;">${formatCurrency(totals.total_expenses_deductible || 0)}</td>
                  <td style="text-align: right;">${formatCurrency(totals.elster_kz_66_input_tax || 0)}</td>
                </tr>
              </tbody>
            </table>

            <h3 style="font-size: 13px; margin: 16px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">2. Einzelbelegverzeichnis (Ausgaben)</h3>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Beleg-Nr.</th>
                  <th>Lieferant & Zweck</th>
                  <th>Typ</th>
                  <th style="text-align: right;">Netto</th>
                  <th style="text-align: right;">EÜR Abzug</th>
                  <th style="text-align: right;">Vorsteuer</th>
                  <th style="text-align: right;">Brutto</th>
                </tr>
              </thead>
              <tbody>
                ${vouchersRows.length > 0 ? vouchersRows : '<tr><td colspan="8" style="text-align:center;">Keine Ausgabenbelege für diesen Zeitraum.</td></tr>'}
              </tbody>
            </table>

            <div class="signature-block" style="margin-top: 32px; width: 280px; text-align: center; page-break-inside: avoid; break-inside: avoid;">
              <div style="height: 55px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 52px; max-width: 240px; object-fit: contain;">` : ''}
              </div>
              <div style="border-top: 1px solid #64748b; padding-top: 6px; font-size: 11px;">
                <strong style="color: #1e293b;">${escapeHtml(contractorName)}</strong> (Steuerpflichtiger)<br>
                <small style="color: #64748b;">Ort, Datum: ${escapeHtml(city)}, ${printDateStr}</small>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      win.document.open();
      win.document.write(html);
      win.document.close();
      const img = win.document.querySelector("img[alt='Signatur']");
      if (img && !img.complete) {
        img.onload = () => setTimeout(() => { win.print(); }, 150);
        img.onerror = () => setTimeout(() => { win.print(); }, 150);
      }
    }

    // 🚗 PDF REINER FAHRTEN- & REISEKOSTENNACHWEIS
    function openTravelReportPdf() {
      if (!currentTaxReportData) {
        alert("Bitte warten Sie, bis die Daten geladen sind.");
        return;
      }

      const d = currentTaxReportData;
      const totals = d.totals || {};
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";
      const periodStr = month !== "all" ? `${month}/${year}` : `Gesamtjahr ${year}`;

      const win = window.open("", "_blank");
      if (!win) {
        alert("Pop-up-Blocker aktiv. Bitte erlauben Sie Pop-ups für diese Seite.");
        return;
      }

      const useSig = (globalSettings.use_signature_on_documents !== 0 && localStorage.getItem("cfg_use_signature_documents") !== "0");
      const sigDataUrl = useSig 
        ? (globalSettings.contractor_signature_data_url || localStorage.getItem("cfg_contractor_signature_data_url") || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : ""))
        : "";
      const city = globalSettings.company_city || localStorage.getItem("cfg_company_city") || "Neumünster";
      const printDateStr = new Date().toLocaleDateString('de-DE');

      const contractorName = (globalSettings && globalSettings.contractor_full_name) || (globalSettings.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : (globalSettings.contractor_name || localStorage.getItem("cfg_contractor_name") || "Michael Kirst-Neshva"));
      const contractorTitle = (globalSettings && globalSettings.contractor_title) || "Senior IT Consultant & Enterprise Architect";
      const taxNr = (globalSettings && globalSettings.tax_number) || "123/456/78901";

      const trips = d.trips || [];
      let tripsRows = trips.map(t => {
        const isCommute = t.is_commute;
        const typeLabel = isCommute ? "Pendler (1. Stätte)" : "Auswärtstätigkeit";
        const distStr = isCommute ? `${t.distance_km} km (einfach)` : `${t.distance_km} km (Hin/Rück)`;
        const routeStr = t.route_display || `${t.origin} ➔ ${t.destination}`;
        const hasLegs = t.legs && t.legs.length > 0;
        return `
          <tr>
            <td><strong>${t.trip_date}</strong></td>
            <td>${typeLabel}</td>
            <td><strong>${escapeHtml(t.customer_name)}</strong><br><small>${escapeHtml(t.project_name)}</small></td>
            <td>
              <strong>${escapeHtml(t.purpose)}</strong>
              ${t.destination ? `<br><small style="color: #1e40af;"><strong>Ziel:</strong> ${escapeHtml(t.destination)}</small>` : ''}
            </td>
            <td><small><strong>${escapeHtml(routeStr)}</strong></small></td>
            <td style="text-align: right;">${distStr}</td>
            <td style="text-align: right;">${(t.rate_per_km || 0.30).toFixed(2)} €</td>
            <td style="text-align: right;">${formatCurrency(t.travel_cost || 0)}</td>
            <td style="text-align: right;">${t.vma_amount > 0 ? formatCurrency(t.vma_amount) : '-'}</td>
            <td style="text-align: right;"><strong>${formatCurrency(t.total_cost || 0)}</strong></td>
          </tr>
          ${hasLegs ? `
            <tr style="background: #f8fafc;">
              <td colspan="10" style="padding: 4px 8px; font-size: 9.5px; border-top: none; color: #475569;">
                <div style="font-weight: 700; margin-bottom: 2px;">📍 Etappen-Dokumentation:</div>
                ${t.legs.map((l, i) => `#${i + 1} (${l.date_leg || t.trip_date}): ${escapeHtml(l.start_location)} ➔ ${escapeHtml(l.destination_location)} [${escapeHtml(l.transport_type)}, ${l.transport_type === 'PersonalCar' ? l.distance_km + ' km' : formatCurrency(l.travel_cost_net || 0)}]${l.layover_purpose ? ` - Aufenthalt: ${escapeHtml(l.layover_purpose)}` : ''}`).join(' &bull; ')}
              </td>
            </tr>
          ` : ''}
        `;
      }).join("");

      const html = `
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="UTF-8">
          <title>Reisekosten- & Fahrtennachweis - ${periodStr}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm 14mm 15mm 14mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #0f172a; margin: 0; padding: 20px; font-size: 11px; }
            .toolbar { position: fixed; top: 0; left: 0; right: 0; background: #0f172a; color: #fff; padding: 10px 20px; display: flex; justify-content: space-between; align-items: center; z-index: 9999; }
            .btn { background: #1e40af; color: #fff; border: none; padding: 8px 16px; border-radius: 6px; font-weight: 600; cursor: pointer; }
            .a4-page { max-width: 820px; margin: 50px auto 20px auto; background: #fff; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 16px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 7px; text-align: left; }
            th { background: #f1f5f9; font-weight: 700; color: #1e293b; font-size: 10px; }
            .summary-card { background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 12px; margin-bottom: 16px; display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 12px; }
            @media print {
              body { padding: 0 !important; background: #fff !important; }
              .toolbar { display: none !important; }
              .a4-page { margin: 0 !important; max-width: 100% !important; padding: 0 !important; }
              thead { display: table-header-group !important; }
              tfoot { display: table-footer-group !important; }
              tr { page-break-inside: avoid !important; break-inside: avoid !important; }
              th, td { page-break-inside: avoid !important; break-inside: avoid !important; }
              .summary-card { page-break-inside: avoid !important; break-inside: avoid !important; }
              .signature-block { page-break-inside: avoid !important; break-inside: avoid !important; }
            }
          </style>
        </head>
        <body>
          <div class="toolbar">
            <div><strong>Amtlicher Reise- & Fahrtennachweis (§ 4 Abs. 5 EStG / § 9 EStG)</strong> &bull; ${periodStr}</div>
            <button class="btn" onclick="window.print()">🖨️ Drucken / Als PDF speichern</button>
          </div>
          <div class="a4-page">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 10px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 18px; margin: 0 0 4px 0; color: #0f172a;">Amtlicher Fahrt- & Reisekostennachweis</h1>
                <div style="color: #64748b; font-size: 12px;">Isolierte Aufstellung &bull; Zeitraum: <strong>${periodStr}</strong></div>
              </div>
              <div style="text-align: right; font-size: 11px;">
                <strong>${escapeHtml(contractorName)}</strong><br>
                ${escapeHtml(contractorTitle)}<br>
                Steuernummer: ${escapeHtml(taxNr)}
              </div>
            </div>

            <!-- Summary Box -->
            <div class="summary-card">
              <div>
                <strong style="color: #1e40af;">🚗 Auswärtstätigkeiten (Dienstreisen):</strong><br>
                Fahrtstrecke: <strong>${(totals.business_trip_km || 0).toLocaleString("de-DE")} km</strong> (Hin- & Rück)<br>
                Fahrtkosten: <strong>${formatCurrency(totals.business_trip_cost || 0)}</strong><br>
                Verpflegungsmehraufwand: <strong>${formatCurrency(totals.business_trip_vma || 0)}</strong>
              </div>
              <div>
                <strong style="color: #d97706;">📍 Erste Betriebsstätte (Pendler):</strong><br>
                Entfernung: <strong>${(totals.commute_trip_km || 0).toLocaleString("de-DE")} km</strong> (einfach)<br>
                Entfernungspauschale: <strong>${formatCurrency(totals.commute_trip_cost || 0)}</strong><br>
                VMA-Anspruch: <em>0,00 € gem. § 9 EStG</em>
              </div>
              <div style="border-left: 2px solid #0f172a; padding-left: 12px;">
                <strong style="color: #0f172a;">GESAMTER REISEABZUG:</strong><br>
                <div style="font-size: 18px; font-weight: 800; color: #166534; margin: 6px 0;">
                  ${formatCurrency(totals.travel_total_deductible || 0)}
                </div>
                <small style="color: #64748b;">(EÜR Zeilen Reisekosten & Pendler)</small>
              </div>
            </div>

            <h3 style="font-size: 13px; margin: 16px 0 6px 0; border-bottom: 1.5px solid #cbd5e1; padding-bottom: 4px;">Einzelfahrten-Protokoll</h3>
            <table>
              <thead>
                <tr>
                  <th>Datum</th>
                  <th>Art der Fahrt</th>
                  <th>Kunde / Projekt</th>
                  <th>Reisezweck</th>
                  <th>Strecke</th>
                  <th style="text-align: right;">km</th>
                  <th style="text-align: right;">Satz</th>
                  <th style="text-align: right;">Fahrtkosten</th>
                  <th style="text-align: right;">VMA</th>
                  <th style="text-align: right;">Summe</th>
                </tr>
              </thead>
              <tbody>
                ${tripsRows.length > 0 ? tripsRows : '<tr><td colspan="10" style="text-align:center;">Keine Fahrten im gewählten Zeitraum.</td></tr>'}
              </tbody>
            </table>

            <div style="margin-top: 28px; padding-top: 12px; border-top: 1px solid #cbd5e1; display: flex; justify-content: space-between; align-items: flex-end; font-size: 10px; color: #334155; page-break-inside: avoid; break-inside: avoid;">
              <div style="max-width: 480px; line-height: 1.5;">
                Hiermit bestätige ich die Richtigkeit und die ausschließliche betriebliche Veranlassung der oben aufgeführten Fahrten und Reisekosten gem. § 4 Abs. 5 EStG / § 9 EStG.
              </div>
              <div class="signature-block" style="width: 260px; text-align: center; page-break-inside: avoid; break-inside: avoid;">
                <div style="height: 52px; display: flex; align-items: flex-end; justify-content: center; margin-bottom: 2px;">
                  ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Signatur" style="max-height: 50px; max-width: 220px; object-fit: contain;">` : ''}
                </div>
                <div style="border-top: 1px solid #64748b; padding-top: 6px; font-size: 11px;">
                  <strong style="color: #1e293b;">${escapeHtml(contractorName)}</strong> (Steuerpflichtiger)<br>
                  <small style="color: #64748b;">Ort, Datum: ${escapeHtml(city)}, ${printDateStr}</small>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      win.document.open();
      win.document.write(html);
      win.document.close();
      const img = win.document.querySelector("img[alt='Signatur']");
      if (img && !img.complete) {
        img.onload = () => setTimeout(() => { win.print(); }, 150);
        img.onerror = () => setTimeout(() => { win.print(); }, 150);
      }
    }

    // 📊 EXCEL EXPORTE (.xlsx)
    function exportTaxReportXlsx() {
      if (!currentTaxReportData) {
        alert("Bitte warten Sie, bis die Daten geladen sind.");
        return;
      }
      if (typeof XLSX === "undefined") {
        alert("Excel-Bibliothek (SheetJS) wird noch geladen. Bitte versuchen Sie es in wenigen Sekunden erneut.");
        return;
      }

      const d = currentTaxReportData;
      const totals = d.totals || {};
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";

      const wb = XLSX.utils.book_new();

      // Tab 1: Cockpit & EÜR
      const cockpitRows = [
        ["Steuer- & EÜR-Cockpit", `Zeitraum: ${month}/${year}`],
        [],
        ["Kennzahl", "Wert (EUR)", "Bemerkung"],
        ["Betriebseinnahmen (Netto)", totals.revenue_net || 0, "Umsatzerlöse"],
        ["Betriebseinnahmen (Brutto)", totals.revenue_gross || 0, "Inkl. USt"],
        ["USt-Zahllast (Kz 81)", totals.elster_kz_81_tax || 0, "19% USt auf Erlöse"],
        ["Abziehbare Vorsteuer (Kz 66)", totals.elster_kz_66_input_tax || 0, "Gezahlte Vorsteuer aus Belegen"],
        ["Verbleibender USt-Saldo (Kz 83)", totals.vat_balance || 0, "Zahllast (+) bzw. Erstattung (-)"],
        [],
        ["Betriebsausgaben Reisekosten (Dienstreisen)", totals.business_trip_total || 0, "Fahrtkosten + VMA"],
        ["Betriebsausgaben Pendlerpauschale", totals.commute_trip_cost || 0, "Fahrten Wohnung-Betriebsstätte"],
        ["Betriebsausgaben Belege (Abzugsfähig)", totals.vouchers_deductible_net || 0, "70% Bewirtung, 100% Sonstiges"],
        ["Gesamte abzugsfähige Betriebsausgaben", totals.total_expenses_deductible || 0, ""],
        [],
        ["VORLÄUFIGER EÜR-GEWINN / ÜBERSCHUSS", totals.preliminary_profit_euer || 0, "Einnahmen minus Ausgaben"]
      ];
      const wsCockpit = XLSX.utils.aoa_to_sheet(cockpitRows);
      XLSX.utils.book_append_sheet(wb, wsCockpit, "EÜR & Cockpit");

      // Tab 2: Einnahmen
      const incomeRows = [
        ["Periode", "Kunde", "Projekt", "Projekt-Nr", "Stunden", "Netto (EUR)", "USt-Satz (%)", "USt (EUR)", "Brutto (EUR)", "Status", "Rechnungsnummer"]
      ];
      (d.timesheets || []).forEach(ts => {
        incomeRows.push([
          ts.period, ts.customer_name, ts.project_name, ts.project_number,
          ts.total_billable_hours, ts.amount_net, ts.tax_rate, ts.tax_amount, ts.amount_gross,
          ts.status, ts.lexware_invoice_number || ""
        ]);
      });
      const wsIncome = XLSX.utils.aoa_to_sheet(incomeRows);
      XLSX.utils.book_append_sheet(wb, wsIncome, "Einnahmen");

      // Tab 3: Reisekosten
      const tripRows = [
        ["Datum", "Fahrt-Typ", "Kunde", "Projekt", "Reisezweck", "Start", "Ziel", "Kilometer", "km-Satz (EUR)", "Fahrtkosten (EUR)", "VMA (EUR)", "Gesamtabzug (EUR)"]
      ];
      (d.trips || []).forEach(t => {
        tripRows.push([
          t.trip_date, t.travel_type_label, t.customer_name, t.project_name, t.purpose,
          t.origin, t.destination, t.distance_km, t.rate_per_km, t.travel_cost, t.vma_amount, t.total_cost
        ]);
      });
      const wsTrips = XLSX.utils.aoa_to_sheet(tripRows);
      XLSX.utils.book_append_sheet(wb, wsTrips, "Reisekosten");

      // Tab 4: Betriebsausgaben
      const voucherRows = [
        ["Datum", "Beleg-Nr", "Typ", "Lieferant", "Beschreibung", "Zweck", "SKR04", "Netto (EUR)", "Vorsteuer (EUR)", "Brutto (EUR)", "Abzugsfähig EÜR (EUR)", "Nicht abzugsfähig (EUR)"]
      ];
      (d.vouchers || []).forEach(v => {
        voucherRows.push([
          v.voucher_date, v.voucher_number, v.voucher_type, v.supplier_name, v.description,
          v.business_purpose, v.skr04_account, v.amount_net, v.tax_amount, v.amount_gross,
          v.tax_deductible_net, v.tax_non_deductible_net
        ]);
      });
      const wsVouchers = XLSX.utils.aoa_to_sheet(voucherRows);
      XLSX.utils.book_append_sheet(wb, wsVouchers, "Betriebsausgaben");

      // Tab 5: USt-Verprobung
      const vatRows = [
        ["USt-Verprobung für Elster USt-Voranmeldung", `Zeitraum: ${month}/${year}`],
        [],
        ["Kennziffer", "Bezeichnung", "Bemessungsgrundlage (EUR)", "Steuerbetrag (EUR)"],
        ["Kz 81", "Steuerpflichtige Umsätze zum Steuersatz von 19 %", totals.elster_kz_81_base || 0, totals.elster_kz_81_tax || 0],
        ["Kz 66", "Vorsteuerbeträge aus Rechnungen von anderen Unternehmern", totals.vouchers_net || 0, totals.elster_kz_66_input_tax || 0],
        ["Kz 83", "Verbleibende Umsatzsteuer-Vorauszahlung / Zahllast", "", totals.vat_balance || 0]
      ];
      const wsVat = XLSX.utils.aoa_to_sheet(vatRows);
      XLSX.utils.book_append_sheet(wb, wsVat, "USt-Verprobung");

      XLSX.writeFile(wb, `Steuerbericht_EUER_${year}_${month}.xlsx`);
    }

    function exportTravelReportXlsx() {
      if (!currentTaxReportData) {
        alert("Bitte warten Sie, bis die Daten geladen sind.");
        return;
      }
      if (typeof XLSX === "undefined") {
        alert("Excel-Bibliothek (SheetJS) wird noch geladen.");
        return;
      }

      const d = currentTaxReportData;
      const totals = d.totals || {};
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";

      const wb = XLSX.utils.book_new();

      // Tab 1: Einzelfahrten
      const tripRows = [
        ["Datum", "Art der Fahrt", "Kunde", "Projekt", "Projekt-Nr", "Reisezweck", "Startort", "Zielort (Aufenthalt)", "Rückkehrort", "Reiseweg (Route)", "Kilometer", "km-Satz (EUR)", "Fahrtkosten (EUR)", "VMA (EUR)", "Gesamtabzug (EUR)"]
      ];
      (d.trips || []).forEach(t => {
        tripRows.push([
          t.trip_date, t.travel_type_label, t.customer_name, t.project_name, t.project_number,
          t.purpose, t.origin, t.destination, t.return_location || t.origin, t.route_display || `${t.origin} ➔ ${t.destination}`,
          t.distance_km, t.rate_per_km, t.travel_cost,
          t.vma_amount, t.total_cost
        ]);
      });
      const wsTrips = XLSX.utils.aoa_to_sheet(tripRows);
      XLSX.utils.book_append_sheet(wb, wsTrips, "Fahrtenbuch & Reisen");

      // Tab 1b: Etappen-Dokumentation (falls vorhanden)
      const legRows = [
        ["Reise-Datum", "Kunde", "Projekt", "Reisezweck", "Etappe #", "Etappen-Datum", "Startort", "Zielort", "Verkehrsmittel", "km", "Fahrtkosten (EUR)", "Aufenthalt (h)", "Aufenthalts-Zweck"]
      ];
      (d.trips || []).forEach(t => {
        if (t.legs && t.legs.length > 0) {
          t.legs.forEach((l, idx) => {
            legRows.push([
              t.trip_date, t.customer_name, t.project_name, t.purpose,
              idx + 1, l.date_leg || t.trip_date, l.start_location, l.destination_location,
              l.transport_type, l.distance_km || 0, l.travel_cost_net || 0, l.layover_hours || 0, l.layover_purpose || ""
            ]);
          });
        }
      });
      if (legRows.length > 1) {
        const wsLegs = XLSX.utils.aoa_to_sheet(legRows);
        XLSX.utils.book_append_sheet(wb, wsLegs, "Reise-Etappen (Details)");
      }

      // Tab 2: Zusammenfassung
      const sumRows = [
        ["Zusammenfassung Fahrt- & Reisekosten", `Zeitraum: ${month}/${year}`],
        [],
        ["Kategorie", "Kilometer", "Fahrtkosten / Pauschale (EUR)", "VMA (EUR)", "Gesamtabzug (EUR)"],
        ["Auswärtstätigkeiten (Dienstreisen)", totals.business_trip_km || 0, totals.business_trip_cost || 0, totals.business_trip_vma || 0, totals.business_trip_total || 0],
        ["Erste Betriebsstätte (Pendler)", totals.commute_trip_km || 0, totals.commute_trip_cost || 0, 0, totals.commute_trip_cost || 0],
        [],
        ["GESAMTSUMME REISEKOSTEN", (totals.business_trip_km || 0) + (totals.commute_trip_km || 0), (totals.business_trip_cost || 0) + (totals.commute_trip_cost || 0), totals.business_trip_vma || 0, totals.travel_total_deductible || 0]
      ];
      const wsSum = XLSX.utils.aoa_to_sheet(sumRows);
      XLSX.utils.book_append_sheet(wb, wsSum, "EÜR-Zusammenfassung");

      XLSX.writeFile(wb, `Reisekostennachweis_${year}_${month}.xlsx`);
    }

    // 📑 CSV EXPORTE
    function exportTaxReportCsv() {
      if (!currentTaxReportData) return;
      const d = currentTaxReportData;
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";

      let csv = "\uFEFFBereich;Datum;Nummer;Typ/Kategorie;Kunde/Lieferant;Beschreibung/Zweck;Netto;Vorsteuer;Brutto;EÜR_Abzug\n";

      (d.timesheets || []).forEach(ts => {
        csv += `EINNAHME;${ts.period};"${ts.lexware_invoice_number || ''}";"Umsatzerlöse";"${ts.customer_name}";"${ts.project_name}";${ts.amount_net};${ts.tax_amount};${ts.amount_gross};${ts.amount_net}\n`;
      });

      (d.trips || []).forEach(t => {
        csv += `REISE;${t.trip_date};"TRIP";"${t.travel_type_label}";"${t.customer_name}";"${t.purpose} (${t.origin} -> ${t.destination})";${t.total_cost};0;${t.total_cost};${t.total_cost}\n`;
      });

      (d.vouchers || []).forEach(v => {
        csv += `BELEG;${v.voucher_date};"${v.voucher_number}";"${v.voucher_type}";"${v.supplier_name}";"${v.description}";${v.amount_net};${v.tax_amount};${v.amount_gross};${v.tax_deductible_net}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Steuerjournal_${year}_${month}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    function exportTravelReportCsv() {
      if (!currentTaxReportData) return;
      const d = currentTaxReportData;
      const year = document.getElementById("tax-filter-year")?.value || "2026";
      const month = document.getElementById("tax-filter-month")?.value || "all";

      let csv = "\uFEFFDatum;Fahrt_Typ;Kunde;Projekt;Reisezweck;Startort;Zielort;Rueckkehrort;Reiseweg_Route;Kilometer;km_Satz;Fahrtkosten;VMA;Gesamtbetrag\n";

      (d.trips || []).forEach(t => {
        csv += `${t.trip_date};"${t.travel_type_label}";"${t.customer_name}";"${t.project_name}";"${t.purpose}";"${t.origin}";"${t.destination}";"${t.return_location || t.origin}";"${t.route_display || (t.origin + ' ➔ ' + t.destination)}";${t.distance_km};${t.rate_per_km};${t.travel_cost};${t.vma_amount};${t.total_cost}\n`;
      });

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reisekosten_Protokoll_${year}_${month}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    // ==========================================
    // 💾 BACKUP, EXPORTE & DISASTER RECOVERY
    // ==========================================
    async function loadBackupFilterDropdowns() {
      const custSelect = document.getElementById("backup-filter-customer");
      if (!custSelect) return;

      try {
        const res = await fetch(`${API_BASE}/customers?includeArchived=true`);
        if (res.ok) {
          const data = await res.json();
          const customers = Array.isArray(data) ? data : (data.customers || []);
          custSelect.innerHTML = `<option value="all">Alle Kunden</option>` + 
            customers.map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join("");
        }
      } catch (e) {
        console.error("Error loading backup filter customers:", e);
      }

      onBackupCustomerChange();
    }

    async function onBackupCustomerChange() {
      const custSelect = document.getElementById("backup-filter-customer");
      const projSelect = document.getElementById("backup-filter-project");
      if (!custSelect || !projSelect) return;

      const custId = custSelect.value;
      if (custId === "all") {
        try {
          const res = await fetch(`${API_BASE}/projects?includeArchived=true`);
          if (res.ok) {
            const projects = await res.json();
            projSelect.innerHTML = `<option value="all">Alle Projekte</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      } else {
        try {
          const res = await fetch(`${API_BASE}/customers/${custId}/overview`);
          if (res.ok) {
            const data = await res.json();
            const projects = data.projects || [];
            projSelect.innerHTML = `<option value="all">Alle Projekte dieses Kunden</option>` +
              projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join("");
          }
        } catch {}
      }
    }

    function getBackupFilters() {
      return {
        customerId: document.getElementById("backup-filter-customer")?.value || "all",
        projectId: document.getElementById("backup-filter-project")?.value || "all",
        year: document.getElementById("backup-filter-year")?.value || "all",
        month: document.getElementById("backup-filter-month")?.value || "all"
      };
    }

    // 1. Leistungsnachweise PDFs als ZIP
    async function exportTimesheetPdfsZip() {
      const btn = document.getElementById("btn-export-pdf-zip");
      const statusEl = document.getElementById("export-pdf-status");
      const filters = getBackupFilters();

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Erstelle PDF-Archiv...`;
      }
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.innerText = "Lade Nachweis-Manifest...";
      }

      try {
        const manifestRes = await fetch(`${API_BASE}/export/timesheet-manifest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!manifestRes.ok) throw new Error("Fehler beim Abrufen der Nachweise.");
        const { timesheets } = await manifestRes.json();

        if (!timesheets || timesheets.length === 0) {
          alert("Keine Leistungsnachweise für die gewählten Filterkriterien gefunden.");
          return;
        }

        if (typeof JSZip === "undefined") {
          throw new Error("JSZip-Bibliothek wird geladen... Bitte versuchen Sie es in wenigen Sekunden erneut.");
        }

        const zip = new JSZip();
        let processed = 0;

        for (const ts of timesheets) {
          processed++;
          if (statusEl) statusEl.innerText = `Generiere PDF ${processed} von ${timesheets.length}: ${ts.period} (${ts.project_name})...`;

          try {
            const pdfRes = await fetch(`${API_BASE}/timesheets/${ts.id}/pdf`);
            if (pdfRes.ok) {
              const blob = await pdfRes.blob();
              const safeCust = (ts.customer_name || 'Kunde').replace(/[^a-zA-Z0-9_-]/g, '_');
              const safeProj = (ts.project_name || 'Projekt').replace(/[^a-zA-Z0-9_-]/g, '_');
              const filename = `${ts.period}_${safeCust}_${safeProj}_v${ts.version_number || 1}.pdf`;
              zip.file(filename, blob);
            }
          } catch (err) {
            console.warn(`PDF generation error for ${ts.id}:`, err);
          }
        }

        if (statusEl) statusEl.innerText = "Komprimiere ZIP-Archiv...";
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Leistungsnachweise_${filters.year}_${filters.month}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        if (statusEl) statusEl.innerText = `✅ ${timesheets.length} PDFs erfolgreich als ZIP heruntergeladen!`;
      } catch (err) {
        alert("Export-Fehler: " + err.message);
        if (statusEl) statusEl.innerText = "Fehler beim Export.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-file-zipper"></i> PDFs als ZIP herunterladen`;
        }
      }
    }

    // 2. Steuer- & Reisekostenbelege als ZIP
    async function exportTaxReceiptsZip() {
      const btn = document.getElementById("btn-export-receipts-zip");
      const statusEl = document.getElementById("export-receipts-status");
      const filters = getBackupFilters();

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = `<span class="spinner"></span> Sammle Belege...`;
      }
      if (statusEl) {
        statusEl.style.display = "block";
        statusEl.innerText = "Lade Beleg-Übersicht aus R2...";
      }

      try {
        const manifestRes = await fetch(`${API_BASE}/export/tax-receipts-manifest`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(filters)
        });

        if (!manifestRes.ok) throw new Error("Fehler beim Abrufen des Beleg-Manifests.");
        const { receipts, signedDocs } = await manifestRes.json();

        const totalCount = (receipts?.length || 0) + (signedDocs?.length || 0);
        if (totalCount === 0) {
          alert("Keine Belege oder signierten Dokumente für die gewählten Filter gefunden.");
          return;
        }

        const zip = new JSZip();
        const originalFolder = zip.folder("Originalbelege_Quittungen");
        const signedFolder = zip.folder("Unterschriebene_Nachweise");

        let csv = "\uFEFFTyp;ID;Kunde;Projekt;Datum / Periode;Dateiname;Betrag Brutto;Betrag Netto;MwSt\n";
        let current = 0;

        // 1. Quittungen
        for (const r of (receipts || [])) {
          current++;
          if (statusEl) statusEl.innerText = `Lade Beleg ${current} von ${totalCount}...`;
          csv += `QUITTUNG;${r.id};"${r.customer_name}";"${r.project_name}";${r.uploaded_at_utc?.substring(0, 10)};"${r.original_filename}";${r.amount_gross || 0};${r.amount_net || 0};${r.vat_rate || 0}\n`;

          try {
            const fileRes = await fetch(`${API_BASE}/receipts/${r.id}/download`);
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              originalFolder.file(`${r.uploaded_at_utc?.substring(0, 10)}_${r.original_filename}`, blob);
            }
          } catch (e) {
            console.warn("Receipt download error:", e);
          }
        }

        // 2. Signierte Nachweise
        for (const s of (signedDocs || [])) {
          current++;
          if (statusEl) statusEl.innerText = `Lade Dokument ${current} von ${totalCount}...`;
          csv += `SIGNIERTES_DOKUMENT;${s.id};"${s.customer_name}";"${s.project_name}";${s.period};"${s.signed_document_filename}";0;0;0\n`;

          try {
            const fileRes = await fetch(`${API_BASE}/public/timesheets/${s.id}/download-signed-document`);
            if (fileRes.ok) {
              const blob = await fileRes.blob();
              signedFolder.file(`${s.period}_v${s.version_number || 1}_${s.signed_document_filename || 'Nachweis.pdf'}`, blob);
            }
          } catch (e) {
            console.warn("Signed doc download error:", e);
          }
        }

        zip.file("Belege_Uebersicht.csv", csv);

        if (statusEl) statusEl.innerText = "Komprimiere Belege-ZIP...";
        const zipBlob = await zip.generateAsync({ type: "blob" });

        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `Steuerbelege_Reisekosten_${filters.year}_${filters.month}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);

        if (statusEl) statusEl.innerText = `✅ ${totalCount} Belege erfolgreich als ZIP archiviert!`;
      } catch (err) {
        alert("Fehler beim Beleg-Export: " + err.message);
        if (statusEl) statusEl.innerText = "Fehler beim Export.";
      } finally {
        if (btn) {
          btn.disabled = false;
          btn.innerHTML = `<i class="fa-solid fa-cloud-arrow-down"></i> Belege als ZIP herunterladen`;
        }
      }
    }

