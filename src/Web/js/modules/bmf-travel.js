    let currentEditTripMode = "domestic";
    let foreignMealDeductionsCreate = {};
    let foreignMealDeductionsEdit = {};

    function initBmfForeignRatesDropdown(selectId = "travel-foreign-country-select") {
      const select = document.getElementById(selectId);
      if (!select) return;
      const rates = (typeof getEffectiveBmfRates === "function") ? getEffectiveBmfRates() : [];
      const curVal = select.value;
      select.innerHTML = "";

      const sorted = [...rates].sort((a, b) => a.label.localeCompare(b.label, "de", { sensitivity: "base" }));
      sorted.forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.setAttribute("data-country", r.country);
        opt.setAttribute("data-city", r.city || "");
        opt.setAttribute("data-rate24h", r.rate_24h);
        opt.setAttribute("data-rate8h", r.rate_arrival_departure || r.rate_8h);
        opt.setAttribute("data-hotel", r.rate_night || r.rate_hotel);
        opt.innerText = `${r.label} — 24h: ${r.rate_24h} € | >8h: ${r.rate_arrival_departure || r.rate_8h} €`;
        select.appendChild(opt);
      });

      if (curVal && sorted.some(r => r.id === curVal)) {
        select.value = curVal;
      } else {
        const ch = sorted.find(r => r.id === "schweiz" || r.country === "Schweiz");
        if (ch) select.value = ch.id;
      }
    }

    function onFilterBmfRates(query, selectId = "travel-foreign-country-select") {
      const select = document.getElementById(selectId);
      if (!select) return;
      const q = (query || "").toLowerCase().trim();
      const rates = (typeof getEffectiveBmfRates === "function") ? getEffectiveBmfRates() : [];
      const filtered = !q ? rates : rates.filter(r => 
        r.label.toLowerCase().includes(q) || 
        r.country.toLowerCase().includes(q) || 
        (r.city && r.city.toLowerCase().includes(q))
      );

      const curVal = select.value;
      select.innerHTML = "";
      filtered.sort((a, b) => a.label.localeCompare(b.label, "de")).forEach(r => {
        const opt = document.createElement("option");
        opt.value = r.id;
        opt.setAttribute("data-country", r.country);
        opt.setAttribute("data-city", r.city || "");
        opt.setAttribute("data-rate24h", r.rate_24h);
        opt.setAttribute("data-rate8h", r.rate_arrival_departure || r.rate_8h);
        opt.setAttribute("data-hotel", r.rate_night || r.rate_hotel);
        opt.innerText = `${r.label} — 24h: ${r.rate_24h} € | >8h: ${r.rate_arrival_departure || r.rate_8h} €`;
        select.appendChild(opt);
      });

      if (filtered.length > 0) {
        if (filtered.some(r => r.id === curVal)) select.value = curVal;
        else select.selectedIndex = 0;
      }
      const mode = selectId.includes("edit") ? "edit" : "create";
      onBmfCountryChanged(mode);
    }

    function onBmfCountryChanged(mode = "create") {
      const isEdit = mode === "edit";
      const select = document.getElementById(isEdit ? "edit-travel-foreign-country-select" : "travel-foreign-country-select");
      if (!select) return;
      const opt = select.options[select.selectedIndex];
      if (!opt) return;

      const rate24h = parseFloat(opt.getAttribute("data-rate24h") || "0");
      const rate8h = parseFloat(opt.getAttribute("data-rate8h") || "0");
      const hotel = parseFloat(opt.getAttribute("data-hotel") || "0");
      const country = opt.getAttribute("data-country") || "";
      const city = opt.getAttribute("data-city") || "";
      const label = city ? `${country} (${city})` : country;

      const cutF = (rate24h * 0.20).toFixed(2);
      const cutMA = (rate24h * 0.40).toFixed(2);

      // Auto-detect currency for selected destination country
      const targetCurrency = (typeof getCurrencyForCountry === "function") ? getCurrencyForCountry(country) : "EUR";

      if (!isEdit) {
        const nameEl = document.getElementById("foreign-rate-name-display");
        const valsEl = document.getElementById("foreign-rate-vals-display");
        const cutFEl = document.getElementById("foreign-cut-f");
        const cutMAEl = document.getElementById("foreign-cut-ma");

        if (nameEl) nameEl.innerText = label;
        if (valsEl) valsEl.innerHTML = `Ganztags (24h): <strong>${rate24h.toFixed(2)} €</strong> | An-/Abreise (>8h): <strong>${rate8h.toFixed(2)} €</strong> | Übernachtung: <strong>${hotel.toFixed(2)} €</strong> | Landeswährung: <strong>${targetCurrency}</strong>`;
        if (cutFEl) cutFEl.innerText = `${cutF} €`;
        if (cutMAEl) cutMAEl.innerText = `${cutMA} €`;

        const destInput = document.getElementById("travel-dest");
        if (destInput && (!destInput.value || destInput.value.includes("Hamburg") || destInput.value.includes("Speicherstadt"))) {
          destInput.value = city ? `${city}, ${country}` : country;
        }

        // Update default currency on blank expense rows
        if (targetCurrency && targetCurrency !== "EUR") {
          document.querySelectorAll("#travel-expenses-tbody tr").forEach(tr => {
            const curInput = tr.querySelector(".exp-currency");
            const amtInput = tr.querySelector(".exp-foreign-amount");
            if (curInput && curInput.value === "EUR" && (!amtInput || !amtInput.value)) {
              curInput.value = targetCurrency;
              const btn = tr.querySelector(`#fx_btn_${tr.id}`);
              if (btn) {
                btn.style.background = "#fef08a";
                btn.style.borderColor = "#ca8a04";
                btn.style.color = "#854d0e";
                btn.style.fontWeight = "700";
                btn.innerHTML = `<i class="fa-solid fa-coins"></i> ${targetCurrency} (FX)`;
              }
              const taxSelect = tr.querySelector(".exp-tax");
              if (taxSelect) taxSelect.value = "0"; // 0% gem. § 15 UStG
            }
          });
        }

        calculateTravelTotals();
      } else {
        const valsEl = document.getElementById("edit-foreign-rate-vals-display");
        if (valsEl) {
          valsEl.innerHTML = `<strong>${label}</strong>: Ganztags: <strong>${rate24h.toFixed(2)} €</strong> | >8h: <strong>${rate8h.toFixed(2)} €</strong> | Übernachtung: <strong>${hotel.toFixed(2)} €</strong> | Währung: <strong>${targetCurrency}</strong>`;
        }
        calculateEditTripTotals();
      }
    }

    function switchTripEntryMode(mode) {
      currentTripMode = mode;
      const btnDom = document.getElementById("btn-mode-domestic");
      const btnSingle = document.getElementById("btn-mode-foreign-single");
      const btnMulti = document.getElementById("btn-mode-foreign-multi");
      const foreignBox = document.getElementById("foreign-trip-header-box");
      const roundtripBox = document.getElementById("round-trip-legs-box");
      const simpleRoute = document.getElementById("simple-route-row");
      const btnToggleRoundtrip = document.getElementById("btn-toggle-roundtrip");
      const bfLabel = document.getElementById("travel-has-breakfast-label");

      [btnDom, btnSingle, btnMulti].forEach(b => {
        if (b) {
          b.style.background = "#fff";
          b.style.color = "#1e293b";
          b.style.border = "1px solid #cbd5e1";
        }
      });

      if (mode === "domestic") {
        if (btnDom) {
          btnDom.style.background = "var(--primary)";
          btnDom.style.color = "#fff";
          btnDom.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "none";
        if (bfLabel) bfLabel.innerText = "Frühstück für alle Reisetage (-5,60 € je ÜN)";
        if (isRoundTripMode) {
          if (roundtripBox) roundtripBox.style.display = "block";
          if (simpleRoute) simpleRoute.style.display = "none";
        } else {
          if (roundtripBox) roundtripBox.style.display = "none";
          if (simpleRoute) simpleRoute.style.display = "flex";
        }
        if (btnToggleRoundtrip) btnToggleRoundtrip.style.display = "inline-flex";
      } else if (mode === "foreign-single") {
        if (btnSingle) {
          btnSingle.style.background = "var(--primary)";
          btnSingle.style.color = "#fff";
          btnSingle.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "block";
        if (bfLabel) bfLabel.innerText = "Frühstück an allen Tagen im Hotel enthalten (-20% je Tag)";
        initBmfForeignRatesDropdown("travel-foreign-country-select");
        onBmfCountryChanged("create");
        if (roundtripBox) roundtripBox.style.display = "none";
        if (simpleRoute) simpleRoute.style.display = "flex";
        if (btnToggleRoundtrip) btnToggleRoundtrip.style.display = "none";
        isRoundTripMode = false;
      } else if (mode === "foreign-multi") {
        if (btnMulti) {
          btnMulti.style.background = "var(--primary)";
          btnMulti.style.color = "#fff";
          btnMulti.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "block";
        if (bfLabel) bfLabel.innerText = "Frühstück an allen Tagen im Hotel enthalten (-20% je Tag)";
        initBmfForeignRatesDropdown("travel-foreign-country-select");
        onBmfCountryChanged("create");
        if (roundtripBox) roundtripBox.style.display = "block";
        if (simpleRoute) simpleRoute.style.display = "none";
        if (btnToggleRoundtrip) btnToggleRoundtrip.style.display = "none";
        isRoundTripMode = true;
        const tbody = document.getElementById("travel-legs-tbody");
        if (tbody && tbody.children.length === 0) {
          addTripLegRow("travel-legs-tbody");
          addTripLegRow("travel-legs-tbody");
        }
      }

      calculateTravelTotals();
    }

    function switchEditTripEntryMode(mode) {
      currentEditTripMode = mode;
      const btnDom = document.getElementById("btn-edit-mode-domestic");
      const btnSingle = document.getElementById("btn-edit-mode-foreign-single");
      const btnMulti = document.getElementById("btn-edit-mode-foreign-multi");
      const foreignBox = document.getElementById("edit-foreign-trip-header-box");
      const roundtripBox = document.getElementById("edit-round-trip-legs-box");
      const simpleRoute = document.getElementById("edit-simple-route-row");
      const roundToggle = document.getElementById("edit-roundtrip-toggle");

      [btnDom, btnSingle, btnMulti].forEach(b => {
        if (b) {
          b.style.background = "#fff";
          b.style.color = "#1e293b";
          b.style.border = "1px solid #cbd5e1";
        }
      });

      if (mode === "domestic") {
        if (btnDom) {
          btnDom.style.background = "var(--primary)";
          btnDom.style.color = "#fff";
          btnDom.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "none";
        if (roundToggle && roundToggle.checked) {
          if (roundtripBox) roundtripBox.style.display = "block";
          if (simpleRoute) simpleRoute.style.display = "none";
        } else {
          if (roundtripBox) roundtripBox.style.display = "none";
          if (simpleRoute) simpleRoute.style.display = "flex";
        }
      } else if (mode === "foreign-single") {
        if (btnSingle) {
          btnSingle.style.background = "var(--primary)";
          btnSingle.style.color = "#fff";
          btnSingle.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "block";
        initBmfForeignRatesDropdown("edit-travel-foreign-country-select");
        onBmfCountryChanged("edit");
        if (roundtripBox) roundtripBox.style.display = "none";
        if (simpleRoute) simpleRoute.style.display = "flex";
        if (roundToggle) roundToggle.checked = false;
      } else if (mode === "foreign-multi") {
        if (btnMulti) {
          btnMulti.style.background = "var(--primary)";
          btnMulti.style.color = "#fff";
          btnMulti.style.border = "none";
        }
        if (foreignBox) foreignBox.style.display = "block";
        initBmfForeignRatesDropdown("edit-travel-foreign-country-select");
        onBmfCountryChanged("edit");
        if (roundtripBox) roundtripBox.style.display = "block";
        if (simpleRoute) simpleRoute.style.display = "none";
        if (roundToggle) roundToggle.checked = true;
      }

      calculateEditTripTotals();
    }

    function renderForeignMealBreakdown(vmaResult, containerId = "vma-days-breakdown", mode = "create") {
      const container = document.getElementById(containerId);
      if (!container) return;
      const isEdit = mode === "edit";
      const mealDeds = isEdit ? foreignMealDeductionsEdit : foreignMealDeductionsCreate;

      if (!vmaResult || !vmaResult.days || vmaResult.days.length === 0) {
        container.style.display = "none";
        container.innerHTML = "";
        return;
      }

      container.style.display = "block";

      let html = `
        <div style="margin-bottom: 8px; font-weight: 700; color: #1e40af; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px;">
          <span><i class="fa-solid fa-utensils"></i> BMF-Tagesauflistung & Mahlzeitenkürzungen (§ 9 Abs. 4a Satz 8 EStG):</span>
          <span style="font-size: 0.75rem; color: #64748b;">(Frühstück -20% | Mittag -40% | Abend -40% der 24h-Pauschale)</span>
        </div>
        <div style="overflow-x: auto; background: #fff; border: 1px solid #bfdbfe; border-radius: 6px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 0.78rem;">
            <thead style="background: #f1f5f9; border-bottom: 1px solid #cbd5e1;">
              <tr>
                <th style="padding: 6px 8px; text-align: center; width: 40px;">Tag</th>
                <th style="padding: 6px 8px; text-align: left; width: 100px;">Datum</th>
                <th style="padding: 6px 8px; text-align: left;">Art & BMF-Ort</th>
                <th style="padding: 6px 8px; text-align: right; width: 80px;">Basis (€)</th>
                <th style="padding: 6px 8px; text-align: center; width: 90px;" title="Frühstück bereitgestellt (-20% der 24h-Pauschale)">🍳 Frühstück</th>
                <th style="padding: 6px 8px; text-align: center; width: 90px;" title="Mittagessen bereitgestellt (-40% der 24h-Pauschale)">🍽️ Mittag</th>
                <th style="padding: 6px 8px; text-align: center; width: 90px;" title="Abendessen bereitgestellt (-40% der 24h-Pauschale)">🍷 Abend</th>
                <th style="padding: 6px 8px; text-align: right; width: 90px;">Kürzung (€)</th>
                <th style="padding: 6px 8px; text-align: right; width: 90px; font-weight: 700;">Netto VMA</th>
              </tr>
            </thead>
            <tbody>
      `;

      vmaResult.days.forEach(d => {
        const dayMeals = mealDeds[d.dayNum] || {};
        const hasBf = !!dayMeals.breakfast;
        const hasLunch = !!dayMeals.lunch;
        const hasDinner = !!dayMeals.dinner;

        html += `
          <tr style="border-bottom: 1px solid #e2e8f0; ${d.type.includes('Zwischentag') ? 'background: #f8fafc;' : ''}">
            <td style="padding: 6px 8px; text-align: center; font-weight: 700; color: var(--text-muted);">${d.dayNum}</td>
            <td style="padding: 6px 8px; font-weight: 600;">${d.dateFormatted || d.dateRaw}</td>
            <td style="padding: 6px 8px;">
              <strong>${escapeHtml(d.type)}</strong>: ${escapeHtml(d.location || d.locationLabel || '')}
              <div style="font-size: 0.7rem; color: #64748b;">${escapeHtml(d.timeInfo || '')}</div>
            </td>
            <td style="padding: 6px 8px; text-align: right;">${d.baseRate.toFixed(2)} €</td>
            <td style="padding: 6px 8px; text-align: center;">
              <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
                <input type="checkbox" class="foreign-meal-check" data-day="${d.dayNum}" data-meal="breakfast" ${hasBf ? 'checked' : ''} onchange="onForeignMealCheckChanged(${d.dayNum}, 'breakfast', this.checked, '${mode}')">
                <span style="font-size: 0.7rem; color: #64748b;">-20%</span>
              </label>
            </td>
            <td style="padding: 6px 8px; text-align: center;">
              <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
                <input type="checkbox" class="foreign-meal-check" data-day="${d.dayNum}" data-meal="lunch" ${hasLunch ? 'checked' : ''} onchange="onForeignMealCheckChanged(${d.dayNum}, 'lunch', this.checked, '${mode}')">
                <span style="font-size: 0.7rem; color: #64748b;">-40%</span>
              </label>
            </td>
            <td style="padding: 6px 8px; text-align: center;">
              <label style="cursor: pointer; display: inline-flex; align-items: center; gap: 2px;">
                <input type="checkbox" class="foreign-meal-check" data-day="${d.dayNum}" data-meal="dinner" ${hasDinner ? 'checked' : ''} onchange="onForeignMealCheckChanged(${d.dayNum}, 'dinner', this.checked, '${mode}')">
                <span style="font-size: 0.7rem; color: #64748b;">-40%</span>
              </label>
            </td>
            <td style="padding: 6px 8px; text-align: right; color: #be123c;">${d.deductionTotal > 0 ? '-' + d.deductionTotal.toFixed(2) + ' €' : '0,00 €'}</td>
            <td style="padding: 6px 8px; text-align: right; font-weight: 700; color: #15803d;">${d.netRate.toFixed(2)} €</td>
          </tr>
        `;
      });

      html += `
            </tbody>
            <tfoot style="background: #f1f5f9; font-weight: 700; border-top: 1.5px solid #cbd5e1;">
              <tr>
                <td colspan="3" style="padding: 6px 8px; text-align: right;">BMF-Gesamtsumme (${vmaResult.totalDays} Tage):</td>
                <td style="padding: 6px 8px; text-align: right;">${vmaResult.totalBase.toFixed(2)} €</td>
                <td colspan="3" style="padding: 6px 8px; text-align: center; color: #64748b; font-size: 0.72rem;">Abzüge gem. EStG</td>
                <td style="padding: 6px 8px; text-align: right; color: #be123c;">-${vmaResult.totalDeduction.toFixed(2)} €</td>
                <td style="padding: 6px 8px; text-align: right; color: #15803d; font-size: 0.88rem;">${vmaResult.totalVma.toFixed(2)} €</td>
              </tr>
            </tfoot>
          </table>
        </div>
      `;

      container.innerHTML = html;
    }

    function onForeignMealCheckChanged(dayNum, mealType, isChecked, mode = "create") {
      const isEdit = mode === "edit";
      const mealDeds = isEdit ? foreignMealDeductionsEdit : foreignMealDeductionsCreate;
      mealDeds[dayNum] = mealDeds[dayNum] || {};
      mealDeds[dayNum][mealType] = isChecked;

      if (isEdit) calculateEditTripTotals();
      else calculateTravelTotals();
    }

    function toggleExpenseFxBox(rowId, tbodyId) {
      const box = document.getElementById(`fx_box_${rowId}`);
      const btn = document.getElementById(`fx_btn_${rowId}`);
      if (!box) return;
      const isHidden = box.style.display === "none" || !box.style.display;
      box.style.display = isHidden ? "block" : "none";
      if (btn) {
        if (isHidden) {
          btn.style.background = "#fef08a";
          btn.style.borderColor = "#ca8a04";
          btn.style.color = "#854d0e";
          btn.style.fontWeight = "700";
        } else {
          const curSelect = box.querySelector(".exp-currency");
          if (!curSelect || curSelect.value === "EUR") {
            btn.style.background = "";
            btn.style.borderColor = "";
            btn.style.color = "#64748b";
            btn.style.fontWeight = "";
          }
        }
      }
    }

    function onExpenseCurrencyChanged(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const curSelect = row.querySelector(".exp-currency");
      const taxSelect = row.querySelector(".exp-tax");
      const currency = curSelect?.value || "EUR";

      if (currency !== "EUR") {
        if (taxSelect) taxSelect.value = "0"; // 0% Vorsteuer für Auslandsbelege gem. § 15 UStG
      }
      onExpenseFxInputChanged(rowId, tbodyId);
    }

    function onExpenseFxInputChanged(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;
      const curSelect = row.querySelector(".exp-currency");
      const cur = curSelect?.value || "EUR";
      const foreignAmt = parseFloat(row.querySelector(".exp-foreign-amount")?.value || "0");
      const rate = parseFloat(row.querySelector(".exp-exchange-rate")?.value || "1");
      const grossInput = row.querySelector(".exp-gross");

      if (cur !== "EUR" && foreignAmt > 0 && rate > 0) {
        const eurGross = Math.round((foreignAmt / rate) * 100) / 100;
        if (grossInput) grossInput.value = eurGross.toFixed(2);
      }
      recalculateExpenseRow(rowId, tbodyId);
    }

    
    function onAiRevCurrencySelectChanged() {
      const cur = document.getElementById("ai-rev-fx-currency")?.value || "EUR";
      const badge = document.getElementById("ai-rev-fx-badge");
      if (badge) badge.innerText = cur;
      if (cur === "EUR") {
        document.getElementById("ai-rev-fx-rate").value = "1.0000";
      }
      onAiRevFxChanged();
    }

    function onAiRevFxChanged() {
      const origAmt = parseFloat(document.getElementById("ai-rev-fx-amount")?.value || "0");
      const rate = parseFloat(document.getElementById("ai-rev-fx-rate")?.value || "1");
      const eurGross = rate > 0 ? (origAmt / rate) : origAmt;
      const grossInput = document.getElementById("ai-rev-gross");
      if (grossInput) grossInput.value = eurGross > 0 ? eurGross.toFixed(2) : "0.00";
      const taxSelect = document.getElementById("ai-rev-tax");
      if (taxSelect) taxSelect.value = "0";
      recalcAiReviewNet();
    }

    function renderBmfSettingsTable(filterQuery = "") {
      const tbody = document.getElementById("settings-bmf-tbody");
      if (!tbody) return;
      const rates = (typeof getEffectiveBmfRates === "function") ? getEffectiveBmfRates() : [];
      const q = (filterQuery || "").toLowerCase().trim();
      const filtered = !q ? rates : rates.filter(r => 
        r.label.toLowerCase().includes(q) || 
        r.country.toLowerCase().includes(q) || 
        (r.city && r.city.toLowerCase().includes(q))
      );

      let customOverrides = {};
      try {
        if (globalSettings && globalSettings.foreign_rates_custom_json) {
          customOverrides = typeof globalSettings.foreign_rates_custom_json === "string" ? JSON.parse(globalSettings.foreign_rates_custom_json) : globalSettings.foreign_rates_custom_json;
        }
      } catch (_) {}

      tbody.innerHTML = filtered.slice(0, 100).map(r => {
        const isCustom = !!customOverrides[r.id];
        return `
          <tr style="border-bottom: 1px solid var(--border); ${isCustom ? 'background: #fefce8;' : ''}">
            <td style="padding: 6px 8px;">
              <strong>${escapeHtml(r.country)}</strong> ${r.city ? `(${escapeHtml(r.city)})` : ''}
              ${isCustom ? `<span class="badge badge-warning" style="font-size: 0.65rem; margin-left: 4px;">Individuell</span>` : ''}
            </td>
            <td style="padding: 6px 8px; text-align: right;">
              <input type="number" step="1" class="form-control bmf-set-24h" data-rate-id="${r.id}" value="${r.rate_24h}" style="width: 75px; display: inline-block; padding: 2px 4px; font-size: 0.78rem; text-align: right;">
            </td>
            <td style="padding: 6px 8px; text-align: right;">
              <input type="number" step="1" class="form-control bmf-set-8h" data-rate-id="${r.id}" value="${r.rate_arrival_departure || r.rate_8h}" style="width: 75px; display: inline-block; padding: 2px 4px; font-size: 0.78rem; text-align: right;">
            </td>
            <td style="padding: 6px 8px; text-align: right;">
              <input type="number" step="1" class="form-control bmf-set-hotel" data-rate-id="${r.id}" value="${r.rate_night || r.rate_hotel}" style="width: 75px; display: inline-block; padding: 2px 4px; font-size: 0.78rem; text-align: right;">
            </td>
          </tr>
        `;
      }).join("");
    }

    function onSettingsBmfSearch(val) {
      renderBmfSettingsTable(val);
    }

    async function saveCustomBmfRates() {
      const overrides = {};
      const rows = document.querySelectorAll("#settings-bmf-tbody tr");
      rows.forEach(r => {
        const input24h = r.querySelector(".bmf-set-24h");
        const input8h = r.querySelector(".bmf-set-8h");
        const inputHotel = r.querySelector(".bmf-set-hotel");
        if (input24h) {
          const id = input24h.getAttribute("data-rate-id");
          const defaultEntry = (typeof BMF_FOREIGN_RATES_2024 !== "undefined") ? BMF_FOREIGN_RATES_2024.find(x => x.id === id) : null;
          const val24h = parseFloat(input24h.value || "0");
          const val8h = parseFloat(input8h?.value || "0");
          const valHotel = parseFloat(inputHotel?.value || "0");
          if (defaultEntry && (val24h !== defaultEntry.rate_24h || val8h !== defaultEntry.rate_arrival_departure || valHotel !== defaultEntry.rate_night)) {
            overrides[id] = {
              rate_24h: val24h,
              rate_arrival_departure: val8h,
              rate_8h: val8h,
              rate_night: valHotel,
              rate_hotel: valHotel
            };
          }
        }
      });

      const jsonStr = JSON.stringify(overrides);
      globalSettings.foreign_rates_custom_json = jsonStr;
      try { localStorage.setItem("cfg_foreign_rates_custom", jsonStr); } catch (_) {}

      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foreign_rates_custom_json: jsonStr })
        });
        if (res.ok) {
          alert(`✅ BMF-Auslandssätze erfolgreich gespeichert (${Object.keys(overrides).length} individuelle Anpassungen aktiv).`);
          renderBmfSettingsTable();
        } else {
          alert("Fehler beim Speichern der Sätze.");
        }
      } catch (e) {
        alert("Netzwerkfehler: " + e.message);
      }
    }

    async function resetCustomBmfRates() {
      if (!confirm("Möchten Sie alle individuellen Auslandssätze löschen und auf die amtlichen BMF 2024 Werte zurücksetzen?")) return;
      globalSettings.foreign_rates_custom_json = "{}";
      try { localStorage.removeItem("cfg_foreign_rates_custom"); } catch (_) {}
      try {
        await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ foreign_rates_custom_json: "{}" })
        });
        alert("BMF-Auslandssätze auf amtliche 2024-Werte zurückgesetzt.");
        renderBmfSettingsTable();
      } catch (e) {
        alert("Fehler beim Zurücksetzen: " + e.message);
      }
    }

