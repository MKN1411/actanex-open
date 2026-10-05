    // KI-BELEG-SCAN & PRÜF-QUEUE (REISEKOSTEN)
    // =========================================================================
    window.aiReviewQueue = [];
    let aiReviewTotalInBatch = 0;
    let currentAiReviewState = null;

    function updateAiReviewQueueBadge() {
      const badgeEl = document.getElementById("ai-review-queue-badge");
      const btnCancel = document.getElementById("ai-review-btn-cancel");
      const remaining = window.aiReviewQueue ? window.aiReviewQueue.length : 0;

      if (badgeEl) {
        if (remaining > 0 || aiReviewTotalInBatch > 1) {
          badgeEl.style.display = "inline-block";
          const currentNum = Math.max(1, (aiReviewTotalInBatch || (remaining + 1)) - remaining);
          const totalNum = Math.max(currentNum, aiReviewTotalInBatch || (remaining + 1));
          badgeEl.innerText = `Beleg ${currentNum} von ${totalNum}`;
        } else {
          badgeEl.style.display = "none";
        }
      }

      if (btnCancel) {
        btnCancel.innerText = remaining > 0 ? "Diesen Beleg überspringen" : "Abbrechen";
      }
    }

    async function triggerExpenseAiScan(rowId, tbodyId) {
      const row = document.getElementById(rowId);
      if (!row) return;

      const r2KeyInput = row.querySelector(".exp-r2-key");
      const fileInput = document.getElementById(`file_${rowId}`);
      let r2Key = r2KeyInput ? r2KeyInput.value : "";

      if (!r2Key && fileInput && fileInput.files && fileInput.files.length > 0) {
        await uploadExpenseReceipt(fileInput, rowId, tbodyId);
        r2Key = row.querySelector(".exp-r2-key")?.value || "";
      }

      if (!r2Key && (!fileInput || !fileInput.files || fileInput.files.length === 0)) {
        fileInput.onchange = async () => {
          await uploadExpenseReceipt(fileInput, rowId, tbodyId);
        };
        fileInput.click();
        return;
      }

      const labelEl = document.getElementById(`label_${rowId}`);
      const prevLabelHtml = labelEl ? labelEl.innerHTML : "";
      if (labelEl) {
        labelEl.innerHTML = `<span class="spinner" style="width:12px; height:12px; display:inline-block;"></span> <span style="color:#7c3aed; font-weight:600; font-size:0.75rem;">KI-Scan...</span>`;
      }

      const rFilename = row.querySelector(".exp-filename")?.value || "Belegdatei";

      try {
        const clientGeminiKey = document.getElementById("cfg-gemini-api-key")?.value.trim() ||
          localStorage.getItem("cfg_gemini_api_key") ||
          globalSettings.gemini_api_key || "";
        const clientGeminiModel = document.getElementById("cfg-gemini-model")?.value ||
          localStorage.getItem("cfg_gemini_model") ||
          globalSettings.gemini_model || "gemini-3.1-flash-lite-preview";

        const payload = {
          r2Key,
          geminiApiKey: clientGeminiKey,
          gemini_api_key: clientGeminiKey,
          preferredModel: clientGeminiModel
        };

        const res = await fetch(`${API_BASE}/vouchers/scan-ai`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error("KI-Scan HTTP " + res.status);
        const data = await res.json();

        if (data.success && data.extracted) {
          // Voller KI-Erfolg -> Review-Modal öffnen
          openAiReviewModal(rowId, tbodyId, data.extracted, data.modelUsed, r2Key, false);
        } else {
          // Teil-Erkennung oder KI unleserlich -> Trotzdem Modal als Prüfung öffnen!
          console.warn("Scan AI returned partial/no data:", data);
          const fallbackExt = createFallbackExtraction(row, rFilename, data.extracted);
          openAiReviewModal(rowId, tbodyId, fallbackExt, data.modelUsed || "Manuelle Prüfung erforderlich", r2Key, true);
        }
      } catch (err) {
        console.warn("Expense AI Scan error:", err);
        // Auch bei Netzwerk-Fehlern den Nutzer nicht hängen lassen: Modal für manuelle Freigabe öffnen
        const fallbackExt = createFallbackExtraction(row, rFilename, null);
        openAiReviewModal(rowId, tbodyId, fallbackExt, "Verbindung fehlgeschlagen (Manuell prüfen)", r2Key, true);
      }
    }

    function createFallbackExtraction(row, filename, partialExt) {
      const lower = filename.toLowerCase();
      let guessedCat = "Other";
      if (lower.includes("hotel")) guessedCat = "HotelLogis";
      else if (lower.includes("taxi")) guessedCat = "TaxiLocal";
      else if (lower.includes("bahn") || lower.includes("zug") || lower.includes("ice")) guessedCat = "TrainLongDistance";
      else if (lower.includes("kielius") || lower.includes("bus") || lower.includes("öpnv")) guessedCat = "TransitLocal";
      else if (lower.includes("essen") || lower.includes("restaurant") || lower.includes("bewirtung")) guessedCat = "Hospitality";

      const curDate = row.querySelector(".exp-date")?.value || new Date().toISOString().split("T")[0];
      const curGross = parseFloat(row.querySelector(".exp-gross")?.value || "0");

      return {
        voucherDate: partialExt?.voucherDate || curDate,
        categorySuggestion: partialExt?.categorySuggestion || guessedCat,
        amountGross: partialExt?.amountGross || curGross || 0,
        supplierName: partialExt?.supplierName || `Beleg: ${filename.replace(/_/g, ' ')}`,
        summary: partialExt?.summary || "",
        taxRate: partialExt?.taxRate !== undefined ? partialExt.taxRate : (guessedCat === "TaxiLocal" || guessedCat === "HotelLogis" || guessedCat === "TransitLocal" ? 7 : 19),
        isManualFallback: true
      };
    }

    function openAiReviewModal(rowId, tbodyId, ext, modelUsed, r2Key, isManualFallback = false) {
      const row = document.getElementById(rowId);
      if (!row) return;

      const modalEl = document.getElementById("expense-ai-review-modal");
      const isAlreadyActive = modalEl && modalEl.classList.contains("active");

      // Wenn bereits ein Beleg im Modal geprüft wird -> In die Warteschlange einreihen!
      if (isAlreadyActive) {
        window.aiReviewQueue.push({ rowId, tbodyId, ext, modelUsed, r2Key, isManualFallback });
        updateAiReviewQueueBadge();
        return;
      }

      const rFilename = row.querySelector(".exp-filename")?.value || "Belegdatei";

      // 1. Datum ermitteln
      const extractedDate = ext.voucherDate || ext.date || ext.expenseDate || row.querySelector(".exp-date")?.value || new Date().toISOString().split("T")[0];

      // 2. Beschreibung & Aussteller vorab ermitteln
      const supp = ext.supplierName || ext.vendor || ext.merchant || "";
      const summ = ext.summary || ext.description || ext.purpose || "";
      let descText = "";
      if (supp && summ) descText = `${supp}: ${summ}`;
      else if (supp) descText = supp;
      else if (summ) descText = summ;
      else descText = `Beleg: ${rFilename}`;

      const lowerDesc = (descText + " " + (ext.rawText || "")).toLowerCase();

      // 3. Kategorie & Vorsteuer zuordnen
      const validCodes = [
        "MileagePkw", "RentalCar", "FuelPower", "TaxiLocal", "TaxiLong",
        "TrainLongDistance", "TransitLocal", "Flight", "Parking", "TollFee",
        "Micromobility", "LuggageStorage", "HotelLogis", "HotelBreakfast",
        "CityTax", "VmaPerDiem", "Hospitality", "MobileInternet", "CoworkingPass",
        "TechSupplies", "ExpoTickets", "ConferenceTickets", "Other"
      ];
      let targetCat = "Other";
      const rawCat = ext.categorySuggestion || ext.category || "";

      // Prioritätsprüfung: Reiner Zahlungsnachweis / EC-Beleg (PaymentSlip)
      const isPaymentSlipDoc = ext.isPaymentSlip === true ||
        ext.docRole === "PaymentSlip" ||
        rawCat === "PaymentSlip" ||
        rawCat === "OtherExpense" ||
        lowerDesc.includes("kundenbeleg") ||
        lowerDesc.includes("kartenzahlung") ||
        lowerDesc.includes("terminalbeleg") ||
        lowerDesc.includes("girocard");

      if (isPaymentSlipDoc && !lowerDesc.includes("hotel") && !lowerDesc.includes("taxifahrt")) {
        targetCat = "Other";
      } else if (rawCat && validCodes.includes(rawCat)) {
        targetCat = rawCat;
      } else if (rawCat === "Transit" || rawCat === "ÖPNV" || rawCat === "Nahverkehr") {
        targetCat = "TransitLocal";
      } else if (rawCat === "Taxi") {
        targetCat = (ext.taxRate === 19 || (ext.amountGross && ext.amountGross > 80)) ? "TaxiLong" : "TaxiLocal";
      } else if (rawCat === "Hotel") {
        targetCat = "HotelLogis";
      } else if (rawCat === "Bahn" || rawCat === "Zug") {
        targetCat = "TrainLongDistance";
      } else if (ext.docRole === "TaxiReceipt" || ext.isTaxi === true || ext.isTaxi === "true") {
        targetCat = (ext.taxRate === 19 || (ext.amountGross && ext.amountGross > 80)) ? "TaxiLong" : "TaxiLocal";
      } else if (ext.docRole === "HotelInvoice" || ext.isHotel === true || ext.isHotel === "true") {
        targetCat = "HotelLogis";
      } else if (ext.docRole === "FlightTicket" || ext.isFlight === true || ext.isFlight === "true") {
        targetCat = "Flight";
      } else if (ext.docRole === "ParkingTicket" || ext.isParking === true || ext.isParking === "true") {
        targetCat = "Parking";
      } else if (ext.docRole === "FuelReceipt" || ext.isFuel === true || ext.isFuel === "true") {
        targetCat = "FuelPower";
      } else if (ext.docRole === "HospitalityInvoice" || rawCat === "MealsWork" || rawCat === "Hospitality") {
        targetCat = "Hospitality";
      } else if (ext.docRole === "TrainTicket" || ext.isTrain === true || ext.isTrain === "true") {
        targetCat = "TrainLongDistance";
      }

      // 4. Steuersatz
      let appliedTax = "19";
      if (isPaymentSlipDoc && targetCat === "Other") {
        appliedTax = "0";
      } else {
        const rawTaxRate = (ext.taxRate !== undefined && ext.taxRate !== null) ? ext.taxRate : (ext.tax_rate ?? ext.vatRate);
        if (rawTaxRate !== undefined && rawTaxRate !== null) {
          const parsedTax = Math.round(parseFloat(rawTaxRate));
          if (!isNaN(parsedTax)) appliedTax = String(parsedTax);
        } else {
          const catOpt = document.querySelector(`#ai-rev-cat option[value="${targetCat}"]`);
          if (catOpt) appliedTax = catOpt.getAttribute("data-tax") || "19";
        }
      }

      // 5. Brutto
      const rawGross = (ext.amountGross !== undefined && ext.amountGross !== null) ? ext.amountGross : (ext.grossAmount ?? ext.totalAmount ?? ext.amount ?? 0);
      const grossVal = Math.max(0, parseFloat(rawGross) || 0);

      // Review State sichern
      currentAiReviewState = {
        rowId,
        tbodyId,
        r2Key,
        rFilename,
        modelUsed,
        ext,
        isManualFallback
      };

      // Modal füllen
      document.getElementById("ai-review-filename").innerText = `Datei: ${rFilename}`;
      const badgeEl = document.getElementById("ai-review-model-badge");
      if (badgeEl) badgeEl.innerText = modelUsed || "KI";
      
      const bannerBox = document.getElementById("ai-review-banner-box");
      const bannerText = document.getElementById("ai-review-model-text");

      if (isManualFallback) {
        if (bannerBox) {
          bannerBox.style.background = "#fffbeb";
          bannerBox.style.borderColor = "#fcd34d";
        }
        if (bannerText) {
          bannerText.style.color = "#92400e";
          bannerText.innerHTML = `<i class="fa-solid fa-triangle-exclamation" style="color: #ea580c;"></i> <strong>Prüfung erforderlich:</strong> Bitte Betrag & Kategorie bestätigen`;
        }
      } else {
        if (bannerBox) {
          bannerBox.style.background = "#f5f3ff";
          bannerBox.style.borderColor = "#ddd6fe";
        }
        if (bannerText) {
          bannerText.style.color = "#5b21b6";
          bannerText.innerHTML = `<i class="fa-solid fa-circle-check" style="color: #7c3aed;"></i> Erkennung abgeschlossen durch: <strong id="ai-review-model-badge">${escapeHtml(modelUsed || 'KI')}</strong>`;
        }
      }

      const linkContainer = document.getElementById("ai-review-filelink-container");
      if (linkContainer) {
        linkContainer.innerHTML = r2Key ? `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(r2Key)}" target="_blank" style="color: #6d28d9; font-weight: 600; font-size: 0.8rem; text-decoration: underline;"><i class="fa-solid fa-eye"></i> Original ansehen</a>` : '';
      }

      document.getElementById("ai-rev-date").value = extractedDate;
      document.getElementById("ai-rev-cat").value = targetCat;
      document.getElementById("ai-rev-desc").value = descText;
      document.getElementById("ai-rev-gross").value = grossVal > 0 ? grossVal.toFixed(2) : "0.00";
      document.getElementById("ai-rev-tax").value = appliedTax;

      // Hotel Split Check
      const splitBox = document.getElementById("ai-rev-hotel-split-box");
      if (splitBox) {
        if ((ext.isHotel || ext.docRole === "HotelInvoice") && ext.hotelBreakfastGross && ext.hotelBreakfastGross > 0) {
          splitBox.style.display = "block";
          document.getElementById("ai-rev-split-logis").innerText = (ext.hotelLogisGross || 0).toFixed(2) + " €";
          document.getElementById("ai-rev-split-breakfast").innerText = (ext.hotelBreakfastGross || 0).toFixed(2) + " €";
        } else {
          splitBox.style.display = "none";
        }
      }

      
      // Fremdwährung aus KI-Ergebnis prüfen
      const detectedCurrency = (ext.currency || ext.foreignCurrency || "").toUpperCase();
      const aiFxBox = document.getElementById("ai-rev-fx-box");
      const aiFxBadge = document.getElementById("ai-rev-fx-badge");
      const aiFxAmount = document.getElementById("ai-rev-fx-amount");
      const aiFxRate = document.getElementById("ai-rev-fx-rate");
      const aiFxProof = document.getElementById("ai-rev-fx-proof");

      if (detectedCurrency && detectedCurrency !== "EUR" && detectedCurrency !== "€") {
        if (aiFxBox) aiFxBox.style.display = "block";
        if (aiFxBadge) aiFxBadge.innerText = detectedCurrency;
        const curSelectAi = document.getElementById("ai-rev-fx-currency");
        if (curSelectAi) {
          curSelectAi.innerHTML = getFullWorldCurrencyOptionsHtml(detectedCurrency);
        }
        if (aiFxAmount) aiFxAmount.value = (ext.foreignAmountGross || grossVal || 0).toFixed(2);
        if (aiFxRate) aiFxRate.value = ext.exchangeRate || 1.0;
        if (aiFxProof && ext.exchangeRateProof) aiFxProof.value = ext.exchangeRateProof;
        if (document.getElementById("ai-rev-tax")) document.getElementById("ai-rev-tax").value = "0"; // 0% gem § 15 UStG
      } else {
        if (aiFxBox) aiFxBox.style.display = "none";
      }

      recalcAiReviewNet();
      updateAiReviewQueueBadge();
      openModal("expense-ai-review-modal");

      // Wenn Betrag 0 war, sofort Fokus in das Brutto-Eingabefeld setzen
      if (grossVal === 0) {
        setTimeout(() => {
          const grossInput = document.getElementById("ai-rev-gross");
          if (grossInput) {
            grossInput.focus();
            grossInput.select();
          }
        }, 150);
      }
    }

    function onAiReviewCategoryChanged() {
      const catSelect = document.getElementById("ai-rev-cat");
      if (!catSelect) return;
      const opt = catSelect.options[catSelect.selectedIndex];
      if (opt && opt.getAttribute("data-tax") !== null) {
        document.getElementById("ai-rev-tax").value = opt.getAttribute("data-tax");
      }
      recalcAiReviewNet();
    }

    function recalcAiReviewNet() {
      const gross = parseFloat(document.getElementById("ai-rev-gross")?.value || "0");
      const taxRate = parseFloat(document.getElementById("ai-rev-tax")?.value || "0");
      const net = taxRate > 0 ? (gross / (1 + (taxRate / 100))) : gross;
      const netEl = document.getElementById("ai-rev-net");
      if (netEl) netEl.value = `${net.toFixed(2)} €`;
    }

    function applyAiReviewToRow() {
      if (!currentAiReviewState) return;
      const { rowId, tbodyId, r2Key, rFilename, modelUsed, ext, isManualFallback } = currentAiReviewState;
      const row = document.getElementById(rowId);
      if (!row) return;

      const dateVal = document.getElementById("ai-rev-date")?.value || "";
      const catVal = document.getElementById("ai-rev-cat")?.value || "Other";
      const descVal = document.getElementById("ai-rev-desc")?.value || "";
      const grossVal = parseFloat(document.getElementById("ai-rev-gross")?.value || "0");
      const taxVal = document.getElementById("ai-rev-tax")?.value || "19";

      // 1. Datum
      if (row.querySelector(".exp-date") && dateVal) {
        row.querySelector(".exp-date").value = dateVal;
      }

      // 2. Kategorie & SKR04
      const catSelect = row.querySelector(".exp-cat");
      if (catSelect) {
        catSelect.value = catVal;
        if (catSelect.value !== catVal) {
          const opt = catSelect.querySelector(`option[value="${catVal}"]`);
          if (opt) opt.selected = true;
        }
        const opt = catSelect.options[catSelect.selectedIndex];
        if (opt) {
          const skr04 = opt.getAttribute("data-skr04") || "";
          const skrInput = row.querySelector(".exp-skr04");
          if (skrInput) skrInput.value = skr04;
        }
      }

      // 3. Steuersatz
      const taxSelect = row.querySelector(".exp-tax");
      if (taxSelect) {
        taxSelect.value = taxVal;
      }

      // 4. Betrag Brutto
      const grossInput = row.querySelector(".exp-gross");
      if (grossInput) {
        grossInput.value = grossVal > 0 ? grossVal.toFixed(2) : "0.00";
      }

      // 5. Beschreibung
      const descInput = row.querySelector(".exp-desc");
      if (descInput) {
        descInput.value = descVal;
      }

      // Foreign currency handling from AI review
      const fxBox = document.getElementById("ai-rev-fx-box");
      const fxBadge = document.getElementById("ai-rev-fx-badge")?.innerText || "EUR";
      const fxAmt = parseFloat(document.getElementById("ai-rev-fx-amount")?.value || "0");
      const fxRate = parseFloat(document.getElementById("ai-rev-fx-rate")?.value || "1.0");
      const fxProof = document.getElementById("ai-rev-fx-proof")?.value || "Kreditkartenabrechnung";

      const curSelect = row.querySelector(".exp-currency");
      const foreignAmtInput = row.querySelector(".exp-foreign-amount");
      const rateInput = row.querySelector(".exp-exchange-rate");
      const proofSelect = row.querySelector(".exp-exchange-proof");
      const rowFxBox = document.getElementById(`fx_box_${rowId}`);
      const rowFxBtn = document.getElementById(`fx_btn_${rowId}`);

      if (fxBox && fxBox.style.display !== "none" && fxBadge !== "EUR") {
        if (curSelect) curSelect.value = fxBadge;
        if (foreignAmtInput) foreignAmtInput.value = fxAmt > 0 ? fxAmt.toFixed(2) : "";
        if (rateInput) rateInput.value = fxRate > 0 ? fxRate : "1.0";
        if (proofSelect) proofSelect.value = fxProof;
        if (rowFxBox) rowFxBox.style.display = "block";
        if (rowFxBtn) {
          rowFxBtn.style.background = "#fef08a";
          rowFxBtn.style.borderColor = "#ca8a04";
          rowFxBtn.style.color = "#854d0e";
          rowFxBtn.style.fontWeight = "700";
          rowFxBtn.innerHTML = `<i class="fa-solid fa-coins"></i> ${fxBadge}`;
        }
      }

      // 6. Hotel Split wenn vorhanden
      if ((ext.isHotel || ext.docRole === "HotelInvoice") && ext.hotelBreakfastGross && ext.hotelBreakfastGross > 0) {
        if (ext.hotelLogisGross && ext.hotelLogisGross > 0) {
          grossInput.value = ext.hotelLogisGross.toFixed(2);
          taxSelect.value = "7";
          descInput.value = `${ext.supplierName || 'Hotel'}: Übernachtung (Logis 7%)`;
        }
        addExpenseRow(tbodyId, {
          expenseDate: dateVal,
          category: "HotelBreakfast",
          description: `${ext.supplierName || 'Hotel'}: Frühstück / Business Package (19%)`,
          amountGross: ext.hotelBreakfastGross,
          taxRate: 19,
          currency: (fxBox && fxBox.style.display !== "none" && fxBadge !== "EUR") ? fxBadge : "EUR",
          foreignAmountGross: ext.hotelBreakfastGross,
          exchangeRate: fxRate,
          exchangeRateProof: fxProof,
          receiptR2Key: r2Key,
          receiptFilename: rFilename,
          receiptMimeType: row.querySelector(".exp-mimetype")?.value || "application/pdf",
          isBillableToClient: true
        });
      }

      // Recalculate row & trip totals
      recalculateExpenseRow(rowId, tbodyId);

      // Label aktualisieren
      const labelEl = document.getElementById(`label_${rowId}`);
      if (labelEl) {
        const modelHint = modelUsed ? ` (${escapeHtml(modelUsed)})` : '';
        labelEl.innerHTML = `<a href="${API_BASE}/trips/receipts/${encodeURIComponent(r2Key)}" target="_blank" style="color: #15803d; font-weight: 600;" title="Geprüft${modelHint}: ${escapeHtml(descVal)}"><i class="fa-solid fa-circle-check" style="color:#15803d;"></i> ${escapeHtml(rFilename)}</a>`;
      }

      // Prüfen, ob weitere Belege in der Warteschlange liegen
      if (window.aiReviewQueue && window.aiReviewQueue.length > 0) {
        const next = window.aiReviewQueue.shift();
        currentAiReviewState = null;
        updateAiReviewQueueBadge();
        openAiReviewModal(next.rowId, next.tbodyId, next.ext, next.modelUsed, next.r2Key, next.isManualFallback);
      } else {
        closeModal("expense-ai-review-modal");
        currentAiReviewState = null;
        aiReviewTotalInBatch = 0;
      }
    }

    function closeOrSkipAiReviewModal(closeAll = false) {
      if (closeAll || !window.aiReviewQueue || window.aiReviewQueue.length === 0) {
        window.aiReviewQueue = [];
        aiReviewTotalInBatch = 0;
        closeModal("expense-ai-review-modal");
        currentAiReviewState = null;
        return;
      }
      // Nächsten Beleg aus der Warteschlange öffnen
      const next = window.aiReviewQueue.shift();
      currentAiReviewState = null;
      updateAiReviewQueueBadge();
      openAiReviewModal(next.rowId, next.tbodyId, next.ext, next.modelUsed, next.r2Key, next.isManualFallback);
    }

