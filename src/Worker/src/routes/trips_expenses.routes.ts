import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { ensureTripExpenses } from "../services/db_bootstrap.service";
import {
  fetchLexwareWithRetry,
  getEffectiveLexwareApiKey,
  getEffectiveLexwareOwnVendorId,
  unlinkExpenseFromLexware,
} from "../services/lexware.service";

export async function handleTripsExpensesRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

  // 6g. Spesenbeleg-Entkopplung
  const expenseUnlinkMatch = path.match(
    /^\/api\/v1\/expenses\/([a-zA-Z0-9_-]+)\/unlink-lexware$/
  );
  if (expenseUnlinkMatch && method === "POST") {
    return unlinkExpenseFromLexware(expenseUnlinkMatch[1], env);
  }

  // 8b. Beleg-Upload für Reisekosten & Spesen (R2 Object Storage)
  if (path === "/api/v1/trips/upload-receipt" && method === "POST") {
    try {
      const formData = await request.formData();
      const file = formData.get("file") as unknown as File;
      if (!file) return errorResponse("Keine Datei übermittelt", 400);

      const fileId = crypto.randomUUID();
      const filename = file.name || "receipt.pdf";
      const mimeType = file.type || "application/octet-stream";
      const periodFolder = new Date().toISOString().substring(0, 7);
      const cleanName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
      const r2Key = `receipts/${periodFolder}/${fileId}_${cleanName}`;

      const arrayBuffer = await file.arrayBuffer();
      if (env.STORAGE) {
        await env.STORAGE.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: mimeType },
        });
      }

      return jsonResponse({
        success: true,
        r2Key,
        filename,
        mimeType,
        size: file.size,
        message: "Beleg erfolgreich hochgeladen und revisionssicher gespeichert.",
      });
    } catch (err: any) {
      return errorResponse("Upload-Fehler: " + err.message, 500);
    }
  }

  // 8c. Beleg-Abruf aus R2
  if (path.startsWith("/api/v1/trips/receipts/") && method === "GET") {
    const r2Key = decodeURIComponent(path.replace("/api/v1/trips/receipts/", ""));
    if (!env.STORAGE) return errorResponse("Object Storage nicht konfiguriert", 500);

    const object = await env.STORAGE.get(r2Key);
    if (!object) return errorResponse("Beleg nicht gefunden", 404);

    const headers = new Headers();
    object.writeHttpMetadata(headers);
    headers.set("etag", object.httpEtag);
    headers.set("Access-Control-Allow-Origin", "*");

    return new Response(object.body, { headers });
  }

  // 8d. Selektiver Lexware-Ausgaben-Sync
  if (path === "/api/v1/trips/sync-expenses-to-lexware" && method === "POST") {
    await ensureTripExpenses(env);
    const body = (await request.json()) as any;
    const expenseIds: string[] = body.expenseIds || [];

    if (!expenseIds || expenseIds.length === 0) {
      return errorResponse("Keine Ausgaben / Belege zum Synchronisieren ausgewählt.", 400);
    }

    if (!env.LEXWARE_API_KEY) {
      return errorResponse(
        "LEXWARE_API_KEY nicht in den Worker-Umgebungsvariablen konfiguriert.",
        500
      );
    }

    let lexwareCategories: any[] = [];
    try {
      const catRes = await fetchLexwareWithRetry(
        "https://api.lexware.io/v1/posting-categories",
        {
          headers: {
            Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
            Accept: "application/json",
          },
        }
      );
      if (catRes.ok) {
        lexwareCategories = (await catRes.json()) as any[];
      }
    } catch (cErr) {
      console.error("Error fetching Lexware posting categories:", cErr);
    }

    let syncedCount = 0;
    const results: any[] = [];

    for (const expId of expenseIds) {
      await new Promise((r) => setTimeout(r, 600));

      const exp = await env.DB.prepare(`
        SELECT te.*, tr.purpose as trip_purpose, tr.project_id, p.name as project_name, c.name as customer_name
        FROM trip_expenses te
        LEFT JOIN trips tr ON te.trip_id = tr.id
        LEFT JOIN projects p ON tr.project_id = p.id
        LEFT JOIN customers c ON p.customer_id = c.id
        WHERE te.id = ?
      `)
        .bind(expId)
        .first<any>();

      if (!exp) continue;

      let matchedCategoryId = null;
      if (lexwareCategories.length > 0) {
        const catName = (exp.category || "").toLowerCase();
        const desc = (exp.description || "").toLowerCase();
        const skr04 = exp.skr04_account || "";

        let match = lexwareCategories.find((c) => {
          const cn = (c.name || "").toLowerCase();
          if (skr04 === "6668" && (cn.includes("übernachtung") || cn.includes("hotel")))
            return true;
          if (
            skr04 === "6663" &&
            (cn.includes("fahrt") ||
              cn.includes("bahn") ||
              cn.includes("öpnv") ||
              cn.includes("fahrkarte"))
          )
            return true;
          if (skr04 === "6670" && (cn.includes("reiseneben") || cn.includes("park") || cn.includes("reise")))
            return true;
          if (
            skr04 === "6880" &&
            (cn.includes("betriebsbedarf") ||
              cn.includes("bürobedarf") ||
              cn.includes("hardware") ||
              cn.includes("werkzeug"))
          )
            return true;
          if (
            skr04 === "6855" &&
            (cn.includes("fachliteratur") || cn.includes("buch") || cn.includes("zeitschrift"))
          )
            return true;
          if (skr04 === "6640" && cn.includes("bewirtung")) return true;
          if (cn.includes("reisekosten") || cn.includes("spesen")) return true;
          return false;
        });

        if (!match) {
          match = lexwareCategories.find(
            (c) =>
              c.type === "outgo" ||
              c.type === "expenditure" ||
              c.name?.toLowerCase().includes("sonstige") ||
              c.name?.toLowerCase().includes("ausgabe")
          );
        }
        if (!match && lexwareCategories.length > 0) {
          match = lexwareCategories[0];
        }
        if (match) {
          matchedCategoryId = match.id;
        }
      }

      try {
        const expDateFormatted = exp.expense_date
          ? exp.expense_date.includes("T")
            ? exp.expense_date
            : `${exp.expense_date}T08:00:00.000+02:00`
          : new Date().toISOString();
        const grossAmount = parseFloat((exp.amount_gross || 0).toFixed(2));
        const taxAmount = parseFloat(
          (
            exp.tax_amount ||
            grossAmount - grossAmount / (1 + (exp.tax_rate || 0) / 100)
          ).toFixed(2)
        );

        const voucherPayload: any = {
          type: "purchaseinvoice",
          voucherNumber: `EXP-${exp.id.substring(0, 8).toUpperCase()}`,
          voucherDate: expDateFormatted,
          totalGrossAmount: grossAmount,
          totalTaxAmount: taxAmount,
          taxType: "gross",
          useCollectiveContact: true,
          remark: `Dienstreise: ${exp.trip_purpose || "Reise"} (${exp.project_name || "Projekt"} / ${exp.customer_name || "Kunde"}) - ${exp.description} [SKR04: ${exp.skr04_account}]`,
          voucherItems: [
            {
              amount: grossAmount,
              taxAmount: taxAmount,
              taxRatePercent: exp.tax_rate !== undefined ? exp.tax_rate : 19.0,
              categoryId: matchedCategoryId,
              description: `${exp.description} [SKR04: ${exp.skr04_account}]`,
            },
          ],
        };

        const voucherRes = await fetchLexwareWithRetry(
          "https://api.lexware.io/v1/vouchers",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify(voucherPayload),
          }
        );

        if (voucherRes.ok) {
          const vData = (await voucherRes.json()) as any;
          const lexVoucherId = vData.id;

          if (exp.receipt_r2_key && env.STORAGE) {
            try {
              await new Promise((r) => setTimeout(r, 600));
              const fileObj = await env.STORAGE.get(exp.receipt_r2_key);
              if (fileObj) {
                const fileBytes = await fileObj.arrayBuffer();
                const uploadForm = new FormData();
                const blob = new Blob([fileBytes], {
                  type: exp.receipt_mime_type || "application/pdf",
                });
                uploadForm.append("file", blob, exp.receipt_filename || "beleg.pdf");

                const attachRes = await fetchLexwareWithRetry(
                  `https://api.lexware.io/v1/vouchers/${lexVoucherId}/files`,
                  {
                    method: "POST",
                    headers: {
                      Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
                      Accept: "application/json",
                    },
                    body: uploadForm,
                  }
                );

                if (!attachRes.ok) {
                  console.warn(
                    "Could not attach file to voucher:",
                    attachRes.status,
                    await attachRes.text()
                  );
                }
              }
            } catch (fileErr: any) {
              console.error("Lexware Voucher File Attach Error:", fileErr?.message || fileErr);
            }
          }

          await env.DB.prepare(`
            UPDATE trip_expenses 
            SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_voucher_number = ?, lexware_status = 'open', is_voucher_canceled = 0 
            WHERE id = ?
          `)
            .bind(lexVoucherId, voucherPayload.voucherNumber, exp.id)
            .run();

          await logAuditEvent(env, {
            eventType: "LEXWARE_EXPENSE_SYNCED",
            entityType: "trip_expense",
            entityId: exp.id,
            actor: "User",
            description: `Beleg '${exp.description}' (${grossAmount.toFixed(2)} € Brutto, SKR04: ${exp.skr04_account}) erfolgreich als Ausgabe in Lexware übertragen (Voucher-ID: ${lexVoucherId}, Nr: ${voucherPayload.voucherNumber}).`,
          });

          syncedCount++;
          results.push({ id: exp.id, success: true, lexwareVoucherId: lexVoucherId });
        } else {
          const errTxt = await voucherRes.text();
          console.error("Lexware Voucher Error:", voucherRes.status, errTxt);
          results.push({ id: exp.id, success: false, error: errTxt });
        }
      } catch (vErr: any) {
        results.push({ id: exp.id, success: false, error: vErr.message });
      }
    }

    return jsonResponse({
      success: true,
      syncedCount,
      totalRequested: expenseIds.length,
      results,
      message: `${syncedCount} von ${expenseIds.length} Belegen erfolgreich als SKR04-Betriebsausgaben an Lexware übermittelt!`,
    });
  }

  // 8x. Verpflegungsmehraufwand (VMA) als Eigenbeleg an Lexware buchen
  const tripVmaSyncMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/(?:sync-vma-to-lexware|sync-vma-lexware)$/
  );
  if (tripVmaSyncMatch && method === "POST") {
    await ensureTripExpenses(env);
    const tripId = tripVmaSyncMatch[1];
    const tr = await env.DB.prepare(`
      SELECT tr.*, 
             p.name as project_name, p.project_number, 
             c.name as customer_name
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE tr.id = ?
    `)
      .bind(tripId)
      .first<any>();

    if (!tr) return errorResponse("Reise nicht gefunden", 404);

    const vmaAmount = parseFloat((tr.vma_amount || 0).toFixed(2));
    if (vmaAmount <= 0) {
      return errorResponse(
        "Für diese Reise ist kein Verpflegungsmehraufwand (VMA = 0,00 €) berechnet.",
        400
      );
    }

    const apiKey = await getEffectiveLexwareApiKey(env, request);
    if (!apiKey) return errorResponse("Kein LEXWARE_API_KEY konfiguriert.", 400);

    const ownVendorId = await getEffectiveLexwareOwnVendorId(env, apiKey);

    let lexwareCategories: any[] = [];
    try {
      const catRes = await fetchLexwareWithRetry(
        "https://api.lexware.io/v1/posting-categories",
        {
          headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
        }
      );
      if (catRes.ok) lexwareCategories = (await catRes.json()) as any[];
    } catch {}

    let matchedCategoryId = null;
    if (lexwareCategories.length > 0) {
      let match = lexwareCategories.find((c) => {
        const cn = (c.name || "").toLowerCase();
        return (
          cn.includes("verpflegung") ||
          cn.includes("mehraufwand") ||
          cn.includes("tagegeld") ||
          cn.includes("spesen")
        );
      });
      if (!match) {
        match = lexwareCategories.find((c) => {
          const cn = (c.name || "").toLowerCase();
          return cn.includes("reisekosten") || cn.includes("sonstige");
        });
      }
      if (match) matchedCategoryId = match.id;
      else matchedCategoryId = lexwareCategories[0]?.id;
    }

    const voucherNum = `VMA-${tr.id.substring(0, 8).toUpperCase()}`;
    const tripDateIso = tr.trip_date
      ? tr.trip_date.includes("T")
        ? tr.trip_date
        : `${tr.trip_date}T08:00:00.000+02:00`
      : new Date().toISOString();

    const custProjStr =
      tr.customer_name || tr.project_name
        ? `${tr.customer_name || ""}${tr.project_name ? " (" + tr.project_name + ")" : ""}`
        : "Interne Dienstreise (MCT / Fortbildung)";

    const vmaPayload: any = {
      type: "purchaseinvoice",
      voucherNumber: voucherNum,
      voucherDate: tripDateIso,
      totalGrossAmount: vmaAmount,
      totalTaxAmount: 0.0,
      taxType: "gross",
      useCollectiveContact: ownVendorId ? false : true,
      remark: `Eigenbeleg Verpflegungsmehraufwand (§ 9 Abs. 4a EStG): ${tr.purpose || "Dienstreise"} (${tr.trip_date} bis ${tr.return_date || tr.trip_date}, ${tr.total_days || 1} Tage) - ${custProjStr}`,
      voucherItems: [
        {
          amount: vmaAmount,
          taxAmount: 0.0,
          taxRatePercent: 0,
          categoryId: matchedCategoryId,
          description: `Verpflegungsmehraufwand gem. § 9 Abs. 4a EStG [SKR04: 6673] (${tr.total_days || 1} Tage, Pauschale ${vmaAmount.toFixed(2)} €)`,
        },
      ],
    };

    if (ownVendorId) {
      vmaPayload.contactId = ownVendorId;
    }

    try {
      await new Promise((r) => setTimeout(r, 600));

      const vRes = await fetchLexwareWithRetry("https://api.lexware.io/v1/vouchers", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(vmaPayload),
      });

      if (!vRes.ok) {
        const errTxt = await vRes.text();
        if (vRes.status === 429) {
          return errorResponse(
            "Lexware API Rate-Limit erreicht (max. 2 Anfragen/Sekunde). Bitte warten Sie ca. 5 Sekunden und versuchen Sie es erneut.",
            429
          );
        }
        return errorResponse(`Lexware API Fehler (${vRes.status}): ${errTxt}`, 400);
      }

      const vData = (await vRes.json()) as any;
      const lexVoucherId = vData.id;

      try {
        await new Promise((r) => setTimeout(r, 600));

        const docContent = [
          "=======================================================",
          "EIGENBELEG: VERPFLEGUNGSMEHRAUFWAND (gem. § 9 Abs. 4a EStG)",
          "=======================================================",
          `Reise-ID: ${tr.id}`,
          `Voucher-Nummer: ${voucherNum}`,
          `Reisezweck / Anlass: ${tr.purpose || "Geschäftstermin"}`,
          `Kunde / Projekt: ${custProjStr}`,
          `Reisezeitraum: ${tr.trip_date} (${tr.departure_time || "07:30"} Uhr) bis ${tr.return_date || tr.trip_date} (${tr.arrival_time || "19:30"} Uhr)`,
          `Reisedauer: ${tr.total_days || 1} Tag(e)`,
          `Frühstück gestellt: ${tr.has_breakfast ? "Ja (-5,60 € je Übernachtung gem. EStG gekürzt)" : "Nein"}`,
          `Auszahlungsbetrag / Betriebsausgabe: ${vmaAmount.toFixed(2)} EUR`,
          "Steuerstatus: Steuerfreie Betriebsausgabe (0% USt)",
          "Buchungskonto: SKR04: 6673 / SKR03: 4673",
          `Erstellt am: ${new Date().toLocaleString("de-DE")}`,
          "=======================================================",
        ].join("\n");

        const uploadForm = new FormData();
        const blob = new Blob([docContent], { type: "text/plain;charset=utf-8" });
        uploadForm.append("file", blob, `Eigenbeleg_VMA_${voucherNum}.txt`);

        await fetchLexwareWithRetry(
          `https://api.lexware.io/v1/vouchers/${lexVoucherId}/files`,
          {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
            body: uploadForm,
          }
        );
      } catch {}

      await env.DB.prepare(`
        UPDATE trips
        SET lexware_vma_voucher_id = ?,
            lexware_vma_voucher_number = ?,
            status = 'Completed'
        WHERE id = ?
      `)
        .bind(lexVoucherId, voucherNum, tripId)
        .run();

      await logAuditEvent(env, {
        eventType: "LEXWARE_VMA_SYNCED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Verpflegungsmehraufwand (${vmaAmount.toFixed(2)} €) erfolgreich als Eigenbeleg an Lexware übermittelt (Voucher-Nr: ${voucherNum}).`,
      });

      return jsonResponse({
        success: true,
        message: `Verpflegungsmehraufwand (${vmaAmount.toFixed(2)} €) erfolgreich als Eigenbeleg an Lexware übermittelt!`,
        lexwareVoucherId: lexVoucherId,
        voucherNumber: voucherNum,
      });
    } catch (err: any) {
      return errorResponse(`Fehler bei VMA-Übertragung: ${err.message}`, 500);
    }
  }

  // 8e. Reisekosten erfassen
  if (path === "/api/v1/trips" && method === "POST") {
    await ensureTripExpenses(env);
    const body = (await request.json()) as any;
    const tripId = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    let project = null;
    if (body.projectId) {
      project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
        .bind(body.projectId)
        .first<any>();
      if (project && (project.is_active === 0 || project.is_archived === 1)) {
        return errorResponse(
          "Auf archivierte oder gesperrte Projekte können keine Reisekosten gebucht werden.",
          400
        );
      }
    }

    const tripDate = body.tripDate || now.substring(0, 10);
    const returnDate = body.returnDate || tripDate;
    const totalDays = body.totalDays !== undefined ? parseInt(body.totalDays) : 1;
    const travelType = body.travelType || "BusinessTrip";
    const expenseType = body.expenseType || "PersonalCar";
    const distanceKm = parseFloat(body.distanceKm || "0");
    const ratePerKm = parseFloat(
      body.ratePerKm ||
        (travelType === "PermanentWorkplace" ? (distanceKm > 20 ? "0.38" : "0.30") : "0.30")
    );
    const ticketCost = parseFloat(body.ticketCost || "0");
    const hotelCost = parseFloat(body.hotelCost || "0");
    const parkingCost = parseFloat(body.parkingCost || "0");
    const vmaAmount = parseFloat(body.vmaAmount || "0");
    const hasBreakfast = body.hasBreakfast ? 1 : 0;
    const isBillableToClient =
      body.isBillableToClient !== undefined ? (body.isBillableToClient ? 1 : 0) : 0;
    const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;

    const travelCost =
      expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;

    const expenses: any[] = body.expenses || [];
    let totalExpensesGross = 0;
    let totalExpensesNet = 0;
    let totalExpensesBillableNet = 0;

    for (const exp of expenses) {
      const gross = parseFloat(exp.amountGross || "0");
      const net = parseFloat(
        exp.amountNet ||
          (gross / (1 + parseFloat(exp.taxRate || "0") / 100)).toFixed(2)
      );
      const isBillable =
        exp.isBillableToClient === true ||
        exp.isBillableToClient === 1 ||
        exp.is_billable_to_client === 1
          ? 1
          : 0;
      totalExpensesGross += gross;
      totalExpensesNet += net;
      if (isBillable) totalExpensesBillableNet += net;
    }

    const totalActualCost =
      travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
    const customerReimbursableCost = isBillableToClient
      ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet
      : 0.0;

    const origin = body.origin || "Wohnort";
    const dest = body.destination || "Kunde";
    const originAddress = body.originAddress || origin;
    const destAddress = body.destinationAddress || dest;
    const contactPerson = body.contactPerson || "";
    const departureTime = body.departureTime || "08:00";
    const arrivalTime = body.arrivalTime || "18:00";
    const purpose = body.purpose || "Kundentermin vor Ort";

    const departureUtc = `${tripDate}T${departureTime || "07:30"}:00.000Z`;
    const arrivalUtc = `${returnDate}T${arrivalTime || "19:30"}:00.000Z`;
    const totalAbsenceHours = totalDays > 1 ? totalDays * 24 : 12.0;

    const status = body.status || "Completed";
    const isRoundTrip = body.isRoundTrip ? 1 : 0;
    const totalPlannedCostNet = parseFloat(
      body.totalPlannedCostNet || totalActualCost || "0"
    );
    const breakfastDaysJson = JSON.stringify(body.breakfastDays || []);

    const isForeignTrip =
      body.isForeignTrip !== undefined
        ? parseInt(body.isForeignTrip)
        : body.is_foreign_trip !== undefined
          ? parseInt(body.is_foreign_trip)
          : 0;
    const foreignCountry = body.foreignCountry || body.foreign_country || "";
    const foreignCity = body.foreignCity || body.foreign_city || "";
    const foreignRatesJson =
      typeof body.foreignRates === "object"
        ? JSON.stringify(body.foreignRates)
        : body.foreign_rates_json || "{}";
    const mealDeductionsJson =
      typeof body.mealDeductions === "object"
        ? JSON.stringify(body.mealDeductions)
        : body.meal_deductions_json || "{}";

    await env.DB.prepare(`
      INSERT INTO trips (
        id, project_id, trip_date, return_date, total_days, origin, destination, 
        origin_location, destination_location, origin_address, destination_address, return_location, contact_person,
        distance_km, rate_per_km, departure_time, arrival_time, departure_time_utc, arrival_time_utc, total_absence_hours,
        purpose, travel_type, expense_type, ticket_cost, hotel_cost, parking_cost, vma_amount, has_breakfast,
        customer_reimbursable_cost, total_actual_cost, is_billable_to_client, is_internal_expense_only,
        status, is_round_trip, total_planned_cost_net, breakfast_days_json,
        is_foreign_trip, foreign_country, foreign_city, foreign_rates_json, meal_deductions_json,
        created_at_utc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        trip_date = excluded.trip_date,
        return_date = excluded.return_date,
        distance_km = excluded.distance_km,
        purpose = excluded.purpose,
        customer_reimbursable_cost = excluded.customer_reimbursable_cost,
        total_actual_cost = excluded.total_actual_cost
    `)
      .bind(
        tripId,
        body.projectId || null,
        tripDate,
        returnDate,
        totalDays,
        origin,
        dest,
        origin,
        dest,
        originAddress,
        destAddress,
        body.returnLocation || (isRoundTrip ? origin : dest),
        contactPerson,
        distanceKm,
        ratePerKm,
        departureTime,
        arrivalTime,
        departureUtc,
        arrivalUtc,
        totalAbsenceHours,
        purpose,
        travelType,
        expenseType,
        ticketCost,
        hotelCost,
        parkingCost,
        vmaAmount,
        hasBreakfast,
        customerReimbursableCost,
        totalActualCost,
        isBillableToClient,
        isInternalExpenseOnly,
        status,
        isRoundTrip,
        totalPlannedCostNet,
        breakfastDaysJson,
        isForeignTrip,
        foreignCountry,
        foreignCity,
        foreignRatesJson,
        mealDeductionsJson,
        now
      )
      .run();

    for (const exp of expenses) {
      const expId = exp.id || crypto.randomUUID();
      const gross = parseFloat(exp.amountGross || "0");
      const rate = parseFloat(exp.taxRate !== undefined ? exp.taxRate : "19.0");
      const net = parseFloat(
        exp.amountNet || (gross / (1 + rate / 100)).toFixed(2)
      );
      const taxAmount = parseFloat((gross - net).toFixed(2));
      const isBillable =
        exp.isBillableToClient === true ||
        exp.isBillableToClient === 1 ||
        exp.is_billable_to_client === 1
          ? 1
          : 0;

      await env.DB.prepare(`
        INSERT INTO trip_expenses (
          id, trip_id, expense_date, category, description, skr04_account,
          amount_gross, amount_net, tax_rate, tax_amount,
          receipt_r2_key, receipt_filename, receipt_mime_type,
          is_billable_to_client, is_synced_to_lexware, created_at_utc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          amount_gross = excluded.amount_gross,
          amount_net = excluded.amount_net,
          description = excluded.description
      `)
        .bind(
          expId,
          tripId,
          exp.expenseDate || tripDate,
          exp.category || "Other",
          exp.description || "Spesen",
          exp.skr04Account || "6670",
          gross,
          net,
          rate,
          taxAmount,
          exp.receiptR2Key || null,
          exp.receiptFilename || null,
          exp.receiptMimeType || null,
          isBillable,
          0,
          now
        )
        .run();
    }

    const legs: any[] = body.legs || [];
    for (let i = 0; i < legs.length; i++) {
      const leg = legs[i];
      const legId = leg.id || crypto.randomUUID();

      let legCustId = null;
      if (
        leg.customerId &&
        typeof leg.customerId === "string" &&
        leg.customerId.trim() !== ""
      ) {
        const cCheck = await env.DB.prepare(
          "SELECT id FROM customers WHERE id = ?"
        )
          .bind(leg.customerId.trim())
          .first();
        if (cCheck) legCustId = leg.customerId.trim();
      }

      let legProjId = null;
      if (
        leg.projectId &&
        typeof leg.projectId === "string" &&
        leg.projectId.trim() !== ""
      ) {
        const pCheck = await env.DB.prepare("SELECT id FROM projects WHERE id = ?")
          .bind(leg.projectId.trim())
          .first();
        if (pCheck) legProjId = leg.projectId.trim();
      }

      await env.DB.prepare(`
        INSERT INTO trip_legs (
          id, trip_id, leg_order, date_leg, start_location, destination_location,
          transport_type, distance_km, rate_per_km, travel_cost_net,
          layover_hours, layover_purpose, customer_id, project_id, is_billable_to_client, created_at_utc
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(id) DO UPDATE SET
          distance_km = excluded.distance_km,
          travel_cost_net = excluded.travel_cost_net
      `)
        .bind(
          legId,
          tripId,
          leg.legOrder || i + 1,
          leg.dateLeg || tripDate,
          leg.startLocation || "Start",
          leg.destinationLocation || "Ziel",
          leg.transportType || "Train",
          parseFloat(leg.distanceKm || "0"),
          parseFloat(leg.ratePerKm || "0.30"),
          parseFloat(leg.travelCostNet || "0"),
          parseFloat(leg.layoverHours || "0"),
          leg.layoverPurpose || null,
          legCustId,
          legProjId,
          leg.isBillableToClient === true ||
            leg.isBillableToClient === 1 ||
            leg.is_billable_to_client === 1
            ? 1
            : 0,
          now
        )
        .run();
    }

    await logAuditEvent(env, {
      eventType: "TRIP_CREATED",
      entityType: "trip",
      entityId: tripId,
      actor: "User",
      description: `Reisekosten für ${project ? project.name : "Interne Dienstreise"} am ${tripDate} erfasst (${customerReimbursableCost.toFixed(2)} € an Kunde, ${totalActualCost.toFixed(2)} € Gesamtkosten).`,
    });

    return jsonResponse({
      success: true,
      id: tripId,
      customerReimbursableCost,
      totalActualCost,
      expensesCount: expenses.length,
      legsCount: legs.length,
    });
  }

  // 8f. Reisekosten abrufen
  if (path === "/api/v1/trips" && method === "GET") {
    await ensureTripExpenses(env);
    const projectId = url.searchParams.get("projectId");
    const customerId = url.searchParams.get("customerId");
    const period = url.searchParams.get("period");
    const timesheetId = url.searchParams.get("timesheetId");
    const statusFilter = url.searchParams.get("status");

    let baseQuery = `
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             COALESCE(tr.origin, tr.origin_location) as origin, 
             COALESCE(tr.destination, tr.destination_location) as destination, 
             COALESCE(tr.ticket_cost, 0.0) as ticket_cost,
             COALESCE(tr.hotel_cost, 0.0) as hotel_cost,
             COALESCE(tr.parking_cost, 0.0) as parking_cost,
             COALESCE(tr.vma_amount, 0.0) as vma_amount,
             COALESCE(tr.travel_type, 'BusinessTrip') as travel_type,
             COALESCE(tr.is_billable_to_client, 0) as is_billable_to_client,
             COALESCE(tr.status, 'Completed') as status,
             COALESCE(tr.is_round_trip, 0) as is_round_trip,
             COALESCE(tr.total_planned_cost_net, 0.0) as total_planned_cost_net,
             COALESCE(p.name, 'Interne Reise (Community / Fortbildung)') as project_name,
             COALESCE(p.project_number, 'INTERN') as project_number,
             c.id as customer_id,
             COALESCE(c.name, 'Eigenbetrieb / Fortbildung') as customer_name,
             tv.status as ts_status,
             tv.period as ts_period,
             tv.lexware_invoice_number
      FROM trips tr 
      LEFT JOIN projects p ON tr.project_id = p.id 
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE 1=1
    `;

    const params: any[] = [];
    if (timesheetId) {
      baseQuery += " AND tr.timesheet_version_id = ?";
      params.push(timesheetId);
    }
    if (projectId) {
      baseQuery += " AND tr.project_id = ?";
      params.push(projectId);
    }
    if (customerId) {
      baseQuery += " AND c.id = ?";
      params.push(customerId);
    }
    if (period) {
      baseQuery += " AND (tr.trip_date LIKE ? OR tr.return_date LIKE ?)";
      params.push(`${period}%`, `${period}%`);
    }
    if (statusFilter === "planned") {
      baseQuery += " AND tr.status = 'Planned'";
    } else if (statusFilter === "completed") {
      baseQuery += " AND (tr.status = 'Completed' OR tr.status IS NULL)";
    } else if (statusFilter === "unbilled") {
      baseQuery +=
        " AND (tr.status = 'Completed' OR tr.status IS NULL) AND (tr.timesheet_version_id IS NULL OR tv.status IN ('Draft', 'Rejected', 'InvoiceCanceled'))";
    } else if (statusFilter === "billed") {
      baseQuery += " AND tv.status IN ('PendingSignature', 'Approved', 'Invoiced')";
    }

    const isDemo = isDemoRequest(request);
    if (!isDemo) {
      baseQuery +=
        " AND (tr.project_id NOT LIKE 'prj_demo_%' OR tr.project_id IS NULL) AND tr.id NOT LIKE 'trip_demo_%' AND (c.id NOT LIKE 'cust_demo_%' OR c.id IS NULL)";
    } else {
      baseQuery +=
        " AND (tr.project_id LIKE 'prj_demo_%' OR tr.id LIKE 'trip_demo_%' OR tr.project_id IS NULL)";
    }

    baseQuery += " ORDER BY tr.trip_date DESC LIMIT 300";

    const query = env.DB.prepare(baseQuery).bind(...params);
    const { results } = await query.all<any>();

    const tripIds = (results || []).map((r: any) => r.id);
    let allExpenses: any[] = [];
    let allLegs: any[] = [];

    if (tripIds.length > 0) {
      const { results: expResults } = await env.DB.prepare(`
        SELECT * FROM trip_expenses 
        ORDER BY expense_date ASC, created_at_utc ASC
      `).all<any>();
      allExpenses = expResults || [];

      const { results: legResults } = await env.DB.prepare(`
        SELECT * FROM trip_legs 
        ORDER BY leg_order ASC, created_at_utc ASC
      `).all<any>();
      allLegs = legResults || [];
    }

    const enriched = (results || []).map((tr: any) => {
      const isEditable =
        (!tr.ts_status ||
          tr.ts_status === "Draft" ||
          tr.ts_status === "Rejected" ||
          tr.ts_status === "InvoiceCanceled") &&
        tr.status !== "Archived";
      const travelCost =
        tr.expense_type === "PersonalCar"
          ? tr.distance_km * (tr.rate_per_km || 0.3)
          : tr.ticket_cost || 0.0;

      const tripExps = allExpenses.filter((e) => e.trip_id === tr.id);
      const tripLegs = allLegs.filter((l) => l.trip_id === tr.id);
      let extraExpNet = 0;
      let extraExpGross = 0;
      let extraExpTax = 0;
      let extraExpBillableNet = 0;
      for (const e of tripExps) {
        extraExpNet += e.amount_net || 0;
        extraExpGross += e.amount_gross || e.amount_net || 0;
        extraExpTax += e.tax_amount || 0;
        if (e.is_billable_to_client) extraExpBillableNet += e.amount_net || 0;
      }

      let legsTravelCost = 0;
      let legsBillableCost = 0;
      for (const l of tripLegs) {
        const isCar = l.transport_type === "PersonalCar";
        const isFree =
          l.transport_type === "Passenger" || l.transport_type === "BikeFoot";
        const legCost = isCar
          ? parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30")
          : isFree
            ? 0
            : l.travel_cost_net !== undefined && l.travel_cost_net !== null
              ? parseFloat(l.travel_cost_net)
              : 0;
        legsTravelCost += legCost;
        if (l.is_billable_to_client) legsBillableCost += legCost;
      }

      const effTravelCost = tripLegs.length > 0 ? legsTravelCost : travelCost;
      const totalCost =
        effTravelCost +
        (tr.hotel_cost || 0.0) +
        (tr.parking_cost || 0.0) +
        (tr.vma_amount || 0.0) +
        extraExpNet;
      const totalGross = totalCost + extraExpTax;
      const clientNet = tr.is_billable_to_client
        ? effTravelCost +
          (tr.hotel_cost || 0.0) +
          (tr.parking_cost || 0.0) +
          extraExpBillableNet
        : 0.0;

      let routeDisplay = "";
      let destDisplay = tr.destination || tr.destination_address || "-";
      let returnLocation = tr.return_location || tr.origin || "-";

      function cleanCity(loc: string) {
        if (!loc) return "";
        return loc.split(",")[0].trim();
      }

      if (tripLegs.length > 0) {
        const stops: string[] = [];
        const destCities: string[] = [];
        const firstCity = cleanCity(tripLegs[0].start_location);
        const lastCity = cleanCity(tripLegs[tripLegs.length - 1].destination_location);

        tripLegs.forEach((leg: any, idx: number) => {
          const sCity = cleanCity(leg.start_location);
          const dCity = cleanCity(leg.destination_location);
          if (idx === 0 && sCity) stops.push(sCity);
          if (dCity && (stops.length === 0 || stops[stops.length - 1] !== dCity)) {
            stops.push(dCity);
          }
          if (
            dCity &&
            dCity !== firstCity &&
            dCity !== lastCity &&
            !destCities.includes(dCity)
          ) {
            destCities.push(dCity);
          }
        });

        routeDisplay = stops.join(" ➔ ");
        if (destCities.length > 0) {
          destDisplay = destCities.join(", ");
        } else if (tr.destination && tr.destination !== tr.origin) {
          destDisplay = tr.destination;
        }
        returnLocation =
          tripLegs[tripLegs.length - 1].destination_location || tr.origin;
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

      return {
        ...tr,
        destination: destDisplay,
        return_location: returnLocation,
        route_display: routeDisplay,
        calculated_travel_cost: effTravelCost,
        calculated_total_cost: totalCost,
        calculated_total_gross: totalGross,
        calculated_total_tax: extraExpTax,
        calculated_client_net: clientNet,
        expenses: tripExps,
        legs: tripLegs,
        isEditable,
      };
    });

    return jsonResponse(enriched);
  }

  // 8g. Reise als durchgeführt markieren
  const tripCompleteMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/complete$/
  );
  if (tripCompleteMatch && method === "POST") {
    await ensureTripExpenses(env);
    const tripId = tripCompleteMatch[1];
    const res = await env.DB.prepare(
      "UPDATE trips SET status = 'Completed' WHERE id = ?"
    )
      .bind(tripId)
      .run();
    if (!res.meta.changes || res.meta.changes === 0) {
      return errorResponse("Reise nicht gefunden", 404);
    }
    await logAuditEvent(env, {
      eventType: "TRIP_COMPLETED",
      entityType: "trip",
      entityId: tripId,
      actor: "User",
      description: `Geplante Reise ${tripId} als durchgeführt markiert.`,
    });
    return jsonResponse({
      success: true,
      message:
        "Reise erfolgreich als durchgeführt markiert. Belege können nun final erfasst werden.",
    });
  }

  // 8h. Einzelne Reise abrufen, bearbeiten, löschen
  const tripTaxReportMatch = path.match(
    /^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)\/tax-report-data$/
  );
  if (tripTaxReportMatch && method === "GET") {
    await ensureTripExpenses(env);
    const tripId = tripTaxReportMatch[1];
    const tr = await env.DB.prepare(`
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             p.name as project_name, p.project_number, c.name as customer_name, c.street as customer_street, c.zip_code as customer_zip, c.city as customer_city, tv.status as ts_status, tv.pdf_frozen_hash
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
      WHERE tr.id = ?
    `)
      .bind(tripId)
      .first<any>();

    if (!tr) return errorResponse("Reise nicht gefunden", 404);

    const { results: expenses } = await env.DB.prepare(
      "SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC"
    )
      .bind(tripId)
      .all<any>();

    const { results: legs } = await env.DB.prepare(
      "SELECT * FROM trip_legs WHERE trip_id = ? ORDER BY leg_order ASC"
    )
      .bind(tripId)
      .all<any>();

    let legsTravelCost = 0;
    for (const l of legs || []) {
      if (l.transport_type === "PersonalCar") {
        legsTravelCost +=
          parseFloat(l.distance_km || "0") * parseFloat(l.rate_per_km || "0.30");
      } else if (
        l.transport_type === "Passenger" ||
        l.transport_type === "BikeFoot"
      ) {
        legsTravelCost += 0;
      } else {
        legsTravelCost +=
          l.travel_cost_net !== undefined && l.travel_cost_net !== null
            ? parseFloat(l.travel_cost_net)
            : 0;
      }
    }
    const baseTravelCost =
      tr.expense_type === "PersonalCar"
        ? (tr.distance_km || 0) * (tr.rate_per_km || 0.3)
        : tr.ticket_cost || 0.0;
    const travelCost = legs && legs.length > 0 ? legsTravelCost : baseTravelCost;
    let extraExpNet = 0;
    let extraExpGross = 0;
    let extraExpTax = 0;
    let extraExpBillableNet = 0;
    for (const e of expenses || []) {
      extraExpNet += e.amount_net || 0;
      extraExpGross += e.amount_gross || e.amount_net || 0;
      extraExpTax += e.tax_amount || 0;
      if (e.is_billable_to_client) extraExpBillableNet += e.amount_net || 0;
    }

    const totalActualCost =
      travelCost +
      (tr.hotel_cost || 0.0) +
      (tr.parking_cost || 0.0) +
      (tr.vma_amount || 0.0) +
      extraExpNet;
    const totalActualGross = totalActualCost + extraExpTax;
    const clientReimbursable = tr.is_billable_to_client
      ? travelCost +
        (tr.hotel_cost || 0.0) +
        (tr.parking_cost || 0.0) +
        extraExpBillableNet
      : 0.0;
    const canonicalTripPayload = JSON.stringify({
      id: tr.id,
      trip_date: tr.trip_date,
      return_date: tr.return_date,
      purpose: tr.purpose,
      travelCost,
      totalActualCost,
      totalActualGross,
      clientReimbursable,
      legs: (legs || []).map((l: any) => ({
        start: l.start_location,
        dest: l.destination_location,
        km: l.distance_km,
        type: l.transport_type
      })),
      expenses: (expenses || []).map((e: any) => ({
        category: e.expense_category,
        amountNet: e.amount_net,
        taxRate: e.tax_rate,
        isBillable: e.is_billable_to_client
      }))
    });
    const tripHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalTripPayload));
    const reportHash = `SHA256_${Array.from(new Uint8Array(tripHashBuf)).map(b => b.toString(16).padStart(2, "0")).join("")}`;

    return jsonResponse({
      trip: {
        ...tr,
        travelCost,
        totalActualCost,
        totalActualGross,
        totalTax: extraExpTax,
        clientReimbursable,
        reportHash,
        expenses: expenses || [],
        legs: legs || [],
      },
    });
  }

  const tripDetailMatch = path.match(/^\/api\/v1\/trips\/([a-zA-Z0-9_-]+)$/);
  if (tripDetailMatch) {
    await ensureTripExpenses(env);
    const tripId = tripDetailMatch[1];
    const existing = await env.DB.prepare(`
      SELECT tr.*, 
             COALESCE(tr.return_date, tr.trip_date) as return_date,
             COALESCE(tr.total_days, 1) as total_days,
             p.name as project_name, c.name as customer_name, tv.status as ts_status 
      FROM trips tr 
      LEFT JOIN projects p ON tr.project_id = p.id 
      LEFT JOIN customers c ON p.customer_id = c.id
      LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id 
      WHERE tr.id = ?
    `)
      .bind(tripId)
      .first<any>();

    if (!existing) return errorResponse("Reise nicht gefunden", 404);

    if (method === "GET") {
      const isEditable =
        !existing.ts_status ||
        existing.ts_status === "Draft" ||
        existing.ts_status === "Rejected" ||
        existing.ts_status === "InvoiceCanceled";
      const { results: expenses } = await env.DB.prepare(
        "SELECT * FROM trip_expenses WHERE trip_id = ? ORDER BY expense_date ASC"
      )
        .bind(tripId)
        .all<any>();
      const { results: legs } = await env.DB.prepare(
        "SELECT * FROM trip_legs WHERE trip_id = ? ORDER BY leg_order ASC"
      )
        .bind(tripId)
        .all<any>();
      return jsonResponse({
        trip: { ...existing, expenses: expenses || [], legs: legs || [] },
        isEditable,
      });
    }

    const isLocked =
      existing.ts_status &&
      (existing.ts_status === "PendingSignature" ||
        existing.ts_status === "Approved" ||
        existing.ts_status === "Invoiced");
    if (isLocked) {
      return errorResponse(
        `Diese Reisekosten sind Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt.`,
        403
      );
    }

    if (method === "DELETE") {
      await env.DB.prepare("DELETE FROM trip_legs WHERE trip_id = ?")
        .bind(tripId)
        .run();
      await env.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?")
        .bind(tripId)
        .run();
      await env.DB.prepare("DELETE FROM trips WHERE id = ?").bind(tripId).run();
      await logAuditEvent(env, {
        eventType: "TRIP_DELETED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Reisekosten ${tripId} für ${existing.project_name} (${existing.trip_date}) gelöscht.`,
      });
      return jsonResponse({ success: true, message: "Reisekosten erfolgreich gelöscht." });
    }

    if (method === "PUT") {
      const body = (await request.json()) as any;
      const tripDate = body.tripDate || existing.trip_date;
      const returnDate = body.returnDate || tripDate;
      const totalDays =
        body.totalDays !== undefined
          ? parseInt(body.totalDays)
          : existing.total_days || 1;
      const travelType = body.travelType || existing.travel_type || "BusinessTrip";
      const expenseType = body.expenseType || existing.expense_type || "PersonalCar";
      const distanceKm =
        body.distanceKm !== undefined
          ? parseFloat(body.distanceKm)
          : existing.distance_km || 0.0;
      const ratePerKm =
        body.ratePerKm !== undefined
          ? parseFloat(body.ratePerKm)
          : existing.rate_per_km || 0.3;
      const ticketCost =
        body.ticketCost !== undefined
          ? parseFloat(body.ticketCost)
          : existing.ticket_cost || 0.0;
      const hotelCost =
        body.hotelCost !== undefined
          ? parseFloat(body.hotelCost)
          : existing.hotel_cost || 0.0;
      const parkingCost =
        body.parkingCost !== undefined
          ? parseFloat(body.parkingCost)
          : existing.parking_cost || 0.0;
      const vmaAmount =
        body.vmaAmount !== undefined
          ? parseFloat(body.vmaAmount)
          : existing.vma_amount || 0.0;
      const hasBreakfast =
        body.hasBreakfast !== undefined
          ? body.hasBreakfast
            ? 1
            : 0
          : existing.has_breakfast;
      const isBillableToClient =
        body.isBillableToClient !== undefined
          ? body.isBillableToClient
            ? 1
            : 0
          : existing.is_billable_to_client !== undefined
            ? existing.is_billable_to_client
            : 0;
      const isInternalExpenseOnly = isBillableToClient === 0 ? 1 : 0;
      const status = body.status || existing.status || "Completed";
      const isRoundTrip =
        body.isRoundTrip !== undefined
          ? body.isRoundTrip
            ? 1
            : 0
          : existing.is_round_trip || 0;
      const breakfastDaysJson = body.breakfastDays
        ? JSON.stringify(body.breakfastDays)
        : existing.breakfast_days_json || "[]";

      const travelCost =
        expenseType === "PersonalCar" ? distanceKm * ratePerKm : ticketCost;

      const expenses: any[] = body.expenses || [];
      let totalExpensesGross = 0;
      let totalExpensesNet = 0;
      let totalExpensesBillableNet = 0;

      await env.DB.prepare("DELETE FROM trip_expenses WHERE trip_id = ?")
        .bind(tripId)
        .run();

      for (const exp of expenses) {
        const expId = exp.id || crypto.randomUUID();
        const gross = parseFloat(exp.amountGross || "0");
        const rate = parseFloat(exp.taxRate !== undefined ? exp.taxRate : "19.0");
        const net = parseFloat(
          exp.amountNet || (gross / (1 + rate / 100)).toFixed(2)
        );
        const taxAmount = parseFloat((gross - net).toFixed(2));
        const isBillable =
          exp.isBillableToClient === true ||
          exp.isBillableToClient === 1 ||
          exp.is_billable_to_client === 1
            ? 1
            : 0;

        totalExpensesGross += gross;
        totalExpensesNet += net;
        if (isBillable) totalExpensesBillableNet += net;

        await env.DB.prepare(`
          INSERT INTO trip_expenses (
            id, trip_id, expense_date, category, description, skr04_account,
            amount_gross, amount_net, tax_rate, tax_amount,
            receipt_r2_key, receipt_filename, receipt_mime_type,
            is_billable_to_client, is_synced_to_lexware, created_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
          .bind(
            expId,
            tripId,
            exp.expenseDate || tripDate,
            exp.category || "Other",
            exp.description || "Spesen",
            exp.skr04Account || "6670",
            gross,
            net,
            rate,
            taxAmount,
            exp.receiptR2Key || null,
            exp.receiptFilename || null,
            exp.receiptMimeType || null,
            isBillable,
            exp.isSyncedToLexware ? 1 : 0
          )
          .run();
      }

      const legs: any[] = body.legs || [];
      await env.DB.prepare("DELETE FROM trip_legs WHERE trip_id = ?").bind(tripId).run();
      for (let i = 0; i < legs.length; i++) {
        const leg = legs[i];
        const legId = leg.id || crypto.randomUUID();

        let legCustId = null;
        if (
          leg.customerId &&
          typeof leg.customerId === "string" &&
          leg.customerId.trim() !== ""
        ) {
          const cCheck = await env.DB.prepare(
            "SELECT id FROM customers WHERE id = ?"
          )
            .bind(leg.customerId.trim())
            .first();
          if (cCheck) legCustId = leg.customerId.trim();
        }

        let legProjId = null;
        if (
          leg.projectId &&
          typeof leg.projectId === "string" &&
          leg.projectId.trim() !== ""
        ) {
          const pCheck = await env.DB.prepare(
            "SELECT id FROM projects WHERE id = ?"
          )
            .bind(leg.projectId.trim())
            .first();
          if (pCheck) legProjId = leg.projectId.trim();
        }

        await env.DB.prepare(`
          INSERT INTO trip_legs (
            id, trip_id, leg_order, date_leg, start_location, destination_location,
            transport_type, distance_km, rate_per_km, travel_cost_net,
            layover_hours, layover_purpose, customer_id, project_id, is_billable_to_client, created_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
        `)
          .bind(
            legId,
            tripId,
            leg.legOrder || i + 1,
            leg.dateLeg || tripDate,
            leg.startLocation || "Start",
            leg.destinationLocation || "Ziel",
            leg.transportType || "Train",
            parseFloat(leg.distanceKm || "0"),
            parseFloat(leg.ratePerKm || "0.30"),
            parseFloat(leg.travelCostNet || "0"),
            parseFloat(leg.layoverHours || "0"),
            leg.layoverPurpose || null,
            legCustId,
            legProjId,
            leg.isBillableToClient === true ||
              leg.isBillableToClient === 1 ||
              leg.is_billable_to_client === 1
              ? 1
              : 0
          )
          .run();
      }

      const totalActualCost =
        travelCost + hotelCost + parkingCost + vmaAmount + totalExpensesNet;
      const customerReimbursableCost = isBillableToClient
        ? travelCost + hotelCost + parkingCost + totalExpensesBillableNet
        : 0.0;
      const totalPlannedCostNet = parseFloat(
        body.totalPlannedCostNet || totalActualCost || "0"
      );

      const origin = body.origin || existing.origin || "Wohnort";
      const dest = body.destination || existing.destination || "Kunde";
      const originAddress = body.originAddress || existing.origin_address || origin;
      const destAddress = body.destinationAddress || existing.destination_address || dest;
      const returnLocation =
        body.returnLocation ||
        body.return_location ||
        existing.return_location ||
        (isRoundTrip ? origin : dest);
      const contactPerson = body.contactPerson || existing.contact_person || "";
      const departureTime = body.departureTime || existing.departure_time || "08:00";
      const arrivalTime = body.arrivalTime || existing.arrival_time || "18:00";
      const purpose = body.purpose || existing.purpose || "Kundentermin vor Ort";

      const changes: string[] = [];
      if (tripDate !== existing.trip_date || returnDate !== existing.return_date)
        changes.push(
          `Zeitraum: ${existing.trip_date} -> ${tripDate} bis ${returnDate}`
        );
      if (travelType !== existing.travel_type)
        changes.push(`Reiseart: ${existing.travel_type} -> ${travelType}`);
      if (distanceKm !== existing.distance_km)
        changes.push(`Distanz: ${existing.distance_km}km -> ${distanceKm}km`);
      if (vmaAmount !== existing.vma_amount)
        changes.push(`VMA: ${existing.vma_amount}€ -> ${vmaAmount}€`);
      if (status !== existing.status)
        changes.push(`Status: ${existing.status} -> ${status}`);
      if (expenses.length > 0)
        changes.push(`${expenses.length} Belegpositionen aktualisiert`);
      if (legs.length > 0) changes.push(`${legs.length} Etappen aktualisiert`);

      const isForeignTrip =
        body.isForeignTrip !== undefined
          ? parseInt(body.isForeignTrip)
          : body.is_foreign_trip !== undefined
            ? parseInt(body.is_foreign_trip)
            : existing.is_foreign_trip || 0;
      const foreignCountry =
        body.foreignCountry !== undefined
          ? body.foreignCountry
          : body.foreign_country !== undefined
            ? body.foreign_country
            : existing.foreign_country || "";
      const foreignCity =
        body.foreignCity !== undefined
          ? body.foreignCity
          : body.foreign_city !== undefined
            ? body.foreign_city
            : existing.foreign_city || "";
      const foreignRatesJson =
        typeof body.foreignRates === "object"
          ? JSON.stringify(body.foreignRates)
          : body.foreign_rates_json !== undefined
            ? body.foreign_rates_json
            : existing.foreign_rates_json || "{}";
      const mealDeductionsJson =
        typeof body.mealDeductions === "object"
          ? JSON.stringify(body.mealDeductions)
          : body.meal_deductions_json !== undefined
            ? body.meal_deductions_json
            : existing.meal_deductions_json || "{}";

      await env.DB.prepare(`
        UPDATE trips SET
          trip_date = ?, return_date = ?, total_days = ?, purpose = ?, expense_type = ?, travel_type = ?,
          origin = ?, destination = ?, origin_location = ?, destination_location = ?,
          origin_address = ?, destination_address = ?, return_location = ?, contact_person = ?,
          departure_time = ?, arrival_time = ?, distance_km = ?, rate_per_km = ?,
          ticket_cost = ?, hotel_cost = ?, parking_cost = ?, vma_amount = ?, has_breakfast = ?,
          customer_reimbursable_cost = ?, total_actual_cost = ?,
          is_billable_to_client = ?, is_internal_expense_only = ?,
          status = ?, is_round_trip = ?, total_planned_cost_net = ?, breakfast_days_json = ?,
          is_foreign_trip = ?, foreign_country = ?, foreign_city = ?, foreign_rates_json = ?, meal_deductions_json = ?
        WHERE id = ?
      `)
        .bind(
          tripDate,
          returnDate,
          totalDays,
          purpose,
          expenseType,
          travelType,
          origin,
          dest,
          origin,
          dest,
          originAddress,
          destAddress,
          returnLocation,
          contactPerson,
          departureTime,
          arrivalTime,
          distanceKm,
          ratePerKm,
          ticketCost,
          hotelCost,
          parkingCost,
          vmaAmount,
          hasBreakfast,
          customerReimbursableCost,
          totalActualCost,
          isBillableToClient,
          isInternalExpenseOnly,
          status,
          isRoundTrip,
          totalPlannedCostNet,
          breakfastDaysJson,
          isForeignTrip,
          foreignCountry,
          foreignCity,
          foreignRatesJson,
          mealDeductionsJson,
          tripId
        )
        .run();

      const changeSummary =
        changes.length > 0 ? changes.join(", ") : "Werte bestätigt";
      await logAuditEvent(env, {
        eventType: "TRIP_UPDATED",
        entityType: "trip",
        entityId: tripId,
        actor: "User",
        description: `Reise für ${existing.project_name} (${tripDate}) korrigiert (${changeSummary}).`,
      });

      return jsonResponse({
        success: true,
        id: tripId,
        status,
        totalReimbursement: customerReimbursableCost,
        totalActualCost,
        message: "Reisekosten & Belege erfolgreich aktualisiert!",
        changes: changeSummary,
      });
    }
  }

  return null;
}
