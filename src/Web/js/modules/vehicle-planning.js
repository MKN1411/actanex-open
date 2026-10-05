    // KFZ-VOLLKOSTEN- & KILOMETERSATZ-PLANER (v2.15.0 LTS)
    // Unverbindliche Rechenhilfe zur Kostenorientierung
    // ==========================================

    function openVehiclePlanningModal() {
      if (globalSettings && globalSettings.vehicle_planning_json) {
        try {
          const plan = typeof globalSettings.vehicle_planning_json === "string" 
            ? JSON.parse(globalSettings.vehicle_planning_json) 
            : globalSettings.vehicle_planning_json;
          populateVehiclePlanningFields(plan);
        } catch (_) {}
      }
      toggleVehicleFuelFields();
      calculateVehiclePlanningRate();
      openModal("vehicle-planning-modal");
    }

    function toggleVehicleFuelFields() {
      const fuelType = document.getElementById("vp-fuel-type")?.value || "electric";
      const fElec = document.getElementById("vp-fields-electric");
      const fComb = document.getElementById("vp-fields-combustion");
      const fDir = document.getElementById("vp-fields-direct");
      if (fElec) fElec.style.display = fuelType === "electric" ? "flex" : "none";
      if (fComb) fComb.style.display = fuelType === "combustion" ? "flex" : "none";
      if (fDir) fDir.style.display = fuelType === "direct" ? "flex" : "none";
    }

    function calculateVehiclePlanningRate() {
      const annualKm = Math.max(1, parseFloat(document.getElementById("vp-annual-km")?.value || "15000"));
      const businessKm = parseFloat(document.getElementById("vp-business-km")?.value || "5000");

      // 1. Fixkosten
      const monthlyLease = parseFloat(document.getElementById("vp-monthly-lease")?.value || "0");
      const leaseAnnual = monthlyLease * 12;
      const leaseMonths = Math.max(1, parseFloat(document.getElementById("vp-lease-months")?.value || "36"));
      const onetimePayment = parseFloat(document.getElementById("vp-onetime-payment")?.value || "0");
      const onetimeAnnual = (onetimePayment / leaseMonths) * 12;
      const insuranceAnnual = parseFloat(document.getElementById("vp-insurance-annual")?.value || "0");
      const taxAnnual = parseFloat(document.getElementById("vp-tax-annual")?.value || "0");
      const otherFixedAnnual = parseFloat(document.getElementById("vp-other-fixed-annual")?.value || "0");

      const sumFixed = leaseAnnual + onetimeAnnual + insuranceAnnual + taxAnnual + otherFixedAnnual;

      const leasePrev = document.getElementById("vp-lease-annual-preview");
      if (leasePrev) leasePrev.textContent = leaseAnnual.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      const sumFixedDisp = document.getElementById("vp-sum-fixed-display");
      if (sumFixedDisp) sumFixedDisp.textContent = sumFixed.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € / Jahr";

      // 2. Variable Kosten / Verbrauch
      const fuelType = document.getElementById("vp-fuel-type")?.value || "electric";
      let energyCostAnnual = 0;

      if (fuelType === "electric") {
        const consumption = parseFloat(document.getElementById("vp-elec-consumption")?.value || "0");
        const price = parseFloat(document.getElementById("vp-elec-price")?.value || "0");
        energyCostAnnual = (annualKm / 100) * consumption * price;
        const elecPrev = document.getElementById("vp-elec-cost-preview");
        if (elecPrev) elecPrev.value = energyCostAnnual.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € / Jahr";
      } else if (fuelType === "combustion") {
        const consumption = parseFloat(document.getElementById("vp-fuel-consumption")?.value || "0");
        const price = parseFloat(document.getElementById("vp-fuel-price")?.value || "0");
        energyCostAnnual = (annualKm / 100) * consumption * price;
        const fuelPrev = document.getElementById("vp-fuel-cost-preview");
        if (fuelPrev) fuelPrev.value = energyCostAnnual.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € / Jahr";
      } else {
        energyCostAnnual = parseFloat(document.getElementById("vp-direct-energy")?.value || "0");
      }

      const maintenanceAnnual = parseFloat(document.getElementById("vp-maintenance-annual")?.value || "0");
      const careAnnual = parseFloat(document.getElementById("vp-care-annual")?.value || "0");
      const sumVariable = energyCostAnnual + maintenanceAnnual + careAnnual;

      const sumVarDisp = document.getElementById("vp-sum-variable-display");
      if (sumVarDisp) sumVarDisp.textContent = sumVariable.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " € / Jahr";

      // 3. Gesamtkosten & Kilometersatz
      const totalCosts = sumFixed + sumVariable;
      const rawRate = totalCosts / annualKm;
      const calculatedRate = Math.round(rawRate * 100) / 100;

      // Update Ergebnisbox
      const totalCostsEl = document.getElementById("vp-res-total-costs");
      if (totalCostsEl) totalCostsEl.textContent = totalCosts.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      const breakdownEl = document.getElementById("vp-res-cost-breakdown");
      if (breakdownEl) {
        breakdownEl.textContent = `Fix: ${sumFixed.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} € | Var: ${sumVariable.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      }

      const rateEl = document.getElementById("vp-res-rate-km");
      if (rateEl) rateEl.textContent = `👉 ${calculatedRate.toFixed(2).replace(".", ",")} € / km`;

      const kmBaseEl = document.getElementById("vp-res-km-base");
      if (kmBaseEl) kmBaseEl.textContent = annualKm.toLocaleString("de-DE");

      // Vergleich mit gesetzlicher Mindestpauschale 0,30 €
      const bKmLabel = document.getElementById("vp-res-business-km-label");
      if (bKmLabel) bKmLabel.textContent = businessKm.toLocaleString("de-DE");

      const standardTotal = businessKm * 0.30;
      const individualTotal = businessKm * calculatedRate;
      const delta = individualTotal - standardTotal;

      const stdEl = document.getElementById("vp-res-standard-amount");
      if (stdEl) stdEl.textContent = standardTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      const indEl = document.getElementById("vp-res-individual-amount");
      if (indEl) indEl.textContent = individualTotal.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";

      const rateLabelEl = document.getElementById("vp-res-rate-label");
      if (rateLabelEl) rateLabelEl.textContent = calculatedRate.toFixed(2).replace(".", ",") + " €";

      const deltaBadge = document.getElementById("vp-res-delta-badge");
      if (deltaBadge) {
        const sign = delta >= 0 ? "+" : "";
        deltaBadge.textContent = `${sign}${delta.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
        deltaBadge.style.background = delta >= 0 ? "#059669" : "#dc2626";
      }

      const deltaText = document.getElementById("vp-res-delta-text");
      if (deltaText) {
        const sign = delta >= 0 ? "+" : "";
        deltaText.textContent = `${sign}${delta.toLocaleString("de-DE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      }

      return {
        annualKm,
        businessKm,
        sumFixed,
        sumVariable,
        totalCosts,
        calculatedRate,
        standardTotal,
        individualTotal,
        delta
      };
    }

    async function applyVehiclePlanningRate() {
      const calc = calculateVehiclePlanningRate();
      const rate = calc.calculatedRate;
      const vName = document.getElementById("vp-vehicle-name")?.value.trim() || "Eigenes Kfz";

      const planData = {
        vehicle_name: vName,
        fuel_type: document.getElementById("vp-fuel-type")?.value || "electric",
        annual_km: calc.annualKm,
        business_km: calc.businessKm,
        monthly_lease: parseFloat(document.getElementById("vp-monthly-lease")?.value || "0"),
        onetime_payment: parseFloat(document.getElementById("vp-onetime-payment")?.value || "0"),
        lease_months: parseFloat(document.getElementById("vp-lease-months")?.value || "36"),
        insurance_annual: parseFloat(document.getElementById("vp-insurance-annual")?.value || "0"),
        tax_annual: parseFloat(document.getElementById("vp-tax-annual")?.value || "0"),
        other_fixed_annual: parseFloat(document.getElementById("vp-other-fixed-annual")?.value || "0"),
        elec_consumption: parseFloat(document.getElementById("vp-elec-consumption")?.value || "0"),
        elec_price: parseFloat(document.getElementById("vp-elec-price")?.value || "0"),
        fuel_consumption: parseFloat(document.getElementById("vp-fuel-consumption")?.value || "0"),
        fuel_price: parseFloat(document.getElementById("vp-fuel-price")?.value || "0"),
        direct_energy: parseFloat(document.getElementById("vp-direct-energy")?.value || "0"),
        maintenance_annual: parseFloat(document.getElementById("vp-maintenance-annual")?.value || "0"),
        care_annual: parseFloat(document.getElementById("vp-care-annual")?.value || "0"),
        total_costs_annual: calc.totalCosts,
        calculated_rate: rate,
        updated_at: new Date().toISOString()
      };

      const rateInput = document.getElementById("cfg-mileage-rate");
      if (rateInput) rateInput.value = rate.toFixed(2);

      globalSettings.mileage_rate_business = rate;
      globalSettings.vehicle_planning_json = JSON.stringify(planData);

      updateVehiclePlanningBadge(rate, planData);
      updateCarMileageLabels(rate);

      closeModal("vehicle-planning-modal");

      try {
        const res = await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mileage_rate_business: rate,
            vehicle_planning_json: JSON.stringify(planData)
          })
        });
        if (res.ok) {
          alert(`✅ Individueller Kostensatz (${rate.toFixed(2).replace(".", ",")} €/km für ${vName}) erfolgreich übernommen und gespeichert!\n\nHinweis: Unverbindliche Rechenhilfe. Bitte stimmen Sie die steuerliche Geltendmachung mit Ihrem Steuerberater ab.`);
        }
      } catch (err) {
        console.warn("Konnte Einstellungen nicht sofort synchronisieren:", err);
      }
    }

    async function resetMileageRateToStandard() {
      if (!confirm("Möchten Sie den Dienstreise-Kilometersatz wirklich auf die gesetzliche Mindestpauschale von 0,30 €/km zurücksetzen?")) {
        return;
      }
      const rateInput = document.getElementById("cfg-mileage-rate");
      if (rateInput) rateInput.value = "0.30";

      globalSettings.mileage_rate_business = 0.30;
      updateVehiclePlanningBadge(0.30, null);
      updateCarMileageLabels(0.30);

      try {
        await fetch(`${API_BASE}/settings`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mileage_rate_business: 0.30
          })
        });
      } catch (_) {}
    }

    function updateVehiclePlanningBadge(rate, plan) {
      const badgeEl = document.getElementById("cfg-vehicle-planning-badge");
      const resetBtn = document.getElementById("btn-reset-mileage-standard");
      if (!badgeEl) return;

      const isCustom = rate && Math.abs(rate - 0.30) > 0.001;
      if (isCustom && plan) {
        const vName = plan.vehicle_name || "Eigenes Kfz";
        badgeEl.innerHTML = `
          <div style="background: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 4px; padding: 4px 8px; color: #065f46; display: inline-flex; align-items: center; gap: 6px;">
            <i class="fa-solid fa-circle-check" style="color: #059669;"></i>
            <strong>Individueller Vollkostensatz aktiv:</strong> ${rate.toFixed(2).replace(".", ",")} €/km (${escapeHtml(vName)})
          </div>
          <div style="font-size: 0.7rem; color: #64748b; margin-top: 2px;">
            Kalkulationshilfe gespeichert &bull; Unverbindliche Rechenhilfe
          </div>
        `;
        if (resetBtn) resetBtn.style.display = "inline-block";
      } else {
        badgeEl.innerHTML = `<small style="color: var(--text-muted);">Standard: 0,30 €/km (Hin & Rück)</small>`;
        if (resetBtn) resetBtn.style.display = "none";
      }
    }

    function updateCarMileageLabels(rate) {
      const r = (rate || 0.30).toFixed(2).replace(".", ",");
      const selects = ["travel-vehicle", "travel-type", "cfg-default-transport", "form-travel-type", "trip-leg-transport"];
      selects.forEach(id => {
        const el = document.getElementById(id);
        if (!el) return;
        const optCar = el.querySelector('option[value="PersonalCar"]');
        if (optCar) {
          optCar.textContent = `🚗 Eigener PKW (${r} €/km, Eigenbeleg)`;
        }
        const optMil = el.querySelector('option[value="Mileage_Car"]');
        if (optMil) {
          optMil.textContent = `🚗 Eigener PKW (${r} €/km Pauschale)`;
        }
      });
      try {
        calculateCarCost();
      } catch (err) {
        console.warn("calculateCarCost in updateCarMileageLabels ignored:", err);
      }
    }

    function populateVehiclePlanningFields(plan) {
      if (!plan) return;
      if (plan.vehicle_name && document.getElementById("vp-vehicle-name")) document.getElementById("vp-vehicle-name").value = plan.vehicle_name;
      if (plan.fuel_type && document.getElementById("vp-fuel-type")) document.getElementById("vp-fuel-type").value = plan.fuel_type;
      if (plan.annual_km !== undefined && document.getElementById("vp-annual-km")) document.getElementById("vp-annual-km").value = plan.annual_km;
      if (plan.business_km !== undefined && document.getElementById("vp-business-km")) document.getElementById("vp-business-km").value = plan.business_km;
      if (plan.monthly_lease !== undefined && document.getElementById("vp-monthly-lease")) document.getElementById("vp-monthly-lease").value = plan.monthly_lease;
      if (plan.onetime_payment !== undefined && document.getElementById("vp-onetime-payment")) document.getElementById("vp-onetime-payment").value = plan.onetime_payment;
      if (plan.lease_months !== undefined && document.getElementById("vp-lease-months")) document.getElementById("vp-lease-months").value = plan.lease_months;
      if (plan.insurance_annual !== undefined && document.getElementById("vp-insurance-annual")) document.getElementById("vp-insurance-annual").value = plan.insurance_annual;
      if (plan.tax_annual !== undefined && document.getElementById("vp-tax-annual")) document.getElementById("vp-tax-annual").value = plan.tax_annual;
      if (plan.other_fixed_annual !== undefined && document.getElementById("vp-other-fixed-annual")) document.getElementById("vp-other-fixed-annual").value = plan.other_fixed_annual;
      if (plan.elec_consumption !== undefined && document.getElementById("vp-elec-consumption")) document.getElementById("vp-elec-consumption").value = plan.elec_consumption;
      if (plan.elec_price !== undefined && document.getElementById("vp-elec-price")) document.getElementById("vp-elec-price").value = plan.elec_price;
      if (plan.fuel_consumption !== undefined && document.getElementById("vp-fuel-consumption")) document.getElementById("vp-fuel-consumption").value = plan.fuel_consumption;
      if (plan.fuel_price !== undefined && document.getElementById("vp-fuel-price")) document.getElementById("vp-fuel-price").value = plan.fuel_price;
      if (plan.direct_energy !== undefined && document.getElementById("vp-direct-energy")) document.getElementById("vp-direct-energy").value = plan.direct_energy;
      if (plan.maintenance_annual !== undefined && document.getElementById("vp-maintenance-annual")) document.getElementById("vp-maintenance-annual").value = plan.maintenance_annual;
      if (plan.care_annual !== undefined && document.getElementById("vp-care-annual")) document.getElementById("vp-care-annual").value = plan.care_annual;
    }

    function copyVehiclePlanningProof() {
      const calc = calculateVehiclePlanningRate();
      const vName = document.getElementById("vp-vehicle-name")?.value.trim() || "Eigenes Kfz";
      const fuelType = document.getElementById("vp-fuel-type")?.value || "electric";
      const today = new Date().toLocaleDateString("de-DE");

      let energyLine = "";
      if (fuelType === "electric") {
        const cons = document.getElementById("vp-elec-consumption")?.value || "0";
        const pr = document.getElementById("vp-elec-price")?.value || "0";
        energyLine = `Ladestrom (${cons} kWh/100km à ${pr} €/kWh)`;
      } else if (fuelType === "combustion") {
        const cons = document.getElementById("vp-fuel-consumption")?.value || "0";
        const pr = document.getElementById("vp-fuel-price")?.value || "0";
        energyLine = `Kraftstoff (${cons} l/100km à ${pr} €/l)`;
      } else {
        energyLine = "Direkte Energie-/Treibstoffkosten";
      }

      const mLease = parseFloat(document.getElementById("vp-monthly-lease")?.value || "0");
      const onetime = parseFloat(document.getElementById("vp-onetime-payment")?.value || "0");
      const months = document.getElementById("vp-lease-months")?.value || "36";
      const ins = parseFloat(document.getElementById("vp-insurance-annual")?.value || "0");
      const tax = parseFloat(document.getElementById("vp-tax-annual")?.value || "0");
      const otherFix = parseFloat(document.getElementById("vp-other-fixed-annual")?.value || "0");
      const maint = parseFloat(document.getElementById("vp-maintenance-annual")?.value || "0");
      const care = parseFloat(document.getElementById("vp-care-annual")?.value || "0");

      const text = `=======================================================
KFZ-VOLLKOSTEN- & KILOMETERSATZ-KALKULATION (RECHENHILFE)
Ermittlung des tatsächlichen Fahrzeugkostensatzes
=======================================================
Fahrzeug: ${vName}
Berechnungsdatum: ${today}
Geplante Jahres-Gesamtfahrleistung: ${calc.annualKm.toLocaleString("de-DE")} km/Jahr
Geschätzte Dienstreise-Fahrleistung: ${calc.businessKm.toLocaleString("de-DE")} km/Jahr

1. FIXKOSTEN PRO JAHR:
   - Leasing-/Kreditrate (${mLease.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €/Monat x 12): ${(mLease * 12).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Einmalzahlung / Überführung (${onetime.toLocaleString("de-DE", { minimumFractionDigits: 2 })} € auf ${months} Monate): ${((onetime / months) * 12).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Kfz-Versicherung (Vollkasko/Haftpflicht): ${ins.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Kfz-Steuer: ${tax.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Sonstige fixe Kosten: ${otherFix.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   Summe Fixkosten: ${calc.sumFixed.toLocaleString("de-DE", { minimumFractionDigits: 2 })} € / Jahr

2. VARIABLE KOSTEN PRO JAHR:
   - Energiekosten [${energyLine}]: ${(calc.sumVariable - maint - care).toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Wartung / Reifen / Inspektion: ${maint.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   - Wagenpflege / Zubehör / Sonstiges: ${care.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
   Summe Variable Kosten: ${calc.sumVariable.toLocaleString("de-DE", { minimumFractionDigits: 2 })} € / Jahr

-------------------------------------------------------
GESAMTKOSTEN PRO JAHR: ${calc.totalCosts.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
ERMITTELTER VOLLKOSTENSATZ: 👉 ${calc.calculatedRate.toFixed(2).replace(".", ",")} € / km
(Kalkulationsbasis: ${calc.totalCosts.toLocaleString("de-DE", { minimumFractionDigits: 2 })} € / ${calc.annualKm.toLocaleString("de-DE")} km)
-------------------------------------------------------

ORIENTIERUNGS-VERGLEICH (bei ${calc.businessKm.toLocaleString("de-DE")} km/Jahr geschäftlich):
- Gesetzliche Mindestpauschale (0,30 €/km): ${calc.standardTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
- Individueller Vollkostensatz (${calc.calculatedRate.toFixed(2).replace(".", ",")} €/km): ${calc.individualTotal.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €
- Kalkulatorischer Hebel / Mehraufwand: ${calc.delta >= 0 ? "+" : ""}${calc.delta.toLocaleString("de-DE", { minimumFractionDigits: 2 })} €

RECHTLICHER HINWEIS (UNVERBINDLICHE RECHENHILFE):
Diese Aufstellung ist eine unverbindliche Orientierungs- und Planungshilfe für freiberufliche Tätigkeiten. Es handelt sich um keine Steuer- oder Rechtsberatung. Die steuerliche Geltendmachung eines tatsächlichen Kilometersatzes (z. B. nach R 9.5 LStR) erfordert eine ordnungsgemäße Gesamtkostendokumentation und die Abstimmung mit einem Steuerberater bzw. Finanzamt.
=======================================================`;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(() => {
          alert("📋 Die vollständige Kfz-Vollkosten-Kalkulation wurde in die Zwischenablage kopiert!");
        }).catch(() => {
          prompt("Kopieren Sie die Kalkulation mit Strg+C:", text);
        });
      } else {
        prompt("Kopieren Sie die Kalkulation mit Strg+C:", text);
      }
    }

    // ==========================================
