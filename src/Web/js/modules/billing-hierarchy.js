    function onBillingMonthFilterChanged(val) {
      currentBillingMonthFilter = val;
      renderBillingHierarchy();
    }

    function onBillingCustomerFilterChanged(val) {
      currentBillingCustomerFilter = val;
      renderBillingHierarchy();
    }

    async function loadBillingHierarchy() {
      const container = document.getElementById("billing-hierarchy-container");
      if (!container) return;
      container.innerHTML = `<div style="text-align: center; padding: 40px;"><span class="spinner"></span> Lade Abrechnungs- und Freigabestruktur...</div>`;

      try {
        const res = await fetch(`${API_BASE}/billing/hierarchy`);
        if (!res.ok) throw new Error("Fehler beim Abrufen der Abrechnungsdaten");
        globalBillingHierarchy = await res.json();

        // Populate Month & Customer Dropdowns
        populateBillingFilterDropdowns();

        renderBillingHierarchy();
      } catch (err) {
        container.innerHTML = `<div style="color: red; padding: 20px;">Fehler: ${err.message}</div>`;
      }
    }

    function populateBillingFilterDropdowns() {
      const monthSelect = document.getElementById("filter-billing-month");
      const custSelect = document.getElementById("filter-billing-customer");

      if (monthSelect) {
        const uniqueMonths = new Set();
        for (const cust of (globalBillingHierarchy || [])) {
          for (const p of (cust.projects || [])) {
            for (const m of (p.months || [])) {
              if (m.period) uniqueMonths.add(m.period);
            }
          }
        }
        const sortedMonths = Array.from(uniqueMonths).sort().reverse();
        monthSelect.innerHTML = `<option value="">-- Alle Monate --</option>` + 
          sortedMonths.map(m => `<option value="${m}" ${m === currentBillingMonthFilter ? 'selected' : ''}>${m} (${formatMonthName(m)})</option>`).join("");
      }

      if (custSelect) {
        custSelect.innerHTML = `<option value="">-- Alle Kunden --</option>` + 
          (globalBillingHierarchy || []).map(c => `<option value="${c.id}" ${c.id === currentBillingCustomerFilter ? 'selected' : ''}>${c.name}</option>`).join("");
      }
    }

    function formatMonthName(periodStr) {
      if (!periodStr || !periodStr.includes("-")) return periodStr;
      const [year, month] = periodStr.split("-");
      const monthNames = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
      const mIdx = parseInt(month, 10) - 1;
      return `${monthNames[mIdx] || month} ${year}`;
    }

    function setBillingFilter(filter) {
      currentBillingFilter = filter;
      document.getElementById("filter-btn-all").className = filter === "all" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("filter-btn-unbilled").className = filter === "unbilled" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("filter-btn-billed").className = filter === "billed" ? "btn btn-primary" : "btn btn-outline";
      renderBillingHierarchy();
    }

    function setBillingType(type) {
      currentBillingType = type;
      document.getElementById("type-btn-all").className = type === "all" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("type-btn-time").className = type === "time" ? "btn btn-primary" : "btn btn-outline";
      document.getElementById("type-btn-travel").className = type === "travel" ? "btn btn-primary" : "btn btn-outline";
      renderBillingHierarchy();
    }

    function renderBillingHierarchy() {
      const container = document.getElementById("billing-hierarchy-container");
      if (!container) return;

      if (!globalBillingHierarchy || globalBillingHierarchy.length === 0) {
        container.innerHTML = `<div class="card" style="padding: 24px; text-align: center; color: var(--text-muted);">Keine Kunden- oder Abrechnungsdaten vorhanden.</div>`;
        return;
      }

      let html = "";

      for (const cust of globalBillingHierarchy) {
        // Filter nach Kunde
        if (currentBillingCustomerFilter && cust.id !== currentBillingCustomerFilter) {
          continue;
        }

        const projects = cust.projects || [];
        if (projects.length === 0) continue;

        // Filter nach Status & Monat
        const renderedProjects = projects.map(p => {
          const months = (p.months || []).filter(m => {
            if (currentBillingMonthFilter && m.period !== currentBillingMonthFilter) {
              return false;
            }
            if (currentBillingFilter === "unbilled") {
              return m.status !== "Invoiced";
            }
            if (currentBillingFilter === "billed") {
              return m.status === "Invoiced";
            }
            return true;
          });
          return { ...p, filteredMonths: months };
        }).filter(p => p.filteredMonths.length > 0);

        if (renderedProjects.length === 0) continue;

        html += `
          <div class="card" style="margin-bottom: 24px; border-top: 4px solid var(--primary); padding: 20px;">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px;">
              <div>
                <h2 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 2px;">
                  <i class="fa-solid fa-building"></i> ${cust.name}
                </h2>
                <small style="color: var(--text-muted);">${cust.contact_person ? cust.contact_person + ' | ' : ''}${cust.email || ''} | Lexware-ID: ${cust.lexware_contact_id}</small>
              </div>
            </div>

            <!-- Projekte des Kunden -->
            <div style="display: grid; gap: 16px;">
              ${renderedProjects.map(p => `
                <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                    <div>
                      <h3 style="font-size: 1.05rem; color: #1e293b; margin-bottom: 2px;">
                        <i class="fa-solid fa-folder-open" style="color: var(--primary);"></i> ${p.name}
                      </h3>
                      <small style="color: var(--text-muted);">${p.project_number} • Stundensatz: ${p.default_hourly_rate.toFixed(2)} €/h Netto</small>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; background: #fff; border-color: #2563eb; color: #2563eb; font-weight: 600;" onclick="openQuickTimeEntryModal('${p.id}', '${cust.id}', '${p.name.replace(/'/g, "\\'")}', ${p.default_hourly_rate}, ${p.hierarchy_level || 1})">
                        <i class="fa-solid fa-plus"></i> Zeit erfassen
                      </button>
                      ${p.lexware_quotation_number ? `<span class="badge badge-success" style="font-size: 0.75rem;"><i class="fa-solid fa-file-invoice"></i> Angebot: ${p.lexware_quotation_number}</span>` : ''}
                      ${p.lexware_order_confirmation_number ? `<span class="badge badge-info" style="font-size: 0.75rem;"><i class="fa-solid fa-file-signature"></i> AB: ${p.lexware_order_confirmation_number}</span>` : ''}
                    </div>
                  </div>

                  <!-- Monate / Abrechnungsperioden -->
                  <div style="display: grid; gap: 16px;">
                    ${p.filteredMonths.map(m => {
                      let statusBadge = "";
                      let actionsHtml = "";
                      const isSelectable = m.status === "Draft" || !m.timesheetId || m.status === "Rejected" || m.status === "InvoiceCanceled";
                      const isEntryEditable = isSelectable;
                      const hasTs = !!m.timesheetId;

                      if (m.status === "PendingSignature") {
                        statusBadge = `<span class="badge badge-warning"><i class="fa-solid fa-clock"></i> Liegt zur Unterzeichnung vor (GoBD-gesperrt)</span>`;
                        actionsHtml = `
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="approveTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-check"></i> Als per E-Mail genehmigt markieren
                          </button>
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #be123c; border-color: #fecdd3;" onclick="rejectTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-xmark"></i> Ablehnen
                          </button>
                        `;
                      } else if (m.status === "Approved") {
                        statusBadge = `<span class="badge badge-success"><i class="fa-solid fa-circle-check"></i> Wurde genehmigt, noch nicht abgerechnet</span>`;
                        const isStandalone = (globalSettings.billing_provider === 'none');
                        actionsHtml = `
                          ${isStandalone ? `
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem; background: #16a34a; border-color: #16a34a;" onclick="markTimesheetAsInvoicedManually('${m.timesheetId}', '${m.period}')">
                              <i class="fa-solid fa-check-double"></i> Als abgerechnet markieren
                            </button>
                          ` : `
                            <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="createInvoiceForTimesheet('${m.timesheetId}')">
                              <i class="fa-solid fa-file-invoice-dollar"></i> Rechnung in Lexware erstellen
                            </button>
                            <button class="btn btn-outline" style="padding: 4px 8px; font-size: 0.78rem;" title="Manuell als extern abgerechnet markieren" onclick="markTimesheetAsInvoicedManually('${m.timesheetId}', '${m.period}')">
                              <i class="fa-solid fa-file-signature"></i> Manuell
                            </button>
                          `}
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem; color: #be123c; border-color: #fecdd3;" onclick="rejectTimesheetPrompt('${m.timesheetId}', '${m.period}', '${p.name}')">
                            <i class="fa-solid fa-xmark"></i> Zurückweisen
                          </button>
                        `;
                      } else if (m.status === "Invoiced") {
                        const invNr = m.lexwareInvoiceNumber || m.externalInvoiceNumber || 'abgerechnet';
                        statusBadge = `<span class="badge badge-info"><i class="fa-solid fa-file-invoice"></i> In Rechnung ${invNr}</span>`;
                        actionsHtml = `
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="syncInvoices()">
                            <i class="fa-solid fa-arrows-rotate"></i> Storno-Check Lexware
                          </button>
                        `;
                      } else if (m.status === "InvoiceCanceled") {
                        statusBadge = `<span class="badge badge-warning" style="background: #fff7ed; color: #c2410c; border: 1px solid #fed7aa;"><i class="fa-solid fa-triangle-exclamation"></i> Rechnung in Lexware storniert (Bereit zur Neuabrechnung)</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Ausgewählte Posten zur Neuabrechnung vorlegen
                          </button>
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="createInvoiceForTimesheet('${m.timesheetId}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Neue Rechnung in Lexware erstellen
                          </button>
                        `;
                      } else if (m.status === "Rejected") {
                        statusBadge = `<span class="badge badge-secondary" style="background: #fee2e2; color: #991b1b; border: 1px solid #f87171; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> VOM KUNDEN ABGELEHNT / KORREKTUR BEDARF</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Korrigierte Posten erneut vorlegen
                          </button>
                          <button class="btn btn-warning" style="padding: 4px 10px; font-size: 0.8rem;" onclick="cloneRevision('${m.timesheetId}')">
                            <i class="fa-solid fa-code-branch"></i> Revisionskopie erstellen
                          </button>
                        `;
                      } else {
                        statusBadge = `<span class="badge badge-secondary"><i class="fa-solid fa-pen"></i> Entwurf (Offen)</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}')">
                            <i class="fa-solid fa-stamp"></i> Ausgewählte Posten vorlegen (PDF sperren)
                          </button>
                        `;
                      }

                      // PDF & Freigabelink Action Buttons wenn Timesheet existiert
                      let pdfButtonsHtml = "";
                      if (hasTs) {
                        pdfButtonsHtml = `
                          <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600;">Nachweise:</span>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Reiner Stundenzettel für Kunden / Projektleiter (ohne Preise/Rechnungs-Nr.)" onclick="openTimesheetPdf('${m.timesheetId}', 'client_timesheet', 'all')">
                              <i class="fa-solid fa-file-lines"></i> Stundenzettel (Kunde)
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Kaufmännischer Nachweis zur Ausgangsrechnung (mit Beträgen & USt)" onclick="openTimesheetPdf('${m.timesheetId}', 'invoice_annex', 'all')">
                              <i class="fa-solid fa-file-invoice-dollar"></i> Rechnungsnachweis
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem;" title="Ausführlicher Auditbericht für Buchhaltung & Finanzamt (§ 18 EStG)" onclick="openTimesheetPdf('${m.timesheetId}', 'tax_audit', 'all')">
                              <i class="fa-solid fa-file-shield"></i> Audit / Finanzamt
                            </button>
                            ${m.signedDocumentR2Key ? `
                              <a href="${API_BASE}/public/timesheets/${m.timesheetId}/download-signed-document" target="_blank" class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #047857; border-color: #a7f3d0; background: #ecfdf5;" title="Vom Kunden hochgeladenen unterschriebenen Nachweis öffnen">
                                <i class="fa-solid fa-file-signature"></i> Unterschr. Dokument
                              </a>
                            ` : ''}
                            <span style="font-size: 0.75rem; color: var(--text-muted); font-weight: 600; margin-left: 4px;">Kunde:</span>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #2563eb; border-color: #93c5fd;" title="Sicheren Freigabelink für Kunden kopieren" onclick="copyApprovalLink('${m.timesheetId}')">
                              <i class="fa-solid fa-link"></i> Link kopieren
                            </button>
                            <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; color: #059669; border-color: #a7f3d0;" title="Freigabe-Einladung per E-Mail an Kunden senden" onclick="sendApprovalEmail('${m.timesheetId}')">
                              <i class="fa-solid fa-paper-plane"></i> E-Mail senden
                            </button>
                          </div>
                        `;
                      }

                      const showTime = currentBillingType === "all" || currentBillingType === "time";
                      const showTravel = currentBillingType === "all" || currentBillingType === "travel";
                      const monthKey = `${p.id}_${m.period}`.replace(/[^a-zA-Z0-9_-]/g, "_");

                      return `
                        <div style="background: #fff; border: 1px solid var(--border); border-radius: 8px; padding: 16px;">
                          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; margin-bottom: 12px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">
                            <div>
                              <strong style="font-size: 1.05rem; color: #0f172a;"><i class="fa-solid fa-calendar-days"></i> Abrechnungsmonat: ${m.period}</strong>
                              <span class="badge badge-secondary" style="font-size: 0.75rem; margin-left: 4px;">v${m.versionNumber || 1}.0</span>
                              <span style="margin-left: 8px;">${statusBadge}</span>
                            </div>
                            <div style="display: flex; gap: 8px; align-items: center; flex-wrap: wrap;">
                              ${pdfButtonsHtml}
                              ${actionsHtml}
                            </div>
                          </div>

                          ${m.rejectionReason ? `
                            <div style="background: #fff1f2; border: 2px solid #f87171; padding: 12px 16px; border-radius: 8px; color: #991b1b; margin-bottom: 14px; font-size: 0.88rem;">
                              <div style="font-weight: 700; font-size: 0.95rem; margin-bottom: 4px; display: flex; align-items: center; gap: 6px;">
                                <i class="fa-solid fa-circle-exclamation"></i> <strong>Korrekturanforderung / Beanstandung des Kunden:</strong>
                              </div>
                              <div style="background: #ffffff; padding: 10px 14px; border-radius: 6px; border: 1px solid #fca5a5; font-weight: 600; color: #1e293b; margin-top: 6px;">
                                "${m.rejectionReason}"
                              </div>
                              <div style="margin-top: 8px; font-size: 0.8rem; color: #7f1d1d;">
                                Tipp: Passen Sie die Zeiteinträge oder Belege an und klicken Sie anschließend auf <em>„Korrigierte Posten erneut vorlegen“</em>.
                              </div>
                            </div>
                          ` : ''}

                          <!-- KPIs pro Monat -->
                          <div style="display: flex; gap: 16px; flex-wrap: wrap; background: #f8fafc; padding: 10px 14px; border-radius: 6px; margin-bottom: 12px; font-size: 0.85rem;">
                            <span>Zeiterfassung: <strong>${m.totalHours.toFixed(2)} h abrechenbar</strong> (${m.timeAmountNet.toFixed(2)} € Netto)</span>
                            <span>Reisekosten: <strong>${m.travelAmountNet.toFixed(2)} €</strong> (${m.tripsCount} Fahrten)</span>
                            <span style="margin-left: auto; color: var(--primary); font-weight: 700; font-size: 0.95rem;">Gesamt: ${m.totalAmountNet.toFixed(2)} € Netto</span>
                          </div>

                          <!-- Tabellen Details -->
                          ${showTime && m.timeEntries.length > 0 ? `
                            <div style="margin-bottom: 12px;">
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-clock"></i> Zeiteinträge (${m.timeEntries.length}):</div>
                                ${isSelectable ? `
                                  <div style="font-size: 0.75rem;">
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-time-${monthKey}', true)">Alle auswählen</a> | 
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-time-${monthKey}', false)">Keine</a>
                                  </div>
                                ` : ''}
                              </div>
                              <div class="table-container" style="margin-top: 0;">
                                <table>
                                  <thead>
                                    <tr>
                                      ${isSelectable ? '<th style="width: 32px;"><input type="checkbox" checked onchange="toggleSelectAll(\'cb-time-' + monthKey + '\', this.checked)"></th>' : ''}
                                      <th>Datum</th>
                                      <th>Zeit & Dauer</th>
                                      <th>Ort / Kategorie</th>
                                      <th>Tätigkeit</th>
                                      <th>Betrag Netto</th>
                                      <th>Aktion / Nachweis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${m.timeEntries.map(e => {
                                      const bType = e.billing_type || (e.is_billable === 0 ? 'NonBillableVisible' : 'Billable');
                                      const isEntryBillable = bType === 'Billable';
                                      const isInternal = bType === 'InternalOnly';
                                      const entryNet = isEntryBillable ? ((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || p.default_hourly_rate)) : 0.0;

                                      let typeBadge = '';
                                      if (bType === 'InternalOnly') {
                                        typeBadge = '<br><span class="badge badge-secondary" style="background: #f1f5f9; color: #475569; border: 1px solid #cbd5e1; font-size: 0.7rem;"><i class="fa-solid fa-lock"></i> Nur Intern (Kunden-unsichtbar)</span>';
                                      } else if (bType === 'NonBillableVisible') {
                                        typeBadge = '<br><span class="badge badge-secondary" style="background: #fffbeb; color: #b45309; border: 1px solid #fde68a; font-size: 0.7rem;"><i class="fa-solid fa-eye"></i> Nicht abrechenbar (Kunden-sichtbar)</span>';
                                      }

                                      return `
                                      <tr>
                                        ${isSelectable ? `<td><input type="checkbox" class="cb-time-${monthKey}" value="${e.id}" ${isInternal ? '' : 'checked'}></td>` : ''}
                                        <td><strong>${e.entry_date}</strong></td>
                                        <td>
                                          ${e.start_time} - ${e.end_time}<br>
                                          <small style="color: var(--text-muted);">${(e.actual_duration_hours || e.billable_duration_hours || 0).toFixed(2)} h</small>
                                        </td>
                                        <td>
                                          <span class="badge badge-info">${e.location || 'Remote'}</span><br>
                                          <small style="color: var(--text-muted);">${e.category}</small>
                                        </td>
                                        <td>
                                          ${e.short_description}
                                          ${(e.deliverable || e.task_or_ticket_reference) ? `<br><span class="badge" style="background: #eef2ff; color: #4338ca; border: 1px solid #c7d2fe; font-size: 0.7rem; margin-top: 2px; display: inline-flex; align-items: center; gap: 3px;"><i class="fa-solid fa-file-shield"></i> ADR: ${e.deliverable || e.task_or_ticket_reference}</span>` : ''}
                                          ${typeBadge}
                                        </td>
                                        <td><strong>${entryNet.toFixed(2)} €</strong></td>
                                        <td>
                                          <div style="display: flex; gap: 4px; align-items: center; flex-wrap: wrap;">
                                            ${isEntryEditable ? `
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" title="Zeiteintrag bearbeiten / korrigieren" onclick="openEditTimeEntryModal('${e.id}')">
                                                <i class="fa-solid fa-pen-to-square"></i> Bearbeiten
                                              </button>
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; color: #be123c; border-color: #fecdd3;" title="Zeiteintrag löschen" onclick="deleteTimeEntryPrompt('${e.id}')">
                                                <i class="fa-solid fa-trash"></i>
                                              </button>
                                            ` : ''}
                                            ${hasTs && !isInternal ? `
                                              <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" onclick="openTimesheetPdf('${m.timesheetId}', 'time')">
                                                <i class="fa-solid fa-file-pdf"></i> PDF
                                              </button>
                                            ` : ''}
                                          </div>
                                        </td>
                                      </tr>
                                    `}).join("")}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ` : ''}

                          ${showTravel && m.trips.length > 0 ? `
                            <div>
                              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
                                <div style="font-weight: 600; font-size: 0.82rem; color: var(--text-muted);"><i class="fa-solid fa-train"></i> Reisekosten & Fahrten (${m.trips.length}):</div>
                                ${isSelectable ? `
                                  <div style="font-size: 0.75rem;">
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-trip-${monthKey}', true)">Alle auswählen</a> | 
                                    <a href="javascript:void(0)" onclick="toggleSelectAll('cb-trip-${monthKey}', false)">Keine</a>
                                  </div>
                                ` : ''}
                              </div>
                              <div class="table-container" style="margin-top: 0;">
                                <table>
                                  <thead>
                                    <tr>
                                      ${isSelectable ? '<th style="width: 32px;"><input type="checkbox" checked onchange="toggleSelectAll(\'cb-trip-' + monthKey + '\', this.checked)"></th>' : ''}
                                      <th>Datum</th>
                                      <th>Strecke / Reisezweck</th>
                                      <th>Typ</th>
                                      <th>Distanz / Beleg</th>
                                      <th>Erstattung Netto</th>
                                      <th>Nachweis</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    ${m.trips.map(tr => {
                                      const tripNet = tr.ticket_cost || (tr.distance_km * tr.rate_per_km) || 0;
                                      return `
                                      <tr>
                                        ${isSelectable ? `<td><input type="checkbox" class="cb-trip-${monthKey}" value="${tr.id}" checked></td>` : ''}
                                        <td><strong>${tr.trip_date}</strong></td>
                                        <td>${tr.origin} &rarr; ${tr.destination}<br><small style="color: var(--text-muted);">${tr.purpose || ''}</small></td>
                                        <td><span class="badge badge-secondary">${tr.expense_type === 'PersonalCar' ? 'PKW' : 'ÖPNV/Bahn'}</span></td>
                                        <td>${tr.expense_type === 'PersonalCar' ? `${tr.distance_km} km` : 'Ticket'}</td>
                                        <td><strong>${tripNet.toFixed(2)} €</strong></td>
                                        <td>
                                          ${hasTs ? `
                                            <button class="btn btn-outline" style="padding: 2px 6px; font-size: 0.72rem; white-space: nowrap;" onclick="openTimesheetPdf('${m.timesheetId}', 'travel')">
                                              <i class="fa-solid fa-file-pdf"></i> PDF
                                            </button>
                                          ` : ''}
                                        </td>
                                      </tr>
                                    `}).join("")}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          ` : ''}
                        </div>
                      `;
                    }).join("")}
                  </div>
                </div>
              `).join("")}
            </div>
          </div>
        `;
      }

      container.innerHTML = html;
    }

    function toggleSelectAll(className, isChecked) {
      document.querySelectorAll("." + className).forEach(cb => { cb.checked = isChecked; });
    }

    async function submitSelectedForSignature(projectId, period) {
      const monthKey = `${projectId}_${period}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const timeCheckboxes = document.querySelectorAll(`.cb-time-${monthKey}:checked`);
      const tripCheckboxes = document.querySelectorAll(`.cb-trip-${monthKey}:checked`);

      const selectedTimeEntryIds = Array.from(timeCheckboxes).map(cb => cb.value);
      const selectedTripIds = Array.from(tripCheckboxes).map(cb => cb.value);

      if (selectedTimeEntryIds.length === 0 && selectedTripIds.length === 0) {
        alert("Bitte wählen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position zur Vorlage aus.");
        return;
      }

      if (!confirm(`Möchten Sie die ${selectedTimeEntryIds.length} ausgewählten Zeiteinträge und ${selectedTripIds.length} Reisekosten für ${period} zur Unterzeichnung vorlegen? Diese Posten werden GoBD-konform schreibgeschützt.`)) return;

      try {
        const res = await fetch(`${API_BASE}/billing/submit-for-signature`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            projectId,
            period,
            selectedTimeEntryIds,
            selectedTripIds
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          alert(data.message || "Leistungsnachweis liegt zur Unterzeichnung vor!");
          await loadBillingHierarchy();
        } else {
          alert("Fehler: " + (data.error || "Aktion fehlgeschlagen"));
        }
      } catch (err) {
        alert("Fehler: " + err.message);
      }
    }

    // ==========================================
