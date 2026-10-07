import { Env } from "../types";
import { documentStorage } from './document_storage.service';
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { ensureTripExpenses, ensureSettings } from "./db_bootstrap.service";

export async function getTaxReportSummary(request: Request, env: Env): Promise<Response> {
  await ensureTripExpenses(env);
  const url = new URL(request.url);
  const isDemo = isDemoRequest(request);
  const year = url.searchParams.get("year") || "all";
  const month = url.searchParams.get("month") || "all";
  const customerId = url.searchParams.get("customerId") || "all";
  const projectId = url.searchParams.get("projectId") || "all";
  const dateFrom = url.searchParams.get("dateFrom");
  const dateTo = url.searchParams.get("dateTo");

  // 1. Settings ermitteln
  const configRow =
    (await env.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first<any>()) || {};
  const taxMode = configRow?.tax_mode || "standard";
  const isSmallBusiness = taxMode === "small_business";

  // 2. Erlöse & Leistungsnachweise
  let tsSql = `
    SELECT tv.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE tv.is_invoice_canceled = 0
      AND tv.status != 'Rejected'
  `;
  const tsParams: any[] = [];
  if (!isDemo) {
    tsSql +=
      " AND (p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL))";
  } else {
    tsSql += " AND (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%')";
  }
  if (customerId && customerId !== "all") {
    tsSql += " AND p.customer_id = ?";
    tsParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tsSql += " AND tv.project_id = ?";
    tsParams.push(projectId);
  }
  if (year && year !== "all") {
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    const pFrom = dateFrom.substring(0, 7);
    const pTo = dateTo.substring(0, 7);
    tsSql += " AND tv.period >= ? AND tv.period <= ?";
    tsParams.push(pFrom, pTo);
  }
  tsSql += " ORDER BY tv.period DESC, tv.created_at_utc DESC";

  let tsStmt = env.DB.prepare(tsSql);
  if (tsParams.length > 0) tsStmt = tsStmt.bind(...tsParams);
  const { results: timesheetResults } = await tsStmt.all<any>();

  let totalRevenueNet = 0.0;
  let totalRevenueTax = 0.0;
  const timesheetList = (timesheetResults || []).map((ts) => {
    const net = Number(ts.total_amount_net) || 0.0;
    const taxRate = isSmallBusiness ? 0.0 : 19.0;
    const tax = Number((net * (taxRate / 100)).toFixed(2));
    const gross = Number((net + tax).toFixed(2));
    totalRevenueNet += net;
    totalRevenueTax += tax;
    return {
      id: ts.id,
      period: ts.period,
      version_number: ts.version_number || 1,
      customer_name: ts.customer_name || "-",
      project_name: ts.project_name || "-",
      project_number: ts.project_number || "-",
      total_billable_hours: Number(ts.total_billable_hours) || 0.0,
      amount_net: net,
      tax_rate: taxRate,
      tax_amount: tax,
      amount_gross: gross,
      status: ts.status,
      lexware_invoice_number: ts.lexware_invoice_number || null,
      created_at_utc: ts.created_at_utc,
    };
  });

  // 3. Belege & Betriebsausgaben
  let voucherSql = `
    SELECT v.*, p.name as project_name, c.name as customer_name
    FROM operational_vouchers v
    LEFT JOIN projects p ON v.project_id = p.id
    LEFT JOIN customers c ON v.customer_id = c.id
    WHERE 1=1
  `;
  const vParams: any[] = [];
  if (!isDemo) {
    voucherSql +=
      " AND (v.id NOT LIKE 'voucher_demo_%' AND (v.project_id NOT LIKE 'prj_demo_%' OR v.project_id IS NULL))";
  } else {
    voucherSql += " AND (v.id LIKE 'voucher_demo_%' OR v.project_id LIKE 'prj_demo_%')";
  }
  if (customerId && customerId !== "all") {
    voucherSql += " AND v.customer_id = ?";
    vParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    voucherSql += " AND v.project_id = ?";
    vParams.push(projectId);
  }
  if (year && year !== "all") {
    voucherSql += " AND v.voucher_date LIKE ?";
    vParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    voucherSql += " AND v.voucher_date LIKE ?";
    vParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    voucherSql += " AND v.voucher_date >= ? AND v.voucher_date <= ?";
    vParams.push(dateFrom, dateTo);
  }
  voucherSql += " ORDER BY v.voucher_date DESC, v.created_at_utc DESC";

  let vStmt = env.DB.prepare(voucherSql);
  if (vParams.length > 0) vStmt = vStmt.bind(...vParams);
  const { results: voucherResults } = await vStmt.all<any>();

  const categoryBuckets: Record<
    string,
    { label: string; count: number; net: number; deductible_net: number; tax: number; gross: number }
  > = {
    Hospitality: {
      label: "Bewirtungskosten (70 % abzugsfähig)",
      count: 0,
      net: 0,
      deductible_net: 0,
      tax: 0,
      gross: 0,
    },
    Marketing: { label: "Werbe- & Marketingkosten", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Software: { label: "Software, Lizenzen & Cloud", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    OfficeSupplies: { label: "Arbeitsmittel & GWG", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Telecommunication: { label: "Telefon & Internet", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Education: { label: "Fortbildung & Fachliteratur", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
    Transit: {
      label: "Reisenebenkosten & Fremdbelege",
      count: 0,
      net: 0,
      deductible_net: 0,
      tax: 0,
      gross: 0,
    },
    Other: { label: "Sonstige Betriebsausgaben", count: 0, net: 0, deductible_net: 0, tax: 0, gross: 0 },
  };

  let totalVouchersNet = 0.0;
  let totalVouchersDeductibleNet = 0.0;
  let totalVouchersNonDeductibleNet = 0.0;
  let totalVouchersTax = 0.0;
  let totalVouchersGross = 0.0;
  let inputTax19 = 0.0;
  let inputTax7 = 0.0;

  const voucherList = (voucherResults || []).map((v) => {
    const type = v.voucher_type || "Other";
    const net = Number(v.amount_net) || 0.0;
    const gross = Number(v.amount_gross) || 0.0;
    const tax = Number(v.tax_amount) || 0.0;
    let dedNet = Number(v.tax_deductible_net);
    if (isNaN(dedNet) || dedNet === 0) {
      dedNet = type === "Hospitality" ? Number((net * 0.7).toFixed(2)) : net;
    }
    let nonDedNet = Number(v.tax_non_deductible_net);
    if (isNaN(nonDedNet)) {
      nonDedNet = type === "Hospitality" ? Number((net * 0.3).toFixed(2)) : 0.0;
    }

    const taxRate = Number(v.tax_rate) || 19;
    if (taxRate === 19) {
      inputTax19 += tax;
    } else if (taxRate === 7) {
      inputTax7 += tax;
    }

    totalVouchersNet += net;
    totalVouchersDeductibleNet += dedNet;
    totalVouchersNonDeductibleNet += nonDedNet;
    totalVouchersTax += tax;
    totalVouchersGross += gross;

    const catKey = categoryBuckets[type] ? type : "Other";
    categoryBuckets[catKey].count++;
    categoryBuckets[catKey].net += net;
    categoryBuckets[catKey].deductible_net += dedNet;
    categoryBuckets[catKey].tax += tax;
    categoryBuckets[catKey].gross += gross;

    return {
      id: v.id,
      voucher_number: v.voucher_number,
      voucher_date: v.voucher_date,
      voucher_type: type,
      supplier_name: v.supplier_name,
      description: v.description,
      business_purpose: v.business_purpose,
      skr04_account: v.skr04_account,
      amount_net: net,
      tax_rate: taxRate,
      tax_amount: tax,
      amount_gross: gross,
      tax_deductible_net: dedNet,
      tax_non_deductible_net: nonDedNet,
      customer_name: v.customer_name || "-",
      project_name: v.project_name || "-",
    };
  });

  // 4. Reisekosten & Fahrten & Reisebelege
  let tripSql = `
    SELECT tr.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM trips tr
    LEFT JOIN projects p ON tr.project_id = p.id
    LEFT JOIN customers c ON p.customer_id = c.id
    WHERE (tr.status = 'Completed' OR tr.status IS NULL)
  `;
  const tripParams: any[] = [];
  if (!isDemo) {
    tripSql +=
      " AND (tr.project_id NOT LIKE 'prj_demo_%' OR tr.project_id IS NULL) AND tr.id NOT LIKE 'trip_demo_%' AND (c.id NOT LIKE 'cust_demo_%' OR c.id IS NULL)";
  } else {
    tripSql += " AND (tr.project_id LIKE 'prj_demo_%' OR tr.id LIKE 'trip_demo_%' OR tr.project_id IS NULL)";
  }
  if (customerId && customerId !== "all") {
    tripSql += " AND p.customer_id = ?";
    tripParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tripSql += " AND tr.project_id = ?";
    tripParams.push(projectId);
  }
  if (year && year !== "all") {
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${mFilter}%`);
  }
  if (dateFrom && dateTo) {
    tripSql += " AND tr.trip_date >= ? AND tr.trip_date <= ?";
    tripParams.push(dateFrom, dateTo);
  }
  tripSql += " ORDER BY tr.trip_date DESC";

  let tripStmt = env.DB.prepare(tripSql);
  if (tripParams.length > 0) tripStmt = tripStmt.bind(...tripParams);
  const { results: tripResults } = await tripStmt.all<any>();

  const tripIds = (tripResults || []).map((t: any) => t.id);
  let tripExpensesResults: any[] = [];
  let tripLegsResults: any[] = [];
  if (tripIds.length > 0) {
    const chunkSize = 50;
    for (let i = 0; i < tripIds.length; i += chunkSize) {
      const chunk = tripIds.slice(i, i + chunkSize);
      const placeholders = chunk.map(() => "?").join(",");
      const { results: expRes } = await env.DB.prepare(`
        SELECT te.*, tr.trip_date, tr.project_id, tr.purpose
        FROM trip_expenses te
        JOIN trips tr ON te.trip_id = tr.id
        WHERE te.trip_id IN (${placeholders})
          AND (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
        ORDER BY te.expense_date ASC
      `)
        .bind(...chunk)
        .all<any>();
      if (expRes && expRes.length > 0) {
        tripExpensesResults.push(...expRes);
      }

      const { results: legRes } = await env.DB.prepare(`
        SELECT * FROM trip_legs
        WHERE trip_id IN (${placeholders})
        ORDER BY leg_order ASC
      `)
        .bind(...chunk)
        .all<any>();
      if (legRes && legRes.length > 0) {
        tripLegsResults.push(...legRes);
      }
    }
  }

  categoryBuckets.TravelLodging = {
    label: "Reisekosten: Übernachtungskosten (Hotel)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.TravelTransport = {
    label: "Reisekosten: Fahrtkosten (Flug, Bahn, ÖPNV)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.TravelIncidentals = {
    label: "Reisenebenkosten (Taxi, Parken, Gepäck)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.TravelOther = {
    label: "Sonstige Reisebelege",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.TravelVma = {
    label: "Reisekosten: Verpflegungsmehraufwand (VMA Pauschalen)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.TravelMileage = {
    label: "Reisekosten: Fahrtkosten (Pkw-Kilometerpauschale)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };
  categoryBuckets.CommuteExpense = {
    label: "Fahrten Wohnung / 1. Tätigkeitsstätte (Pendler)",
    count: 0,
    net: 0,
    deductible_net: 0,
    tax: 0,
    gross: 0,
  };

  let totalTripExpensesNet = 0.0;
  let totalTripExpensesTax = 0.0;
  let totalTripExpensesGross = 0.0;

  for (const te of tripExpensesResults) {
    const net = Number(te.amount_net) || 0.0;
    const tax = Number(te.tax_amount) || 0.0;
    const gross = Number(te.amount_gross) || net + tax;
    const taxRate = Number(te.tax_rate) || 0;

    if (taxRate === 19) {
      inputTax19 += tax;
    } else if (taxRate === 7) {
      inputTax7 += tax;
    }

    totalTripExpensesNet += net;
    totalTripExpensesTax += tax;
    totalTripExpensesGross += gross;

    let catKey = "TravelIncidentals";
    if (te.category === "HotelLogis") {
      catKey = "TravelLodging";
    } else if (["TransitLocal", "TrainLongDistance", "Flight", "Train"].includes(te.category)) {
      catKey = "TravelTransport";
    } else if (["TaxiLocal", "TollParking", "RentalCar"].includes(te.category)) {
      catKey = "TravelIncidentals";
    } else {
      catKey = "TravelOther";
    }

    categoryBuckets[catKey].count++;
    categoryBuckets[catKey].net += net;
    categoryBuckets[catKey].deductible_net += net;
    categoryBuckets[catKey].tax += tax;
    categoryBuckets[catKey].gross += gross;
  }

  let businessTripKm = 0.0;
  let businessTripMileageCost = 0.0;
  let businessTripVma = 0.0;
  let businessTripCount = 0;

  let commuteTripKm = 0.0;
  let commuteTripCost = 0.0;
  let commuteTripCount = 0;

  const tripsList = (tripResults || []).map((tr) => {
    const isCommute =
      tr.travel_type === "PermanentWorkplace" || tr.expense_type === "PermanentWorkplace";
    const dist = Number(tr.distance_km) || 0.0;
    const rate = Number(tr.rate_per_km) || (isCommute ? (dist > 20 ? 0.38 : 0.30) : 0.30);
    const vma = isCommute ? 0.0 : Number(tr.vma_amount) || 0.0;

    let mileageCost = 0.0;
    if (tr.expense_type === "PersonalCar" || isCommute) {
      mileageCost = Number((dist * rate).toFixed(2));
    }

    let directTicketCost = 0.0;
    if (tr.calculated_travel_cost !== undefined && tr.calculated_travel_cost !== null) {
      directTicketCost = Number(tr.calculated_travel_cost);
    } else if (tr.ticket_cost && tr.expense_type !== "PersonalCar") {
      directTicketCost = Number(tr.ticket_cost);
    }

    const baseTravelCost = Number((mileageCost + directTicketCost).toFixed(2));
    const otherCost = (Number(tr.hotel_cost) || 0.0) + (Number(tr.parking_cost) || 0.0);

    const trExpenses = tripExpensesResults.filter((e) => e.trip_id === tr.id);
    const trExpensesNet = trExpenses.reduce((s, e) => s + (Number(e.amount_net) || 0), 0);
    const trExpensesTax = trExpenses.reduce((s, e) => s + (Number(e.tax_amount) || 0), 0);
    const trExpensesGross = trExpenses.reduce((s, e) => s + (Number(e.amount_gross) || 0), 0);

    const totalCost = Number((baseTravelCost + vma + otherCost + trExpensesNet).toFixed(2));

    const trLegs = tripLegsResults.filter((l) => l.trip_id === tr.id);
    let routeDisplay = "";
    let destDisplay = tr.destination || tr.destination_address || "-";
    let returnLocation = tr.return_location || tr.origin || "-";

    function cleanCity(loc: string) {
      if (!loc) return "";
      return loc.split(",")[0].trim();
    }

    if (trLegs.length > 0) {
      const stops: string[] = [];
      const destCities: string[] = [];
      const firstCity = cleanCity(trLegs[0].start_location);
      const lastCity = cleanCity(trLegs[trLegs.length - 1].destination_location);

      trLegs.forEach((leg, idx) => {
        const sCity = cleanCity(leg.start_location);
        const dCity = cleanCity(leg.destination_location);
        if (idx === 0 && sCity) stops.push(sCity);
        if (dCity && (stops.length === 0 || stops[stops.length - 1] !== dCity)) {
          stops.push(dCity);
        }
        if (dCity && dCity !== firstCity && dCity !== lastCity && !destCities.includes(dCity)) {
          destCities.push(dCity);
        }
      });

      routeDisplay = stops.join(" ➔ ");
      if (destCities.length > 0) {
        destDisplay = destCities.join(", ");
      } else if (tr.destination && tr.destination !== tr.origin) {
        destDisplay = tr.destination;
      }
      returnLocation = trLegs[trLegs.length - 1].destination_location || tr.origin;
    } else if (tr.is_round_trip || tr.travel_type === "BusinessTrip") {
      const orig = (tr.origin || "").trim();
      const dst = (tr.destination || tr.destination_address || "").trim();
      if (dst && dst !== orig) {
        routeDisplay = `${orig} ➔ ${dst} ➔ ${orig}`;
        destDisplay = dst;
      } else {
        routeDisplay = orig ? `${orig} (Rundfahrt)` : "-";
      }
    } else {
      routeDisplay = `${tr.origin} ➔ ${tr.destination || "-"}`;
    }

    if (isCommute) {
      commuteTripCount++;
      commuteTripKm += dist;
      commuteTripCost += baseTravelCost;
    } else {
      businessTripCount++;
      if (tr.expense_type === "PersonalCar") {
        businessTripKm += dist;
      }
      businessTripMileageCost += mileageCost;
      businessTripVma += vma;
    }

    return {
      id: tr.id,
      trip_date: tr.trip_date,
      return_date: tr.return_date || tr.trip_date,
      is_commute: isCommute,
      travel_type: isCommute ? "PermanentWorkplace" : "BusinessTrip",
      travel_type_label: isCommute
        ? "Erste Betriebsstätte (Pendler)"
        : "Auswärtstätigkeit / Dienstreise",
      customer_name: tr.customer_name || "-",
      project_name: tr.project_name || "-",
      project_number: tr.project_number || "-",
      purpose: tr.purpose || "-",
      origin: tr.origin || tr.origin_location || "-",
      destination: destDisplay,
      return_location: returnLocation,
      route_display: routeDisplay,
      legs_count: trLegs.length,
      legs: trLegs.map((l) => ({
        id: l.id,
        leg_order: l.leg_order,
        date_leg: l.date_leg,
        start_location: l.start_location,
        destination_location: l.destination_location,
        transport_type: l.transport_type,
        distance_km: l.distance_km,
        rate_per_km: l.rate_per_km,
        travel_cost_net: l.travel_cost_net,
        layover_hours: l.layover_hours,
        layover_purpose: l.layover_purpose,
      })),
      distance_km: dist,
      rate_per_km: rate,
      travel_cost: baseTravelCost,
      vma_amount: vma,
      other_cost: otherCost,
      expenses_net: Number(trExpensesNet.toFixed(2)),
      expenses_tax: Number(trExpensesTax.toFixed(2)),
      expenses_gross: Number(trExpensesGross.toFixed(2)),
      expenses_count: trExpenses.length,
      total_cost: totalCost,
      expense_type: tr.expense_type || "PersonalCar",
    };
  });

  if (businessTripVma > 0) {
    categoryBuckets.TravelVma.count = businessTripCount;
    categoryBuckets.TravelVma.net = Number(businessTripVma.toFixed(2));
    categoryBuckets.TravelVma.deductible_net = Number(businessTripVma.toFixed(2));
    categoryBuckets.TravelVma.gross = Number(businessTripVma.toFixed(2));
  }
  if (businessTripMileageCost > 0) {
    categoryBuckets.TravelMileage.count = businessTripCount;
    categoryBuckets.TravelMileage.net = Number(businessTripMileageCost.toFixed(2));
    categoryBuckets.TravelMileage.deductible_net = Number(businessTripMileageCost.toFixed(2));
    categoryBuckets.TravelMileage.gross = Number(businessTripMileageCost.toFixed(2));
  }
  if (commuteTripCost > 0) {
    categoryBuckets.CommuteExpense.count = commuteTripCount;
    categoryBuckets.CommuteExpense.net = Number(commuteTripCost.toFixed(2));
    categoryBuckets.CommuteExpense.deductible_net = Number(commuteTripCost.toFixed(2));
    categoryBuckets.CommuteExpense.gross = Number(commuteTripCost.toFixed(2));
  }

  const totalTravelDeductible = Number(
    (
      businessTripMileageCost +
      businessTripVma +
      commuteTripCost +
      totalTripExpensesNet
    ).toFixed(2)
  );
  const totalExpensesDeductible = Number(
    (totalVouchersDeductibleNet + totalTravelDeductible).toFixed(2)
  );
  const totalInputTax = Number((totalVouchersTax + totalTripExpensesTax).toFixed(2));
  const vatBalance = Number((totalRevenueTax - totalInputTax).toFixed(2));
  const preliminaryProfitEuer = Number((totalRevenueNet - totalExpensesDeductible).toFixed(2));

  return jsonResponse({
    success: true,
    period: {
      year,
      month,
      dateFrom: dateFrom || null,
      dateTo: dateTo || null,
    },
    tax_mode: taxMode,
    totals: {
      revenue_net: Number(totalRevenueNet.toFixed(2)),
      revenue_tax: Number(totalRevenueTax.toFixed(2)),
      revenue_gross: Number((totalRevenueNet + totalRevenueTax).toFixed(2)),
      elster_kz_81_base: Number(totalRevenueNet.toFixed(2)),
      elster_kz_81_tax: Number(totalRevenueTax.toFixed(2)),
      elster_kz_66_input_tax: totalInputTax,
      input_tax_19: Number(inputTax19.toFixed(2)),
      input_tax_7: Number(inputTax7.toFixed(2)),
      vat_balance: vatBalance,
      business_trip_count: businessTripCount,
      business_trip_km: businessTripKm,
      business_trip_cost: Number((businessTripMileageCost + totalTripExpensesNet).toFixed(2)),
      business_trip_vma: Number(businessTripVma.toFixed(2)),
      business_trip_total: Number(
        (businessTripMileageCost + businessTripVma + totalTripExpensesNet).toFixed(2)
      ),
      commute_trip_count: commuteTripCount,
      commute_trip_km: commuteTripKm,
      commute_trip_cost: Number(commuteTripCost.toFixed(2)),
      travel_total_deductible: totalTravelDeductible,
      vouchers_net: Number(totalVouchersNet.toFixed(2)),
      vouchers_deductible_net: Number(totalVouchersDeductibleNet.toFixed(2)),
      vouchers_non_deductible_net: Number(totalVouchersNonDeductibleNet.toFixed(2)),
      vouchers_gross: Number(totalVouchersGross.toFixed(2)),
      total_expenses_deductible: totalExpensesDeductible,
      preliminary_profit_euer: preliminaryProfitEuer,
    },
    categories: categoryBuckets,
    timesheets: timesheetList,
    vouchers: voucherList,
    trips: tripsList,
    trip_expenses: tripExpensesResults.map((e) => ({
      id: e.id,
      trip_id: e.trip_id,
      expense_date: e.expense_date,
      category: e.category,
      description: e.description,
      skr04_account: e.skr04_account,
      amount_net: Number(e.amount_net) || 0.0,
      tax_rate: Number(e.tax_rate) || 0,
      tax_amount: Number(e.tax_amount) || 0.0,
      amount_gross: Number(e.amount_gross) || 0.0,
      receipt_filename: e.receipt_filename || null,
      is_billable_to_client: e.is_billable_to_client === 1,
    })),
  });
}

export async function exportDatevExtf(request: Request, env: Env): Promise<Response> {
  await ensureSettings(env);
  const body = ((await request.json()) as any) || {};
  const { customerId, projectId, year, month } = body;

  const settings =
    (await env.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first<any>()) || {};
  const chart = settings.chart_of_accounts || "SKR04";
  const isSkr03 = chart === "SKR03";
  const isSmallBiz = settings.tax_mode === "small_business";
  const consultantNum = settings.datev_consultant_number || "1001";
  const clientNum = settings.datev_client_number || "10001";

  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.external_invoice_number, tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams: any[] = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC";

  let stmt = env.DB.prepare(timeSql);
  if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all<any>();

  let expSql = `
    SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
           p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.lexware_invoice_number, tv.external_invoice_number
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
  `;
  const expParams: any[] = [];
  if (customerId && customerId !== "all") {
    expSql += " AND p.customer_id = ?";
    expParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    expSql += " AND tr.project_id = ?";
    expParams.push(projectId);
  }
  if (year && year !== "all") {
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${year}%`, `${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${mFilter}%`, `${mFilter}%`);
  }
  expSql += " ORDER BY te.expense_date ASC";

  let expStmt = env.DB.prepare(expSql);
  if (expParams.length > 0) expStmt = expStmt.bind(...expParams);
  const { results: expenses } = await expStmt.all<any>();

  const now = new Date();
  const yyyymmdd = now.toISOString().replace(/[-:T]/g, "").substring(0, 14);
  const curYear = year && year !== "all" ? year : now.getFullYear().toString();
  const yearStart = `${curYear}0101`;
  const periodStart =
    year && month && year !== "all" && month !== "all"
      ? `${year}${month.padStart(2, "0")}01`
      : `${curYear}0101`;
  const periodEnd =
    year && month && year !== "all" && month !== "all"
      ? `${year}${month.padStart(2, "0")}28`
      : `${curYear}1231`;

  let datevCsv = `"EXTF";700;21;"Buchungsstapel";12;${yyyymmdd}000;"";"";"";"";${consultantNum};${clientNum};${yearStart};4;${periodStart};${periodEnd};"Evidence Hub DATEV Export";"MK";1;;;"EUR";;;;\n`;
  datevCsv += `"Umsatz (ohne Soll/Haben-Kz)";"Soll/Haben-Kennzeichen";"WKZ Umsatz";"Kurs";"Basis-Umsatz";"WKZ Basis-Umsatz";"Konto";"Gegenkonto (ohne BU-Schlüssel)";"BU-Schlüssel";"Belegdatum";"Belegfeld 1";"Belegfeld 2";"Skonto";"Buchungstext"\n`;

  const fmtAmt = (num: number) => num.toFixed(2).replace(".", ",");
  const fmtDate = (dStr: string) => {
    if (!dStr) return "";
    const clean = dStr.substring(0, 10).replace(/-/g, "");
    return clean.length === 8 ? `${clean.substring(6, 8)}${clean.substring(4, 6)}` : "";
  };
  const sanitize = (s: any) => `"${String(s || "").replace(/"/g, '""').substring(0, 60)}"`;

  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;
    if (totalNet <= 0) continue;

    const kontoErlös = isSmallBiz ? (isSkr03 ? "8195" : "4185") : isSkr03 ? "8400" : "4400";
    const debitor = t.customer_number || (isSkr03 ? "10000" : "10000");
    const invNum =
      t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;
    const txt = `${t.customer_name || "Kunde"}: ${t.project_name || "Projekt"}`;

    datevCsv += `${fmtAmt(totalNet)};"S";"EUR";"";"";"";"${debitor}";"${kontoErlös}";"";"${fmtDate(t.entry_date)}";${sanitize(invNum)};"";"";${sanitize(txt)}\n`;
  }

  for (const exp of expenses || []) {
    const gross = exp.amount_gross || 0;
    if (gross <= 0) continue;

    let aufwandKonto = isSkr03 ? "4670" : "6670";
    if (exp.category === "HotelLogis") aufwandKonto = isSkr03 ? "4670" : "6670";
    else if (exp.category === "TransitLocal" || exp.category === "TrainLongDistance")
      aufwandKonto = isSkr03 ? "4673" : "6673";

    const gegenKonto = isSkr03 ? "1200" : "1800";
    const voucherNum = `EXP-${exp.id ? exp.id.substring(0, 6).toUpperCase() : "BELEG"}`;
    const txt = `${exp.category}: ${exp.description || exp.trip_purpose || "Reisebeleg"}`;

    datevCsv += `${fmtAmt(gross)};"S";"EUR";"";"";"";"${aufwandKonto}";"${gegenKonto}";"";"${fmtDate(exp.expense_date || exp.trip_date)}";${sanitize(voucherNum)};"";"";${sanitize(txt)}\n`;
  }

  const filename = `DATEV_EXTF700_Buchungsstapel_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response("\uFEFF" + datevCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function exportLexwareCsv(request: Request, env: Env): Promise<Response> {
  await ensureSettings(env);
  const body = ((await request.json()) as any) || {};
  const { customerId, projectId, year, month } = body;

  const settings =
    (await env.DB.prepare(
      "SELECT * FROM app_settings WHERE id = 'global_config'"
    ).first<any>()) || {};
  const isSmallBiz = settings.tax_mode === "small_business";

  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.external_invoice_number, tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams: any[] = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC";

  let stmt = env.DB.prepare(timeSql);
  if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all<any>();

  let expSql = `
    SELECT te.*, tr.trip_date, tr.purpose as trip_purpose,
           p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.lexware_invoice_number, tv.external_invoice_number
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE (te.is_voucher_canceled = 0 OR te.is_voucher_canceled IS NULL)
  `;
  const expParams: any[] = [];
  if (customerId && customerId !== "all") {
    expSql += " AND p.customer_id = ?";
    expParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    expSql += " AND tr.project_id = ?";
    expParams.push(projectId);
  }
  if (year && year !== "all") {
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${year}%`, `${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    expSql += " AND (te.expense_date LIKE ? OR tr.trip_date LIKE ?)";
    expParams.push(`${mFilter}%`, `${mFilter}%`);
  }
  expSql += " ORDER BY te.expense_date ASC";

  let expStmt = env.DB.prepare(expSql);
  if (expParams.length > 0) expStmt = expStmt.bind(...expParams);
  const { results: expenses } = await expStmt.all<any>();

  let lexwareCsv = "\uFEFF";
  lexwareCsv +=
    "Belegart;Belegdatum;Belegnummer;Kunde_Lieferant;Kategorie_Konto;Nettobetrag;Steuersatz;Umsatzsteuer;Bruttobetrag;Zahlungsstatus;Beschreibung;GoBD_Hash\n";

  const sanitize = (s: any) =>
    `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;
    if (totalNet <= 0) continue;

    const taxRate = isSmallBiz ? 0 : 19;
    const taxAmt = isSmallBiz ? 0 : totalNet * 0.19;
    const totalGross = totalNet + taxAmt;
    const invNum =
      t.lexware_invoice_number || t.external_invoice_number || `TS-${t.period || "2026"}`;

    lexwareCsv +=
      [
        "Einnahme",
        sanitize(t.entry_date),
        sanitize(invNum),
        sanitize(t.customer_name),
        isSmallBiz ? "Erlöse Kleinunternehmer § 19 UStG" : "Erlöse Dienstleistungen 19%",
        totalNet.toFixed(2).replace(".", ","),
        `${taxRate}%`,
        taxAmt.toFixed(2).replace(".", ","),
        totalGross.toFixed(2).replace(".", ","),
        "Offen",
        sanitize(`Stundenabrechnung ${t.project_name}: ${t.short_description || ""}`),
        sanitize(t.data_hash_sha256 || ""),
      ].join(";") + "\n";
  }

  for (const exp of expenses || []) {
    const gross = exp.amount_gross || 0;
    const net = exp.amount_net || gross;
    const taxAmt = exp.tax_amount || gross - net;
    const taxRate = exp.tax_rate !== undefined ? exp.tax_rate : 19;
    const voucherNum = `EXP-${exp.id ? exp.id.substring(0, 8).toUpperCase() : "REISE"}`;

    lexwareCsv +=
      [
        "Ausgabe",
        sanitize(exp.expense_date || exp.trip_date),
        sanitize(voucherNum),
        sanitize(exp.customer_name || "Lieferant"),
        sanitize(exp.category || "Reisekosten"),
        net.toFixed(2).replace(".", ","),
        `${taxRate}%`,
        taxAmt.toFixed(2).replace(".", ","),
        gross.toFixed(2).replace(".", ","),
        "Bezahlt",
        sanitize(`${exp.category}: ${exp.description || exp.trip_purpose || ""}`),
        "",
      ].join(";") + "\n";
  }

  const filename = `Lexware_Offline_Belege_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response(lexwareCsv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function exportAccountingData(request: Request, env: Env): Promise<Response> {
  const body = ((await request.json()) as any) || {};
  const { customerId, projectId, year, month, format = "csv" } = body;

  let timeSql = `
    SELECT t.*, p.name as project_name, p.project_number, p.default_hourly_rate,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.data_hash_sha256
    FROM time_entries t
    JOIN projects p ON t.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const timeParams: any[] = [];
  if (customerId && customerId !== "all") {
    timeSql += " AND p.customer_id = ?";
    timeParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    timeSql += " AND t.project_id = ?";
    timeParams.push(projectId);
  }
  if (year && year !== "all") {
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    timeSql += " AND t.entry_date LIKE ?";
    timeParams.push(`${mFilter}%`);
  }
  timeSql += " ORDER BY t.entry_date ASC, t.start_time ASC";

  let stmt = env.DB.prepare(timeSql);
  if (timeParams.length > 0) stmt = stmt.bind(...timeParams);
  const { results: timeEntries } = await stmt.all<any>();

  let tripSql = `
    SELECT tr.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number,
           tv.period, tv.status as timesheet_status, tv.lexware_invoice_number,
           tv.data_hash_sha256
    FROM trips tr
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
    WHERE 1=1
  `;
  const tripParams: any[] = [];
  if (customerId && customerId !== "all") {
    tripSql += " AND p.customer_id = ?";
    tripParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tripSql += " AND tr.project_id = ?";
    tripParams.push(projectId);
  }
  if (year && year !== "all") {
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tripSql += " AND tr.trip_date LIKE ?";
    tripParams.push(`${mFilter}%`);
  }
  tripSql += " ORDER BY tr.trip_date ASC";

  let tripStmt = env.DB.prepare(tripSql);
  if (tripParams.length > 0) tripStmt = tripStmt.bind(...tripParams);
  const { results: trips } = await tripStmt.all<any>();

  if (format === "json") {
    return jsonResponse({
      success: true,
      filter: { customerId, projectId, year, month },
      exportedAt: new Date().toISOString(),
      timeEntries: timeEntries || [],
      trips: trips || [],
    });
  }

  let csv = "\uFEFF";
  csv +=
    "Belegtyp;Buchungsdatum;Kunde;Kundennummer;Projekt;Projektnummer;Tätigkeit / Reisezweck;Stunden;Stundensatz (Netto);Reisekosten (Netto);Gesamtbetrag (Netto);Abrechenbar;Abrechnungsmonat;Status (GoBD);Lexware-Rechnungsnr;GoBD-Hash\n";

  const sanitize = (s: any) =>
    `"${String(s || "").replace(/"/g, '""').replace(/\r?\n/g, " ")}"`;

  for (const t of timeEntries || []) {
    const rate = t.billing_rate_snapshot || t.default_hourly_rate || 0;
    const hours = t.billable_duration_hours || 0;
    const totalNet = hours * rate;

    csv +=
      [
        "ZEITERFASSUNG",
        sanitize(t.entry_date),
        sanitize(t.customer_name),
        sanitize(t.customer_number || ""),
        sanitize(t.project_name),
        sanitize(t.project_number),
        sanitize(t.short_description || ""),
        hours.toFixed(2).replace(".", ","),
        rate.toFixed(2).replace(".", ","),
        "0,00",
        totalNet.toFixed(2).replace(".", ","),
        t.is_billable ? "JA" : "NEIN",
        sanitize(t.period || ""),
        sanitize(t.timesheet_status || "Offen"),
        sanitize(t.lexware_invoice_number || ""),
        sanitize(t.data_hash_sha256 || ""),
      ].join(";") + "\n";
  }

  for (const tr of trips || []) {
    const travelCost =
      tr.customer_reimbursable_cost ||
      tr.distance_km * tr.rate_per_km ||
      tr.total_actual_cost ||
      0;

    csv +=
      [
        "REISEKOSTEN",
        sanitize(tr.trip_date),
        sanitize(tr.customer_name),
        sanitize(tr.customer_number || ""),
        sanitize(tr.project_name),
        sanitize(tr.project_number),
        sanitize(
          tr.purpose +
            (tr.origin_location ? ` (${tr.origin_location} -> ${tr.destination_location})` : "")
        ),
        "0,00",
        "0,00",
        travelCost.toFixed(2).replace(".", ","),
        travelCost.toFixed(2).replace(".", ","),
        "JA",
        sanitize(tr.period || ""),
        sanitize(tr.timesheet_status || "Offen"),
        sanitize(tr.lexware_invoice_number || ""),
        sanitize(tr.data_hash_sha256 || ""),
      ].join(";") + "\n";
  }

  const filename = `Buchungsjournal_${year || "ALL"}_${month || "ALL"}.csv`;
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function exportTimesheetManifest(
  request: Request,
  env: Env
): Promise<Response> {
  const body = ((await request.json()) as any) || {};
  const { customerId, projectId, year, month } = body;

  let sql = `
    SELECT tv.*, p.name as project_name, p.project_number,
           c.name as customer_name, c.customer_number
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE 1=1
  `;
  const params: any[] = [];
  if (customerId && customerId !== "all") {
    sql += " AND p.customer_id = ?";
    params.push(customerId);
  }
  if (projectId && projectId !== "all") {
    sql += " AND tv.project_id = ?";
    params.push(projectId);
  }
  if (year && year !== "all") {
    sql += " AND tv.period LIKE ?";
    params.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    sql += " AND tv.period LIKE ?";
    params.push(`${mFilter}%`);
  }
  sql += " ORDER BY tv.period DESC, tv.created_at_utc DESC";

  let stmt = env.DB.prepare(sql);
  if (params.length > 0) stmt = stmt.bind(...params);
  const { results } = await stmt.all<any>();

  return jsonResponse({
    success: true,
    timesheets: results || [],
  });
}

export async function exportTaxReceiptsManifest(
  request: Request,
  env: Env
): Promise<Response> {
  const body = ((await request.json()) as any) || {};
  const { customerId, projectId, year, month } = body;

  let sql = `
    SELECT te.id, te.receipt_filename as original_filename, te.receipt_r2_key as r2_key,
           te.amount_gross, te.amount_net, te.tax_rate as vat_rate, te.expense_date,
           te.created_at_utc as uploaded_at_utc,
           te.description, te.category,
           p.name as project_name, p.project_number,
           c.name as customer_name
    FROM trip_expenses te
    JOIN trips tr ON te.trip_id = tr.id
    JOIN projects p ON tr.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE te.receipt_r2_key IS NOT NULL
  `;
  const params: any[] = [];
  if (customerId && customerId !== "all") {
    sql += " AND p.customer_id = ?";
    params.push(customerId);
  }
  if (projectId && projectId !== "all") {
    sql += " AND tr.project_id = ?";
    params.push(projectId);
  }
  if (year && year !== "all") {
    sql += " AND te.expense_date LIKE ?";
    params.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    sql += " AND te.expense_date LIKE ?";
    params.push(`${mFilter}%`);
  }

  let stmt = env.DB.prepare(sql);
  if (params.length > 0) stmt = stmt.bind(...params);
  const { results: tripReceipts } = await stmt.all<any>();

  let operationalReceipts: any[] = [];
  try {
    let opSql = `
      SELECT ov.id, ov.receipt_filename as original_filename, ov.receipt_r2_key as r2_key,
             ov.amount_gross, ov.amount_net, ov.tax_rate as vat_rate, ov.voucher_date as expense_date,
             ov.created_at_utc as uploaded_at_utc,
             ov.description, ov.voucher_type as category,
             p.name as project_name, p.project_number,
             c.name as customer_name
      FROM operational_vouchers ov
      LEFT JOIN projects p ON ov.project_id = p.id
      LEFT JOIN customers c ON ov.customer_id = c.id
      WHERE ov.receipt_r2_key IS NOT NULL
    `;
    const opParams: any[] = [];
    if (customerId && customerId !== "all") {
      opSql += " AND ov.customer_id = ?";
      opParams.push(customerId);
    }
    if (projectId && projectId !== "all") {
      opSql += " AND ov.project_id = ?";
      opParams.push(projectId);
    }
    if (year && year !== "all") {
      opSql += " AND ov.voucher_date LIKE ?";
      opParams.push(`${year}%`);
    }
    if (month && month !== "all") {
      const mFilter =
        year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
      opSql += " AND ov.voucher_date LIKE ?";
      opParams.push(`${mFilter}%`);
    }

    let opStmt = env.DB.prepare(opSql);
    if (opParams.length > 0) opStmt = opStmt.bind(...opParams);
    const { results: opResults } = await opStmt.all<any>();
    operationalReceipts = opResults || [];
  } catch {}

  const receipts = [...(tripReceipts || []), ...operationalReceipts];

  let tsSql = `
    SELECT tv.id, tv.period, tv.version_number, tv.signed_document_r2_key, tv.signed_document_filename,
           p.name as project_name, p.project_number,
           c.name as customer_name
    FROM timesheet_versions tv
    JOIN projects p ON tv.project_id = p.id
    JOIN customers c ON p.customer_id = c.id
    WHERE tv.signed_document_r2_key IS NOT NULL
  `;
  const tsParams: any[] = [];
  if (customerId && customerId !== "all") {
    tsSql += " AND p.customer_id = ?";
    tsParams.push(customerId);
  }
  if (projectId && projectId !== "all") {
    tsSql += " AND tv.project_id = ?";
    tsParams.push(projectId);
  }
  if (year && year !== "all") {
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${year}%`);
  }
  if (month && month !== "all") {
    const mFilter =
      year && year !== "all" ? `${year}-${month.padStart(2, "0")}` : `____-${month.padStart(2, "0")}`;
    tsSql += " AND tv.period LIKE ?";
    tsParams.push(`${mFilter}%`);
  }

  let tsStmt = env.DB.prepare(tsSql);
  if (tsParams.length > 0) tsStmt = tsStmt.bind(...tsParams);
  const { results: signedDocs } = await tsStmt.all<any>();

  return jsonResponse({
    success: true,
    receipts,
    signedDocs: signedDocs || [],
  });
}

export async function downloadReceiptFile(
  id: string,
  env: Env
): Promise<Response> {
  const storage = documentStorage(env);
  if (!storage) {
    return errorResponse("Object Storage nicht konfiguriert", 500);
  }

  let r2Key: string | null = null;
  let filename = "beleg.pdf";
  let mimeType = "application/pdf";

  // 1. Suche in trip_expenses
  try {
    const exp = await env.DB.prepare(
      "SELECT receipt_r2_key, receipt_filename, receipt_mime_type FROM trip_expenses WHERE id = ?"
    )
      .bind(id)
      .first<any>();
    if (exp && exp.receipt_r2_key) {
      r2Key = exp.receipt_r2_key;
      filename = exp.receipt_filename || filename;
      mimeType = exp.receipt_mime_type || mimeType;
    }
  } catch {}

  // 2. Suche in operational_vouchers
  if (!r2Key) {
    try {
      const v = await env.DB.prepare(
        "SELECT receipt_r2_key, receipt_filename, receipt_mime_type, payment_slip_r2_key, payment_slip_filename FROM operational_vouchers WHERE id = ?"
      )
        .bind(id)
        .first<any>();
      if (v) {
        if (v.receipt_r2_key) {
          r2Key = v.receipt_r2_key;
          filename = v.receipt_filename || filename;
          mimeType = v.receipt_mime_type || mimeType;
        } else if (v.payment_slip_r2_key) {
          r2Key = v.payment_slip_r2_key;
          filename = v.payment_slip_filename || filename;
        }
      }
    } catch {}
  }

  // 3. Fallback: Falls id selbst ein R2-Key oder Dateipfad ist
  if (!r2Key && (id.includes("/") || id.startsWith("rec_") || id.startsWith("vouchers/"))) {
    r2Key = id;
  }

  if (!r2Key) {
    return errorResponse("Beleg-Referenz für ID '" + id + "' nicht gefunden.", 404);
  }

  // 4. Objekt aus R2 laden
  let obj = await storage.get(r2Key);

  if (!obj) {
    return errorResponse("Belegdatei nicht im Object Storage (R2) vorhanden.", 404);
  }

  const headers = new Headers();
  obj.writeHttpMetadata(headers);
  headers.set("Access-Control-Allow-Origin", "*");
  if (!headers.get("Content-Type")) {
    headers.set("Content-Type", mimeType);
  }
  const cleanFilename = filename.replace(/[^\w.-]/g, "_");
  headers.set("Content-Disposition", `attachment; filename="${cleanFilename}"`);

  return new Response(obj.body, { headers });
}
