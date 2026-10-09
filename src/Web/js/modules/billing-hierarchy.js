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
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; flex-wrap: wrap; gap: 10px;">
              <div>
                <h2 style="font-size: 1.2rem; color: var(--primary); margin-bottom: 2px;">
                  <i class="fa-solid fa-building"></i> ${cust.name}
                </h2>
                <small style="color: var(--text-muted);">${cust.contact_person ? cust.contact_person + ' | ' : ''}${cust.email || ''} | Lexware-ID: ${cust.lexware_contact_id}</small>
              </div>
              <div style="display: flex; gap: 8px; align-items: center;">
                <button class="btn btn-outline" style="padding: 5px 12px; font-size: 0.82rem; background: #fff; border-color: #4f46e5; color: #4f46e5; font-weight: 600;" onclick="openSubmitForSignatureModal(null, null, '${cust.id}')">
                  <i class="fa-solid fa-file-signature"></i> Stundenzettel Kunde gesamt vorlegen
                </button>
              </div>
            </div>

            <!-- Projekte des Kunden -->
            <div style="display: grid; gap: 16px;">
              ${renderedProjects.map(p => `
                <div style="background: #f8fafc; border: 1px solid var(--border); border-radius: 10px; padding: 16px;">
                  <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 8px;">
                    <div>
                      <h3 style="font-size: 1.05rem; color: #1e293b; margin-bottom: 2px;">
                        <i class="fa-solid fa-folder-open" style="color: var(--primary);"></i> ${p.name}
                      </h3>
                      <small style="color: var(--text-muted);">${p.project_number} • Stundensatz: ${p.default_hourly_rate.toFixed(2)} €/h Netto</small>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center; flex-wrap: wrap;">
                      <button class="btn btn-outline" style="padding: 3px 8px; font-size: 0.75rem; background: #fff; border-color: #4f46e5; color: #4f46e5; font-weight: 600;" onclick="openSubmitForSignatureModal('${p.id}', null, '${cust.id}')">
                        <i class="fa-solid fa-file-signature"></i> Projekt-Stundenzettel vorlegen
                      </button>
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
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}', '${cust.id}')">
                            <i class="fa-solid fa-stamp"></i> Ausgewählte Posten zur Neuabrechnung vorlegen
                          </button>
                          <button class="btn btn-outline" style="padding: 4px 10px; font-size: 0.8rem;" onclick="createInvoiceForTimesheet('${m.timesheetId}')">
                            <i class="fa-solid fa-file-invoice-dollar"></i> Neue Rechnung in Lexware erstellen
                          </button>
                        `;
                      } else if (m.status === "Rejected") {
                        statusBadge = `<span class="badge badge-secondary" style="background: #fee2e2; color: #991b1b; border: 1px solid #f87171; font-weight: 700; font-size: 0.85rem;"><i class="fa-solid fa-triangle-exclamation"></i> VOM KUNDEN ABGELEHNT / KORREKTUR BEDARF</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}', '${cust.id}')">
                            <i class="fa-solid fa-stamp"></i> Korrigierte Posten erneut vorlegen
                          </button>
                          <button class="btn btn-warning" style="padding: 4px 10px; font-size: 0.8rem;" onclick="cloneRevision('${m.timesheetId}')">
                            <i class="fa-solid fa-code-branch"></i> Revisionskopie erstellen
                          </button>
                        `;
                      } else {
                        statusBadge = `<span class="badge badge-secondary"><i class="fa-solid fa-pen"></i> Entwurf (Offen)</span>`;
                        actionsHtml = `
                          <button class="btn btn-primary" style="padding: 4px 12px; font-size: 0.8rem;" onclick="submitSelectedForSignature('${p.id}', '${m.period}', '${cust.id}')">
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

    // ==============================================================
    // STUNDENZETTEL / LEISTUNGSNACHWEIS VORLAGE MODAL (EBENE 1, 2, 3)
    // ==============================================================
    let _submitModalSelectedTimeIds = [];
    let _submitModalSelectedTripIds = [];

    async function submitSelectedForSignature(projectId, period, customerId = '') {
      const monthKey = `${projectId}_${period}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      const timeCheckboxes = document.querySelectorAll(`.cb-time-${monthKey}:checked`);
      const tripCheckboxes = document.querySelectorAll(`.cb-trip-${monthKey}:checked`);

      _submitModalSelectedTimeIds = Array.from(timeCheckboxes).map(cb => cb.value);
      _submitModalSelectedTripIds = Array.from(tripCheckboxes).map(cb => cb.value);

      // Öffnet das interaktive Options-Modal statt eines primitiven Browser-confirm()
      await openSubmitForSignatureModal(projectId, period, customerId);
    }

    async function openSubmitForSignatureModal(arg1 = null, arg2 = null, arg3 = null) {
      if (!globalBillingHierarchy || globalBillingHierarchy.length === 0) {
        await loadBillingHierarchy();
      }

      let projectId = '';
      let customerId = '';
      let period = '';

      // Flexible Argumente-Erkennung:
      // Unterstützt:
      // (projectId, customerId, period)
      // (projectId, period, customerId)
      // (null, null, customerId) - Ebene 1
      // (projectId, null, customerId) - Ebene 2
      // (projectId, period, customerId) - Ebene 3
      if (typeof arg2 === 'string' && /^\d{4}-\d{2}$/.test(arg2)) {
        period = arg2;
        projectId = arg1 || '';
        customerId = arg3 || '';
      } else if (typeof arg3 === 'string' && /^\d{4}-\d{2}$/.test(arg3)) {
        period = arg3;
        projectId = arg1 || '';
        customerId = arg2 || '';
      } else {
        if (!arg1 && !arg2 && arg3) {
          customerId = arg3;
        } else if (arg1 && !arg2 && arg3) {
          projectId = arg1;
          customerId = arg3;
        } else {
          projectId = arg1 || '';
          customerId = arg2 || '';
          period = arg3 || '';
        }
      }

      // Dropdown Kunden befüllen
      const custSelect = document.getElementById("submit-customer-select");
      if (custSelect) {
        custSelect.innerHTML = (globalBillingHierarchy || []).map(c => `<option value="${c.id}">${escapeHtml(c.name)}</option>`).join('');
      }

      // Dropdown Monate befüllen
      const periodSelect = document.getElementById("submit-period-month-select");
      if (periodSelect) {
        const uniqueMonths = new Set();
        for (const c of (globalBillingHierarchy || [])) {
          for (const p of (c.projects || [])) {
            for (const m of (p.months || [])) {
              if (m.period) uniqueMonths.add(m.period);
            }
          }
        }
        const sortedMonths = Array.from(uniqueMonths).sort().reverse();
        if (sortedMonths.length === 0) {
          const nowStr = new Date().toISOString().substring(0, 7);
          sortedMonths.push(nowStr);
        }
        periodSelect.innerHTML = sortedMonths.map(m => `<option value="${m}">${m} (${formatMonthName(m)})</option>`).join('');
        if (period && sortedMonths.includes(period)) {
          periodSelect.value = period;
        } else if (currentBillingMonthFilter && sortedMonths.includes(currentBillingMonthFilter)) {
          periodSelect.value = currentBillingMonthFilter;
        }
      }

      // Ziel-Kunde & Scope ermitteln
      let targetCustId = customerId;
      if (!targetCustId && projectId) {
        for (const c of (globalBillingHierarchy || [])) {
          if ((c.projects || []).some(p => p.id === projectId)) {
            targetCustId = c.id;
            break;
          }
        }
      }
      if (!targetCustId && globalBillingHierarchy && globalBillingHierarchy.length > 0) {
        targetCustId = globalBillingHierarchy[0].id;
      }
      if (custSelect && targetCustId) {
        custSelect.value = targetCustId;
      }

      // Scope Radio setzen
      if (projectId) {
        const rProj = document.getElementById("submit-scope-project");
        if (rProj) rProj.checked = true;
      } else if (customerId) {
        const rCustAll = document.getElementById("submit-scope-cust-all");
        if (rCustAll) rCustAll.checked = true;
      } else {
        const rProj = document.getElementById("submit-scope-project");
        if (rProj) rProj.checked = true;
      }

      // Standard-Optionen: Reiner Stundenzettel ohne Euro aktiv
      const hideRatesCb = document.getElementById("submit-opt-hide-rates");
      if (hideRatesCb) hideRatesCb.checked = true;

      const travelCb = document.getElementById("submit-opt-include-travel");
      if (travelCb) travelCb.checked = (_submitModalSelectedTripIds && _submitModalSelectedTripIds.length > 0);

      const rCust = document.getElementById("submit-recipient-customer");
      if (rCust) rCust.checked = true;

      onSubmitModalScopeChanged(projectId);
      if (typeof openModal === "function") {
        openModal('submit-for-signature-modal');
      } else {
        const modalEl = document.getElementById("submit-for-signature-modal");
        if (modalEl) modalEl.classList.add("active");
      }
    }

    function onSubmitModalCustomerChanged() {
      onSubmitModalScopeChanged();
    }

    function onSubmitModalSingleProjectChanged() {
      onUpdateApproverDefault();
      updateSubmitModalPreview();
    }

    function onSubmitModalScopeChanged(preferredProjectId = '') {
      const scope = document.querySelector('input[name="submit-scope"]:checked')?.value || 'project';
      const custId = document.getElementById("submit-customer-select")?.value;
      const singleProjGroup = document.getElementById("submit-single-project-group");
      const projSelect = document.getElementById("submit-project-select");
      const multiProjContainer = document.getElementById("submit-projects-container");
      const multiProjCheckboxes = document.getElementById("submit-project-checkboxes");

      const cust = (globalBillingHierarchy || []).find(c => c.id === custId);
      const projects = cust ? (cust.projects || []) : [];

      if (scope === "project") {
        if (singleProjGroup) singleProjGroup.style.display = "block";
        if (multiProjContainer) multiProjContainer.style.display = "none";
        if (projSelect) {
          projSelect.innerHTML = projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)} (${p.project_number})</option>`).join('');
          if (preferredProjectId && projects.some(p => p.id === preferredProjectId)) {
            projSelect.value = preferredProjectId;
          }
        }
      } else if (scope === "customer_all") {
        if (singleProjGroup) singleProjGroup.style.display = "none";
        if (multiProjContainer) multiProjContainer.style.display = "none";
      } else if (scope === "customer_selected") {
        if (singleProjGroup) singleProjGroup.style.display = "none";
        if (multiProjContainer) multiProjContainer.style.display = "block";
        if (multiProjCheckboxes) {
          multiProjCheckboxes.innerHTML = projects.map(p => `
            <label class="form-check" style="cursor: pointer; padding: 4px 6px; background: #f8fafc; border-radius: 4px; border: 1px solid #e2e8f0;">
              <input type="checkbox" class="cb-submit-prj" value="${p.id}" ${(!preferredProjectId || p.id === preferredProjectId) ? 'checked' : ''} onchange="updateSubmitModalPreview()">
              <span><strong>${escapeHtml(p.name)}</strong> <small style="color: var(--text-muted);">${p.project_number} • ${Number(p.default_hourly_rate || 0).toFixed(2)} €/h</small></span>
            </label>
          `).join('');
        }
      }

      onUpdateApproverDefault();
      updateSubmitModalPreview();
    }

    function toggleAllSubmitProjects() {
      const cbs = document.querySelectorAll(".cb-submit-prj");
      const allChecked = Array.from(cbs).every(cb => cb.checked);
      cbs.forEach(cb => { cb.checked = !allChecked; });
      updateSubmitModalPreview();
    }

    function onUpdateApproverDefault() {
      const recipientType = document.querySelector('input[name="submit-recipient-type"]:checked')?.value || 'customer';
      const custId = document.getElementById("submit-customer-select")?.value;
      const cust = (globalBillingHierarchy || []).find(c => c.id === custId);

      const scope = document.querySelector('input[name="submit-scope"]:checked')?.value || 'project';
      let proj = null;
      if (scope === "project") {
        const pId = document.getElementById("submit-project-select")?.value;
        proj = cust?.projects?.find(p => p.id === pId);
      } else if (cust?.projects?.length > 0) {
        proj = cust.projects[0];
      }

      const nameInput = document.getElementById("submit-approver-name");
      const emailInput = document.getElementById("submit-approver-email");
      const roleInput = document.getElementById("submit-approver-role");

      if (recipientType === "customer") {
        const isRed = (cust?.name || '').toLowerCase().includes("red");
        if (nameInput) nameInput.value = cust?.contact_person || (isRed ? "Kais Kauomee" : (cust?.name || ""));
        if (emailInput) emailInput.value = cust?.email || (isRed ? "kkauomee@redglobal.com" : "");
        if (roleInput) roleInput.value = isRed ? "Auftraggeber (RED Global GmbH)" : (cust?.name || "Auftraggeber");
      } else if (recipientType === "end_customer") {
        const endCustName = proj?.end_customer_name || "CompuGroup Medical (CGM)";
        if (nameInput) nameInput.value = proj?.approver_2_name || `Projektleitung ${endCustName}`;
        if (emailInput) emailInput.value = proj?.approver_2_email || "";
        if (roleInput) roleInput.value = `Endkunde (${endCustName})`;
      } else {
        if (nameInput && !nameInput.value) nameInput.value = "";
        if (emailInput && !emailInput.value) emailInput.value = "";
        if (roleInput && !roleInput.value) roleInput.value = "Externer Prüfer / Genehmiger";
      }
    }

    function onSubmitRecipientTypeChanged() {
      onUpdateApproverDefault();
      updateSubmitModalPreview();
    }

    function getSubmitModalTargetData() {
      const scope = document.querySelector('input[name="submit-scope"]:checked')?.value || 'project';
      const custId = document.getElementById("submit-customer-select")?.value;
      const period = document.getElementById("submit-period-month-select")?.value || "";
      const includeTravel = document.getElementById("submit-opt-include-travel")?.checked;
      const cust = (globalBillingHierarchy || []).find(c => c.id === custId);

      let targetProjects = [];
      if (scope === "project") {
        const pId = document.getElementById("submit-project-select")?.value;
        const p = cust?.projects?.find(pr => pr.id === pId);
        if (p) targetProjects.push(p);
      } else if (scope === "customer_all") {
        targetProjects = cust?.projects ? [...cust.projects] : [];
      } else if (scope === "customer_selected") {
        const checkedPIds = Array.from(document.querySelectorAll(".cb-submit-prj:checked")).map(cb => cb.value);
        targetProjects = (cust?.projects || []).filter(pr => checkedPIds.includes(pr.id));
      }

      const matchedEntries = [];
      const matchedTrips = [];
      const seenEntryIds = new Set();
      const seenTripIds = new Set();

      for (const p of targetProjects) {
        for (const m of (p.months || [])) {
          if (period && m.period !== period) continue;

          for (const e of (m.timeEntries || [])) {
            if (seenEntryIds.has(e.id)) continue;
            if (_submitModalSelectedTimeIds.length > 0 && !_submitModalSelectedTimeIds.includes(e.id)) continue;
            if (e.billing_type === "InternalOnly") continue;

            seenEntryIds.add(e.id);
            matchedEntries.push({
              ...e,
              customer_name: cust?.name || '',
              project_id: p.id,
              project_name: p.name,
              project_number: p.project_number,
              hierarchy_level: p.hierarchy_level || 1,
              end_customer_name: p.end_customer_name || cust?.contact_person || '',
              hourly_rate: e.billing_rate_snapshot || p.default_hourly_rate,
              default_hourly_rate: p.default_hourly_rate
            });
          }

          if (includeTravel) {
            for (const tr of (m.trips || [])) {
              if (seenTripIds.has(tr.id)) continue;
              if (_submitModalSelectedTripIds.length > 0 && !_submitModalSelectedTripIds.includes(tr.id)) continue;

              seenTripIds.add(tr.id);
              matchedTrips.push({
                ...tr,
                customer_name: cust?.name || '',
                project_id: p.id,
                project_name: p.name,
                project_number: p.project_number,
                hierarchy_level: p.hierarchy_level || 1,
                end_customer_name: p.end_customer_name || ''
              });
            }
          }
        }
      }

      // Chronologisch sortieren
      matchedEntries.sort((a, b) => (a.entry_date + (a.start_time || '')).localeCompare(b.entry_date + (b.start_time || '')));
      matchedTrips.sort((a, b) => (a.trip_date || '').localeCompare(b.trip_date || ''));

      const totalHours = matchedEntries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
      const totalAmountNet = matchedEntries.reduce((s, e) => s + ((e.billable_duration_hours || 0) * (e.hourly_rate || 0)), 0);
      const travelNet = matchedTrips.reduce((s, tr) => s + (tr.ticket_cost || (tr.distance_km * (tr.rate_per_km || 0.30)) || 0), 0);

      return {
        customer: cust,
        projects: targetProjects,
        entries: matchedEntries,
        trips: matchedTrips,
        period,
        totalHours,
        totalAmountNet: totalAmountNet + travelNet
      };
    }

    function buildProjectGroupsFromEntries(entries, customer) {
      const projectGroups = new Map();
      for (const ent of (entries || [])) {
        const pId = ent.project_id || 'unknown';
        if (!projectGroups.has(pId)) {
          projectGroups.set(pId, {
            project_id: pId,
            project_name: ent.project_name || 'Projekt',
            project_number: ent.project_number || '',
            hierarchy_level: ent.hierarchy_level || 1,
            customer_name: ent.customer_name || customer?.name || '',
            end_customer_name: ent.end_customer_name || '',
            default_hourly_rate: ent.default_hourly_rate || ent.hourly_rate || 0,
            entries: []
          });
        }
        projectGroups.get(pId).entries.push(ent);
      }
      return Array.from(projectGroups.values());
    }

    function updateSubmitModalPreview() {
      const data = getSubmitModalTargetData();
      const hideRates = document.getElementById("submit-opt-hide-rates")?.checked;
      const groupByProject = document.getElementById("submit-opt-group-by-project")?.checked !== false;
      const approverName = document.getElementById("submit-approver-name")?.value.trim() || 'Kunde';
      const approverEmail = document.getElementById("submit-approver-email")?.value.trim() || '';
      const approverRole = document.getElementById("submit-approver-role")?.value.trim() || 'Auftraggeber';

      const countsEl = document.getElementById("submit-preview-counts");
      if (countsEl) {
        countsEl.innerHTML = `${data.entries.length} Zeiteinträge &bull; <strong>${data.totalHours.toFixed(2)} Std.</strong>${data.trips.length > 0 ? ` &bull; ${data.trips.length} Reisekosten` : ''}`;
      }

      const container = document.getElementById("submit-modal-preview-container");
      if (!container) return;

      if (data.entries.length === 0 && data.trips.length === 0) {
        container.innerHTML = `
          <div style="text-align: center; color: #94a3b8; padding: 24px;">
            <i class="fa-solid fa-folder-open" style="font-size: 2rem; margin-bottom: 8px; color: #cbd5e1;"></i><br>
            Keine noch offenen Posten im gewählten Umfang für <strong>${data.period || 'diesen Zeitraum'}</strong> gefunden.
          </div>
        `;
        return;
      }

      const lvlNames = { 1: "Stufe 1: Gesamtprojekt", 2: "Stufe 2: Stream / AP", 3: "Stufe 3: Teilprojekt" };
      const groups = buildProjectGroupsFromEntries(data.entries, data.customer);

      let groupsHtml = "";
      if (groupByProject && groups.length > 0) {
        groupsHtml = groups.map(grp => {
          const projHours = grp.entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
          const projNet = grp.entries.reduce((s, e) => s + ((e.billable_duration_hours || 0) * (e.hourly_rate || 0)), 0);
          const lvlBadge = lvlNames[grp.hierarchy_level] || "Stufe 2: Stream / AP";

          return `
            <div style="margin-bottom: 14px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff;">
              <div style="background: #f8fafc; border-bottom: 1px solid #cbd5e1; padding: 7px 10px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div>
                  <span style="font-size: 9.5px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${lvlBadge}</span>
                  <strong style="font-size: 11.5px; color: #0f172a;">${escapeHtml(grp.project_name)}</strong>
                  <span style="color: #64748b; font-size: 10px;">(${escapeHtml(grp.project_number)})</span>
                </div>
                <div style="font-size: 10px; color: #334155;">
                  Auftraggeber: <strong>${escapeHtml(grp.customer_name)}</strong>
                  ${grp.end_customer_name ? ` &bull; <strong style="color: #0369a1;">Endkunde: ${escapeHtml(grp.end_customer_name)}</strong>` : ''}
                  ${!hideRates ? ` &bull; Satz: <strong>${Number(grp.default_hourly_rate).toFixed(2)} €/h</strong>` : ''}
                </div>
              </div>

              <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
                <thead>
                  <tr style="background: #f1f5f9; border-bottom: 1px solid #e2e8f0; text-align: left;">
                    <th style="padding: 5px 8px; width: 75px;">Datum</th>
                    <th style="padding: 5px 8px; width: 85px;">Von &ndash; Bis</th>
                    <th style="padding: 5px 8px; width: 45px; text-align: center;">Pause</th>
                    <th style="padding: 5px 8px; width: 55px; text-align: right;">Stunden</th>
                    ${!hideRates ? `<th style="padding: 5px 8px; width: 60px; text-align: right;">Satz</th>` : ''}
                    <th style="padding: 5px 8px; width: 85px;">Ort / Art</th>
                    <th style="padding: 5px 8px;">Kurzbeschreibung &amp; Tätigkeiten</th>
                    ${!hideRates ? `<th style="padding: 5px 8px; width: 75px; text-align: right;">Netto</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${grp.entries.map(e => `
                    <tr style="border-bottom: 1px solid #f1f5f9;">
                      <td style="padding: 4px 8px;"><strong>${e.entry_date}</strong></td>
                      <td style="padding: 4px 8px; color: #475569;">${e.start_time || '-'} &ndash; ${e.end_time || '-'}</td>
                      <td style="padding: 4px 8px; text-align: center; color: #64748b;">${e.break_minutes || 0}m</td>
                      <td style="padding: 4px 8px; text-align: right; font-weight: 700;">${(e.billable_duration_hours || 0).toFixed(2)} h</td>
                      ${!hideRates ? `<td style="padding: 4px 8px; text-align: right;">${(e.hourly_rate || 0).toFixed(2)} €</td>` : ''}
                      <td style="padding: 4px 8px;">
                        <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 4px; border-radius: 3px; font-weight: 600; font-size: 8.5px;">${escapeHtml(e.location || 'Remote')}</span>
                      </td>
                      <td style="padding: 4px 8px;">
                        <div>${escapeHtml(e.short_description || '-')}</div>
                        ${e.deliverable ? `<small style="color: #4338ca; font-weight: 600;">[ADR: ${escapeHtml(e.deliverable)}]</small>` : ''}
                      </td>
                      ${!hideRates ? `<td style="padding: 4px 8px; text-align: right; font-weight: 600;">${((e.billable_duration_hours || 0) * (e.hourly_rate || 0)).toFixed(2)} €</td>` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <div style="background: #f1f5f9; border-top: 1px solid #cbd5e1; padding: 5px 10px; display: flex; justify-content: space-between; align-items: center; font-size: 10px; font-weight: 700; color: #1e293b;">
                <span>Zwischensumme ${escapeHtml(grp.project_name)}:</span>
                <span>
                  Geleistet: <strong>${projHours.toFixed(2)} h</strong> (Abrechenbar: ${projHours.toFixed(2)} h)
                  ${!hideRates ? ` &bull; Netto: <strong style="color: #2563eb;">${projNet.toFixed(2)} €</strong>` : ''}
                </span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        groupsHtml = `
          <table style="width: 100%; border-collapse: collapse; font-size: 0.8rem; margin-bottom: 12px;">
            <thead>
              <tr style="background: #f1f5f9; border-bottom: 2px solid #cbd5e1; text-align: left;">
                <th style="padding: 6px 8px; width: 85px;">Datum</th>
                <th style="padding: 6px 8px; width: 140px;">Projekt / Stream</th>
                <th style="padding: 6px 8px; width: 60px; text-align: right;">Dauer</th>
                <th style="padding: 6px 8px;">Tätigkeit / Tätigkeitsnachweis</th>
                <th style="padding: 6px 8px; width: 90px;">Ort</th>
                ${!hideRates ? `<th style="padding: 6px 8px; width: 70px; text-align: right;">Satz</th><th style="padding: 6px 8px; width: 80px; text-align: right;">Netto</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${data.entries.map(e => `
                <tr style="border-bottom: 1px solid #e2e8f0;">
                  <td style="padding: 5px 8px;"><strong>${e.entry_date}</strong></td>
                  <td style="padding: 5px 8px; color: #334155;">${escapeHtml(e.project_name)}</td>
                  <td style="padding: 5px 8px; text-align: right; font-weight: 700;">${(e.billable_duration_hours || 0).toFixed(2)} h</td>
                  <td style="padding: 5px 8px;">
                    <div>${escapeHtml(e.short_description || '-')}</div>
                    ${e.deliverable ? `<small style="color: #4338ca; font-weight: 600;"><i class="fa-solid fa-file-shield"></i> ADR / Deliverable: ${escapeHtml(e.deliverable)}</small>` : ''}
                  </td>
                  <td style="padding: 5px 8px; color: #64748b;">${escapeHtml(e.location || 'Remote')}</td>
                  ${!hideRates ? `
                    <td style="padding: 5px 8px; text-align: right;">${(e.hourly_rate || 0).toFixed(2)} €</td>
                    <td style="padding: 5px 8px; text-align: right; font-weight: 600;">${((e.billable_duration_hours || 0) * (e.hourly_rate || 0)).toFixed(2)} €</td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      let previewHtml = `
        <div style="font-size: 0.82rem; margin-bottom: 10px; color: #475569; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
          <span><strong>Empfänger der Abrechnungsgenehmigung:</strong> <span style="color: #4338ca; font-weight: 700;">${escapeHtml(approverName)}</span> ${approverEmail ? `&lt;${escapeHtml(approverEmail)}&gt;` : ''} (${escapeHtml(approverRole)})</span>
          ${hideRates ? `<span class="badge badge-secondary" style="background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe;"><i class="fa-solid fa-eye-slash"></i> Ohne Stundensätze &amp; Euro</span>` : `<span class="badge badge-info"><i class="fa-solid fa-euro-sign"></i> Mit Beträgen</span>`}
        </div>

        ${groupsHtml}

        <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; font-size: 0.88rem; font-weight: 700;">
          <span style="color: #0f172a;">Gesamter Leistungsaufwand (${data.entries.length} Buchungen):</span>
          <span style="color: #4338ca; font-size: 1rem;">${data.totalHours.toFixed(2)} Stunden ${!hideRates ? ` &bull; ${data.totalAmountNet.toFixed(2)} €` : ''}</span>
        </div>

        <!-- UNTERSCHRIFTENBLOCK VORSCHAU -->
        <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-radius: 6px; padding: 10px 14px;">
          <div style="font-size: 0.75rem; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 8px;">
            Vorschau Unterschriften- &amp; Abnahmeblock
          </div>
          <div style="display: flex; justify-content: space-between; gap: 20px; font-size: 0.8rem; flex-wrap: wrap;">
            <div style="flex: 1; min-width: 240px; border-right: 1px dashed #cbd5e1; padding-right: 14px;">
              <strong style="color: #1e293b;">Auftragnehmer:</strong> Michael Kirst-Neshva (Senior Cloud &amp; Security Architect)<br>
              <small style="color: #64748b;">Status: Vorlage zur Prüfung &amp; Genehmigung</small>
            </div>
            <div style="flex: 1; min-width: 240px; padding-left: 6px;">
              <strong style="color: #1e293b;">Auftraggeber / Genehmiger:</strong> ${escapeHtml(approverName)}<br>
              <small style="color: #64748b;">E-Mail: ${escapeHtml(approverEmail || 'Wird per Freigabelink übermittelt')} &bull; Status: <span style="color: #d97706; font-weight: 600;">Ausstehend</span></small>
            </div>
          </div>
        </div>
      `;

      container.innerHTML = previewHtml;
    }

    async function openSubmitModalPdfPreview() {
      const data = getSubmitModalTargetData();
      if (data.entries.length === 0 && data.trips.length === 0) {
        alert("Keine Zeiteinträge im gewählten Umfang für die Druckansicht vorhanden.");
        return;
      }

      const hideRates = document.getElementById("submit-opt-hide-rates")?.checked;
      const groupByProject = document.getElementById("submit-opt-group-by-project")?.checked !== false;
      const approverName = document.getElementById("submit-approver-name")?.value.trim() || 'Kunde';
      const approverEmail = document.getElementById("submit-approver-email")?.value.trim() || '';
      const approverRole = document.getElementById("submit-approver-role")?.value.trim() || 'Auftraggeber';

      const printWindow = window.open("", "_blank");
      if (!printWindow) {
        alert("Bitte erlauben Sie Popups für diese Seite, um die Druckansicht zu öffnen.");
        return;
      }

      const contractorFullName = (typeof globalSettings !== "undefined" && globalSettings?.email_sender_name ? globalSettings.email_sender_name.split("|")[0].trim() : "Michael Kirst-Neshva");
      const contractorTitle = (typeof globalSettings !== "undefined" && globalSettings?.contractor_title ? globalSettings.contractor_title : "Senior Cloud & Security Architect");
      const contractorCity = (typeof globalSettings !== "undefined" && globalSettings?.company_city ? globalSettings.company_city : (typeof localStorage !== "undefined" ? localStorage.getItem("cfg_company_city") : null) || "Neumünster");
      const useSig = Boolean(typeof globalSettings !== "undefined" && globalSettings?.use_signature_on_documents !== 0 && (typeof localStorage === "undefined" || localStorage.getItem("cfg_use_signature_documents") !== "0"));
      const sigDataUrl = useSig ? (globalSettings?.contractor_signature_data_url || (typeof localStorage !== "undefined" ? localStorage.getItem("cfg_contractor_signature_data_url") : null) || (typeof DEFAULT_CONTRACTOR_SIGNATURE !== "undefined" ? DEFAULT_CONTRACTOR_SIGNATURE : "")) : "";

      const lvlNames = { 1: "Stufe 1: Gesamtprojekt", 2: "Stufe 2: Stream / AP", 3: "Stufe 3: Teilprojekt" };
      const groups = buildProjectGroupsFromEntries(data.entries, data.customer);

      let groupsPrintHtml = "";
      if (groupByProject && groups.length > 0) {
        groupsPrintHtml = groups.map(grp => {
          const projHours = grp.entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
          const projNet = grp.entries.reduce((s, e) => s + ((e.billable_duration_hours || 0) * (e.hourly_rate || 0)), 0);
          const lvlBadge = lvlNames[grp.hierarchy_level] || "Stufe 2: Stream / AP";

          return `
            <div style="margin-bottom: 16px; border: 1px solid #cbd5e1; border-radius: 6px; overflow: hidden; background: #ffffff; page-break-inside: avoid; break-inside: avoid;">
              <!-- Projekt-Kopfzeile -->
              <div style="background: #f8fafc; border-bottom: 1.5px solid #cbd5e1; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 6px;">
                <div>
                  <span style="font-size: 9.5px; font-weight: 700; color: #475569; background: #e2e8f0; padding: 2px 6px; border-radius: 4px; margin-right: 6px;">${lvlBadge}</span>
                  <strong style="font-size: 12px; color: #0f172a;">${escapeHtml(grp.project_name)}</strong>
                  <span style="color: #64748b; font-size: 10.5px;">(${escapeHtml(grp.project_number)})</span>
                </div>
                <div style="font-size: 10px; color: #334155;">
                  Auftraggeber: <strong>${escapeHtml(grp.customer_name)}</strong>
                  ${grp.end_customer_name ? ` &bull; <strong style="color: #0369a1;">Endkunde: ${escapeHtml(grp.end_customer_name)}</strong>` : ''}
                  ${!hideRates ? ` &bull; Satz: <strong>${Number(grp.default_hourly_rate).toFixed(2)} €/h</strong>` : ''}
                </div>
              </div>

              <!-- Zeiteinträge Tabelle für dieses Projekt -->
              <table style="margin-top: 0; border: none; width: 100%; border-collapse: collapse; font-size: 10.5px;">
                <thead>
                  <tr style="background: #f8fafc; border-bottom: 1px solid #cbd5e1;">
                    <th style="width: 70px; border-top: none;">Datum</th>
                    <th style="width: 85px; border-top: none;">Von &ndash; Bis</th>
                    <th style="width: 45px; text-align: center; border-top: none;">Pause</th>
                    <th style="width: 55px; text-align: right; border-top: none;">Stunden</th>
                    ${!hideRates ? `<th style="width: 60px; text-align: right; border-top: none;">Satz</th>` : ''}
                    <th style="width: 90px; border-top: none;">Ort / Art</th>
                    <th style="border-top: none;">Kurzbeschreibung &amp; Tätigkeiten</th>
                    ${!hideRates ? `<th style="width: 75px; text-align: right; border-top: none;">Netto (€)</th>` : ''}
                  </tr>
                </thead>
                <tbody>
                  ${grp.entries.map(e => `
                    <tr style="border-bottom: 1px solid #e2e8f0;">
                      <td style="padding: 5px 8px;"><strong>${e.entry_date}</strong></td>
                      <td style="padding: 5px 8px; color: #334155;">${e.start_time || '-'} &ndash; ${e.end_time || '-'}</td>
                      <td style="padding: 5px 8px; text-align: center; color: #64748b;">${e.break_minutes || 0}m</td>
                      <td style="padding: 5px 8px; text-align: right; font-weight: 700;">${(e.billable_duration_hours || 0).toFixed(2)} h</td>
                      ${!hideRates ? `<td style="padding: 5px 8px; text-align: right;">${(e.hourly_rate || 0).toFixed(2)} €</td>` : ''}
                      <td style="padding: 5px 8px;">
                        <span style="display: inline-block; background: #e0f2fe; color: #0369a1; padding: 1px 4px; border-radius: 3px; font-weight: 600; font-size: 9px;">${escapeHtml(e.location || 'Remote')}</span>
                      </td>
                      <td style="padding: 5px 8px;">
                        <div>${escapeHtml(e.short_description || '-')}</div>
                        ${e.deliverable ? `<small style="color: #4338ca; font-weight: 600;">[ADR: ${escapeHtml(e.deliverable)}]</small>` : ''}
                      </td>
                      ${!hideRates ? `<td style="padding: 5px 8px; text-align: right; font-weight: 600;">${((e.billable_duration_hours || 0) * (e.hourly_rate || 0)).toFixed(2)} €</td>` : ''}
                    </tr>
                  `).join('')}
                </tbody>
              </table>

              <!-- Projekt-Zwischensumme -->
              <div style="background: #f1f5f9; border-top: 1px solid #cbd5e1; padding: 6px 12px; display: flex; justify-content: space-between; align-items: center; font-size: 10.5px; font-weight: 700; color: #1e293b;">
                <span>Zwischensumme ${escapeHtml(grp.project_name)}:</span>
                <span>
                  Geleistet: <strong>${projHours.toFixed(2)} h</strong> (Abrechenbar: ${projHours.toFixed(2)} h)
                  ${!hideRates ? ` &bull; Netto: <strong style="color: #2563eb;">${projNet.toFixed(2)} €</strong>` : ''}
                </span>
              </div>
            </div>
          `;
        }).join('');
      } else {
        groupsPrintHtml = `
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 16px; font-size: 11px;">
            <thead>
              <tr>
                <th style="width: 75px;">Datum</th>
                <th style="width: 130px;">Projekt / Stream</th>
                <th style="width: 55px; text-align: right;">Dauer</th>
                <th>Tätigkeitsbeschreibung</th>
                <th style="width: 80px;">Ort</th>
                ${!hideRates ? `<th style="width: 70px; text-align: right;">Satz</th><th style="width: 80px; text-align: right;">Gesamt</th>` : ''}
              </tr>
            </thead>
            <tbody>
              ${data.entries.map(e => `
                <tr>
                  <td><strong>${e.entry_date}</strong></td>
                  <td>${escapeHtml(e.project_name)}</td>
                  <td style="text-align: right; font-weight: 700;">${(e.billable_duration_hours || 0).toFixed(2)} h</td>
                  <td>
                    <div>${escapeHtml(e.short_description || '')}</div>
                    ${e.deliverable ? `<small style="color: #4338ca; font-weight: 600;">ADR / Deliverable: ${escapeHtml(e.deliverable)}</small>` : ''}
                  </td>
                  <td>${escapeHtml(e.location || 'Remote')}</td>
                  ${!hideRates ? `
                    <td style="text-align: right;">${(e.hourly_rate || 0).toFixed(2)} €</td>
                    <td style="text-align: right; font-weight: 600;">${((e.billable_duration_hours || 0) * (e.hourly_rate || 0)).toFixed(2)} €</td>
                  ` : ''}
                </tr>
              `).join('')}
            </tbody>
          </table>
        `;
      }

      printWindow.document.write(`
        <!DOCTYPE html>
        <html lang="de">
        <head>
          <meta charset="utf-8">
          <title>Stundenzettel ${data.period} - ${escapeHtml(data.customer?.name || '')}</title>
          <style>
            @page { size: A4 portrait; margin: 12mm 10mm; }
            * { box-sizing: border-box; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; margin: 0; padding: 20px; color: #0f172a; background: #f1f5f9; font-size: 11px; }
            .no-print-toolbar { position: sticky; top: 0; max-width: 210mm; margin: 0 auto 16px auto; background: #ffffff; padding: 10px 16px; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; border: 1px solid #cbd5e1; box-shadow: 0 4px 12px rgba(0,0,0,0.08); }
            .btn { padding: 6px 14px; font-weight: 600; border-radius: 6px; cursor: pointer; border: 1px solid #cbd5e1; background: #fff; font-size: 12px; }
            .btn-primary { background: #4f46e5; color: #fff; border-color: #4f46e5; }
            .a4-page { width: 210mm; min-height: 297mm; padding: 16mm 14mm; margin: 0 auto 30px auto; background: #fff; box-shadow: 0 4px 20px rgba(0,0,0,0.1); border-radius: 2px; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 0; font-size: 10.5px; }
            th, td { border: 1px solid #cbd5e1; padding: 5px 8px; text-align: left; }
            th { background: #f8fafc; font-weight: 600; }
            .signatures-container { display: flex; justify-content: space-between; margin-top: 24px; page-break-inside: avoid; break-inside: avoid; }
            .sign-block { width: 46%; }
            .sign-line { border-top: 1px solid #64748b; padding-top: 6px; font-size: 11px; color: #334155; }
            @media print {
              body { background: #fff !important; padding: 0 !important; }
              .no-print-toolbar { display: none !important; }
              .a4-page { width: 100% !important; margin: 0 !important; padding: 0 !important; box-shadow: none !important; }
            }
          </style>
        </head>
        <body>
          <div class="no-print-toolbar">
            <span style="font-weight: 700; color: #1e293b;">Vorschau Stundenzettel (Abrechnungsgenehmigung)</span>
            <button class="btn btn-primary" onclick="window.print()">Drucken / Als PDF speichern</button>
          </div>
          <div class="a4-page">
            <div style="display: flex; justify-content: space-between; border-bottom: 2px solid #0f172a; padding-bottom: 12px; margin-bottom: 16px;">
              <div>
                <h1 style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 0 0 2px 0;">${escapeHtml(contractorFullName)}</h1>
                <div style="font-size: 12.5px; font-weight: 600; color: #2563eb; margin-bottom: 3px;">${escapeHtml(contractorTitle)}</div>
                <div style="font-size: 10px; color: #64748b;">${escapeHtml(contractorCity)} &bull; Freiberufliche Architekturleistungen</div>
              </div>
              <div style="text-align: right;">
                <h2 style="font-size: 16px; font-weight: 800; color: #2563eb; margin: 0 0 2px 0; text-transform: uppercase;">Stundenzettel &amp; Tätigkeitsübersicht</h2>
                <div style="font-size: 10.5px; color: #64748b; margin-bottom: 3px;">${hideRates ? 'Reiner Tätigkeitsnachweis (ohne Honorarsätze &amp; Beträge)' : 'Kaufmännischer Leistungsnachweis'}</div>
                <div style="font-size: 10px; color: #334155;"><strong>Erstellt am:</strong> ${new Date().toISOString().substring(0, 10)}</div>
                <div style="font-size: 10.5px; color: #0f172a;"><strong>Auswertungszeitraum:</strong> Monat ${data.period} (${formatMonthName(data.period)})</div>
              </div>
            </div>

            <!-- Meta-Leiste -->
            <div style="background: #f8fafc; border-left: 4px solid #2563eb; border-top: 1px solid #e2e8f0; border-right: 1px solid #e2e8f0; border-bottom: 1px solid #e2e8f0; border-radius: 4px; padding: 10px 14px; margin-bottom: 16px; display: flex; justify-content: space-between; align-items: center; font-size: 11px; flex-wrap: wrap; gap: 8px;">
              <div><strong>Kunde:</strong> ${escapeHtml(data.customer?.name || '')}</div>
              <div><strong>Abrechnungsgenehmiger:</strong> <span style="color: #4338ca; font-weight: 700;">${escapeHtml(approverName)}</span> ${approverEmail ? `&bull; ${escapeHtml(approverEmail)}` : ''} (${escapeHtml(approverRole)})</div>
              <div><strong>Einträge:</strong> ${data.entries.length} Zeiteinträge &bull; <strong>${data.totalHours.toFixed(2)} h</strong></div>
            </div>

            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
              <h3 style="font-size: 12.5px; margin: 0; color: #0f172a; font-weight: 700;">1. Erbrachte Leistungen &amp; Tätigkeiten (${data.entries.length} Buchungen)</h3>
              ${groupByProject ? `<span style="font-size: 10.5px; color: #2563eb; font-weight: 600;">Nach Projekten gegliedert</span>` : ''}
            </div>

            <!-- Projekt-Karten / Gruppen -->
            ${groupsPrintHtml}

            <!-- Gesamtsumme -->
            <div style="background: #f8fafc; border: 1.5px solid #cbd5e1; border-radius: 6px; padding: 10px 14px; margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
              <div style="font-size: 12.5px; font-weight: 700; color: #0f172a;">
                Gesamter Leistungsaufwand: ${data.totalHours.toFixed(2)} Stunden
                ${!hideRates ? ` &bull; Gesamtbetrag Netto: ${data.totalAmountNet.toFixed(2)} €` : ''}
              </div>
            </div>

            <!-- UNTERSCHRIFTENBLOCK -->
            <div class="signatures-container">
              <div class="sign-block">
                <div style="height: 50px; display: flex; align-items: flex-end; margin-bottom: 4px;">
                  ${sigDataUrl ? `<img src="${sigDataUrl}" alt="Unterschrift Auftragnehmer" style="max-height: 48px; max-width: 200px; object-fit: contain;">` : ''}
                </div>
                <div class="sign-line">
                  <strong>${escapeHtml(contractorFullName)}</strong> (Auftragnehmer)<br>
                  <span style="color: #64748b; font-size: 10px;">${escapeHtml(contractorTitle)}</span><br>
                  <small style="color: #64748b;">Ort, Datum: ${escapeHtml(contractorCity)}, ${new Date().toLocaleDateString('de-DE')}</small>
                </div>
              </div>
              <div class="sign-block">
                <div style="height: 50px; display: flex; align-items: flex-end; margin-bottom: 4px;">
                  <span style="font-size: 10px; color: #d97706; font-weight: 700; background: #fffbeb; border: 1px solid #fde68a; padding: 4px 8px; border-radius: 4px;">
                    Abrechnungsgenehmigung ausstehend
                  </span>
                </div>
                <div class="sign-line">
                  <strong>${escapeHtml(approverName)}</strong> (${escapeHtml(approverRole)})<br>
                  <span style="color: #64748b; font-size: 10px;">Freigabe &amp; sachliche Abnahme für ${escapeHtml(data.customer?.name || '')}</span><br>
                  <small style="color: #64748b;">Datum, rechtsverbindliche Unterschrift / OTP</small>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `);
      printWindow.document.close();
    }

    async function executeSubmitForSignature() {
      const data = getSubmitModalTargetData();
      if (data.entries.length === 0 && data.trips.length === 0) {
        alert("Bitte wählen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position aus.");
        return;
      }

      const approverName = document.getElementById("submit-approver-name")?.value.trim();
      const approverEmail = document.getElementById("submit-approver-email")?.value.trim();
      const recipientType = document.querySelector('input[name="submit-recipient-type"]:checked')?.value || 'customer';
      const hideRates = document.getElementById("submit-opt-hide-rates")?.checked ? 1 : 0;

      if (!approverName) {
        alert("Bitte geben Sie den Namen des Genehmigers an.");
        document.getElementById("submit-approver-name")?.focus();
        return;
      }

      const confirmBtn = document.getElementById("btn-submit-confirm");
      const origBtnText = confirmBtn ? confirmBtn.innerHTML : "";
      if (confirmBtn) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<i class="fa-solid fa-spinner fa-spin"></i> Sperre und lege vor...`;
      }

      try {
        // Posten nach Projekt gruppieren
        const projectMap = new Map();
        for (const e of data.entries) {
          if (!projectMap.has(e.project_id)) projectMap.set(e.project_id, { timeIds: [], tripIds: [] });
          projectMap.get(e.project_id).timeIds.push(e.id);
        }
        for (const tr of data.trips) {
          if (!projectMap.has(tr.project_id)) projectMap.set(tr.project_id, { timeIds: [], tripIds: [] });
          projectMap.get(tr.project_id).tripIds.push(tr.id);
        }

        let submittedCount = 0;
        let lastMessage = "";

        for (const [projId, ids] of projectMap.entries()) {
          const res = await fetch(`${API_BASE}/billing/submit-for-signature`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              projectId: projId,
              period: data.period,
              selectedTimeEntryIds: ids.timeIds,
              selectedTripIds: ids.tripIds,
              approverName,
              approverEmail,
              recipientType,
              hideRates
            })
          });
          const resData = await res.json();
          if (!res.ok || !resData.success) {
            throw new Error(`Fehler bei Projekt ${projId}: ${resData.error || 'Aktion fehlgeschlagen'}`);
          }
          submittedCount++;
          lastMessage = resData.message || "";
        }

        alert(`✓ Stundenzettel für ${data.period} erfolgreich zur Abrechnungsgenehmigung vorgelegt!\n\nGenehmiger: ${approverName} ${approverEmail ? `(${approverEmail})` : ''}\nProjekte: ${submittedCount}\nPosten: ${data.entries.length} Zeiteinträge (${data.totalHours.toFixed(2)} h) GoBD-gesperrt.`);
        if (typeof closeModal === "function") {
          closeModal('submit-for-signature-modal');
        } else {
          document.getElementById('submit-for-signature-modal')?.classList.remove("active");
        }
        _submitModalSelectedTimeIds = [];
        _submitModalSelectedTripIds = [];
        await loadBillingHierarchy();
      } catch (err) {
        alert("Fehler bei der Vorlage: " + err.message);
      } finally {
        if (confirmBtn) {
          confirmBtn.disabled = false;
          confirmBtn.innerHTML = origBtnText;
        }
      }
    }

    // Export global functions
    window.openSubmitForSignatureModal = openSubmitForSignatureModal;
    window.onSubmitModalScopeChanged = onSubmitModalScopeChanged;
    window.updateSubmitModalScope = onSubmitModalScopeChanged;
    window.onSubmitRecipientTypeChanged = onSubmitRecipientTypeChanged;
    window.updateSubmitModalRecipient = onUpdateApproverDefault;
    window.updateSubmitModalPreview = updateSubmitModalPreview;
    window.openSubmitModalPdfPreview = openSubmitModalPdfPreview;
    window.executeSubmitForSignature = executeSubmitForSignature;
    window.buildProjectGroupsFromEntries = buildProjectGroupsFromEntries;

    // ==========================================
