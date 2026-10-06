import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { ensureOperationalVouchers } from "../services/db_bootstrap.service";
import { scanVoucherWithAi } from "../services/ai_vision.service";
import { syncVoucherToLexware } from "../services/lexware.service";

export async function handleVouchersRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

  // 20a. Beleg-Scan mit AI
  if (path === "/api/v1/vouchers/scan-ai" && method === "POST") {
    return scanVoucherWithAi(request, env);
  }

      // 20b. Cross-Device Mobile QR Upload Sessions
      if (path === "/api/v1/vouchers/upload-session/create" && method === "POST") {
        await ensureOperationalVouchers(env);
        const sessionId = "scan_" + crypto.randomUUID().replace(/-/g, "").substring(0, 16);
        const now = new Date();
        const expiresAt = new Date(now.getTime() + 15 * 60 * 1000).toISOString();

        await env.DB.prepare(`
          INSERT INTO voucher_upload_sessions (id, status, uploaded_files_json, expires_at_utc, created_at_utc)
          VALUES (?, 'waiting', '[]', ?, ?)
        `).bind(sessionId, expiresAt, now.toISOString()).run();

        return jsonResponse({
          success: true,
          sessionId,
          expiresAt
        });
      }

      // 20b-2. Direkter PWA Beleg-Upload (Finding A07 - Inbox-Endpunkt für multipart/form-data)
      if ((path === "/api/v1/vouchers/upload-session/file" || path === "/api/v1/vouchers/direct-upload") && method === "POST") {
        await ensureOperationalVouchers(env);
        try {
          const contentType = request.headers.get("content-type") || "";
          let filename = "beleg.jpg";
          let mimeType = "image/jpeg";
          let bytes: Uint8Array | null = null;

          if (contentType.includes("multipart/form-data")) {
            const formData = await request.formData();
            const fileEntry = formData.get("file");
            if (!fileEntry || typeof fileEntry === "string") {
              return errorResponse("Keine Datei im Formularfeld 'file' gefunden.", 400);
            }
            const file = fileEntry as File;
            filename = file.name || "beleg.jpg";
            mimeType = file.type || "image/jpeg";
            bytes = new Uint8Array(await file.arrayBuffer());
          } else {
            const body = await request.json() as any;
            filename = body.filename || "beleg.jpg";
            mimeType = body.mimeType || "image/jpeg";
            let b64 = body.base64 || body.file || "";
            if (b64.includes(",")) b64 = b64.split(",")[1];
            const bin = atob(b64);
            bytes = new Uint8Array(bin.length);
            for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
          }

          if (!bytes || bytes.length === 0) {
            return errorResponse("Leere Belegdatei empfangen.", 400);
          }

          const fileId = `rec_mob_${crypto.randomUUID().replace(/-/g, "")}`;
          const cleanFilename = filename.replace(/[^a-zA-Z0-9_.-]/g, "_");
          const r2Key = `vouchers/receipts/${fileId}_${cleanFilename}`;

          if (env.STORAGE) {
            await env.STORAGE.put(r2Key, bytes, {
              httpMetadata: { contentType: mimeType }
            });
          }

          // In D1 registrieren (Zentrale Inbox / Finding B09)
          try {
            await ensureOperationalVouchers(env);
            await env.DB.prepare(`
              INSERT OR REPLACE INTO operational_vouchers (id, voucher_date, amount_gross, tax_rate, supplier_name, file_r2_key, status, created_at_utc)
              VALUES (?, ?, 0.0, 19.0, ?, ?, 'PendingReview', ?)
            `).bind(fileId, new Date().toISOString().substring(0, 10), cleanFilename, r2Key, new Date().toISOString()).run();
          } catch (dbErr) {
            console.warn("Could not register voucher in D1 inbox:", dbErr);
          }

          return jsonResponse({
            success: true,
            id: fileId,
            filename: cleanFilename,
            r2Key,
            size: bytes.length,
            mimeType
          });
        } catch (err: any) {
          console.error("Direct voucher upload error:", err);
          return errorResponse(`Fehler beim Beleg-Upload: ${err?.message || err}`, 500);
        }
      }

      const mobileUploadMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/upload$/);
      if (mobileUploadMatch && method === "POST") {
        await ensureOperationalVouchers(env);
        const sessionId = mobileUploadMatch[1];
        const session = await env.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first<any>();
        if (!session) return errorResponse("Upload-Session nicht gefunden.", 404);
        if (session.status === "ready" || session.status === "completed") {
          return errorResponse("Upload-Session wurde bereits verwendet (Einmal-Token).", 409);
        }
        if (session.expires_at_utc && new Date(session.expires_at_utc).getTime() < Date.now()) {
          return errorResponse("Upload-Session ist abgelaufen (TTL überschritten). Bitte neuen QR-Code scannen.", 410);
        }

        try {
          const body = await request.json() as any;
          const files = body.files || [];
          if (!files || files.length === 0) {
            return errorResponse("Keine Dateien zum Hochladen übermittelt.", 400);
          }

          const uploadedResults: any[] = [];

          for (let i = 0; i < files.length; i++) {
            const f = files[i];
            const fileId = `rec_mob_${crypto.randomUUID().replace(/-/g, "")}`;
            const cleanFilename = (f.filename || `foto_${i + 1}.jpg`).replace(/[^a-zA-Z0-9_.-]/g, "_");
            const r2Key = `vouchers/receipts/${fileId}_${cleanFilename}`;

            let cleanBase64 = f.base64 || "";
            if (cleanBase64.includes(",")) cleanBase64 = cleanBase64.split(",")[1];
            
            const binaryString = atob(cleanBase64);
            const bytes = new Uint8Array(binaryString.length);
            for (let b = 0; b < binaryString.length; b++) {
              bytes[b] = binaryString.charCodeAt(b);
            }

            await env.STORAGE.put(r2Key, bytes, {
              httpMetadata: { contentType: f.mimeType || "image/jpeg" }
            });

            uploadedResults.push({
              r2Key,
              filename: cleanFilename,
              mimeType: f.mimeType || "image/jpeg",
              size: bytes.length
            });
          }

          await env.DB.prepare(`
            UPDATE voucher_upload_sessions 
            SET status = 'ready', uploaded_files_json = ? 
            WHERE id = ?
          `).bind(JSON.stringify(uploadedResults), sessionId).run();

          return jsonResponse({ success: true, count: uploadedResults.length, files: uploadedResults });
        } catch (upErr: any) {
          console.error("Mobile upload processing error:", upErr);
          return errorResponse(`Upload-Fehler: ${upErr?.message || upErr}`, 500);
        }
      }

      const mobileStatusMatch = path.match(/^\/api\/v1\/vouchers\/upload-session\/([a-zA-Z0-9_-]+)\/status$/);
      if (mobileStatusMatch && method === "GET") {
        await ensureOperationalVouchers(env);
        const sessionId = mobileStatusMatch[1];
        const session = await env.DB.prepare("SELECT * FROM voucher_upload_sessions WHERE id = ?").bind(sessionId).first<any>();
        if (!session) return errorResponse("Session nicht gefunden", 404);

        const files = JSON.parse(session.uploaded_files_json || "[]");
        return jsonResponse({
          success: true,
          status: session.status,
          files: session.status === "ready" ? files : []
        });
      }

      // 20b-2. Beleg-Dateien aus R2 abrufen
      if (path.startsWith("/api/v1/vouchers/receipts/") && method === "GET") {
        const r2Key = decodeURIComponent(path.replace("/api/v1/vouchers/receipts/", ""));
        const obj = await env.STORAGE.get(r2Key);
        if (!obj) return errorResponse("Belegdatei nicht im Speicher gefunden", 404);
        const headers = new Headers();
        obj.writeHttpMetadata(headers);
        headers.set("etag", obj.httpEtag);
        headers.set("Cache-Control", "public, max-age=31536000");
        return new Response(obj.body, { headers });
      }

      // 20c. Belege abrufen (GET /api/v1/vouchers)
      if (path === "/api/v1/vouchers" && method === "GET") {
        await ensureOperationalVouchers(env);
        const period = url.searchParams.get("period");
        const type = url.searchParams.get("type");

        let sql = `
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE 1=1
        `;
        const params: any[] = [];
        if (period && period.trim()) {
          sql += " AND v.voucher_date LIKE ?";
          params.push(`${period.trim()}%`);
        }
        if (type && type !== "all") {
          sql += " AND v.voucher_type = ?";
          params.push(type);
        }
        sql += " ORDER BY v.voucher_date DESC, v.created_at_utc DESC";

        let stmt = env.DB.prepare(sql);
        if (params.length > 0) {
          stmt = stmt.bind(...params);
        }
        const { results: vouchers } = await stmt.all<any>();

        return jsonResponse({
          success: true,
          count: vouchers.length,
          vouchers: vouchers || []
        });
      }

      // 20d. Neuen Beleg erfassen oder Entwurf anlegen (POST /api/v1/vouchers)
      if (path === "/api/v1/vouchers" && method === "POST") {
        await ensureOperationalVouchers(env);
        const body = await request.json() as any;

        const isDraft = body.is_draft === true || body.status === "Draft";
        const voucherType = body.voucher_type || "Hospitality";
        const voucherDate = body.voucher_date || new Date().toISOString().split("T")[0];
        const supplierName = (body.supplier_name || "").trim() || (isDraft ? "Unbearbeiteter Beleg (Entwurf)" : "");
        const description = (body.description || "").trim() || `${voucherType} Beleg`;
        const businessPurpose = (body.business_purpose || "").trim() || (isDraft ? "Beleg im Eingangskorb zur späteren Bearbeitung" : "");

        if (!isDraft) {
          if (!supplierName) {
            return errorResponse("Bitte geben Sie den Namen des Lokals, Händlers oder Dienstleisters an.", 400);
          }
          if (voucherType === "Hospitality" && (!businessPurpose || businessPurpose.length < 5)) {
            return errorResponse("Bei Bewirtungsbelegen ist die Angabe des konkreten geschäftlichen Anlasses gesetzlich vorgeschrieben (§ 4 Abs. 5 EStG).", 400);
          }
        }

        const id = body.id || `vouch_${crypto.randomUUID().replace(/-/g, "")}`;
        
        // Laufende Belegnummer ermitteln falls neu
        let voucherNumber = body.voucher_number;
        if (!voucherNumber) {
          const countRow = await env.DB.prepare("SELECT COUNT(*) as c FROM operational_vouchers WHERE voucher_date LIKE ?").bind(`${voucherDate.substring(0, 7)}%`).first<any>();
          const seq = ((countRow?.c || 0) + 1).toString().padStart(4, "0");
          voucherNumber = `BEL-${voucherDate.substring(0, 4)}-${seq}`;
        }

        const amountGross = Number(body.amount_gross) || 0.0;
        const rawTaxRate = body.tax_rate !== undefined ? String(body.tax_rate) : "19";
        const isMixed = rawTaxRate === "mixed";
        const tax19Gross = Number(body.tax19_gross) || (isMixed ? 33.10 : 0.0);
        const tax7Gross = Number(body.tax7_gross) || (isMixed ? 127.40 : 0.0);
        const tax19Amount = Number((tax19Gross - (tax19Gross / 1.19)).toFixed(2));
        const tax7Amount = Number((tax7Gross - (tax7Gross / 1.07)).toFixed(2));

        let taxAmount = 0.0;
        let amountNet = 0.0;

        if (isMixed) {
          taxAmount = Number((tax19Amount + tax7Amount).toFixed(2));
          amountNet = Number((amountGross - taxAmount).toFixed(2));
        } else {
          const numRate = Number(rawTaxRate) || 0.0;
          amountNet = Number(body.amount_net) || (amountGross > 0 ? Number((amountGross / (1 + numRate / 100)).toFixed(2)) : 0.0);
          taxAmount = Number((amountGross - amountNet).toFixed(2));
        }

        const tipAmount = Number(body.tip_amount) || 0.0;

        // Bewirtungs-Splitting
        const totalAttendees = Number(body.total_attendees_count) || 1;
        const businessAttendees = Number(body.business_attendees_count) || totalAttendees;
        const businessSharePercent = Math.min(100, Math.max(0, (businessAttendees / totalAttendees) * 100));

        const businessGross = amountGross * (businessSharePercent / 100);
        const businessNet = amountNet * (businessSharePercent / 100);
        const taxDeductibleNet = businessNet * 0.70;
        const taxNonDeductibleNet = businessNet * 0.30;
        const privateShareGross = amountGross - businessGross;

        // SKR-Kontierung ermitteln
        let skr04 = body.skr04_account || "4650";
        let skr03 = body.skr03_account || "4650";
        if (voucherType === "LocalTransit") {
          skr04 = "4673";
          skr03 = "4673";
        } else if (voucherType === "GWG_Asset") {
          skr04 = "0485";
          skr03 = "0480";
        } else if (voucherType === "GeneralExpense") {
          skr04 = body.skr04_account || "4985";
          skr03 = body.skr03_account || "4985";
        }

        // Berechne GoBD-Daten-Hash
        const hashPayload = `${voucherNumber}|${voucherDate}|${supplierName}|${amountGross.toFixed(2)}|${taxDeductibleNet.toFixed(2)}|${skr04}`;
        const encoder = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", encoder.encode(hashPayload));
        const hashArray = Array.from(new Uint8Array(hashBuf));
        const sha256 = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

        const now = new Date().toISOString();
        const status = isDraft ? "Draft" : "Verified";

        await env.DB.prepare(`
          INSERT INTO operational_vouchers (
            id, voucher_number, voucher_type, voucher_date, supplier_name, description, business_purpose,
            project_id, customer_id, is_billable_to_client,
            amount_gross, amount_net, tax_rate, tax_amount, tip_amount,
            tax19_gross, tax7_gross, tax19_amount, tax7_amount,
            total_attendees_count, business_attendees_count, business_share_percent,
            tax_deductible_net, tax_non_deductible_net, private_share_gross,
            attendees_json, location_address,
            is_own_receipt, own_receipt_reason,
            transport_type, distance_km, origin_address, destination_address, parent_hospitality_voucher_id,
            skr04_account, skr03_account,
            receipt_r2_key, receipt_filename, receipt_mime_type,
            payment_slip_r2_key, payment_slip_filename, payment_slip_total_gross, payment_method,
            secondary_attachment_r2_key, secondary_attachment_filename,
            voucher_pdf_hash_sha256,
            created_at_utc, updated_at_utc, status
          ) VALUES (
            ?, ?, ?, ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?, ?,
            ?, ?, ?,
            ?, ?,
            ?, ?,
            ?, ?, ?, ?, ?,
            ?, ?,
            ?, ?, ?,
            ?, ?, ?, ?,
            ?, ?,
            ?,
            ?, ?, ?
          )
          ON CONFLICT(id) DO UPDATE SET
            voucher_type = excluded.voucher_type,
            voucher_date = excluded.voucher_date,
            supplier_name = excluded.supplier_name,
            description = excluded.description,
            business_purpose = excluded.business_purpose,
            project_id = excluded.project_id,
            customer_id = excluded.customer_id,
            is_billable_to_client = excluded.is_billable_to_client,
            amount_gross = excluded.amount_gross,
            amount_net = excluded.amount_net,
            tax_rate = excluded.tax_rate,
            tax_amount = excluded.tax_amount,
            tip_amount = excluded.tip_amount,
            tax19_gross = excluded.tax19_gross,
            tax7_gross = excluded.tax7_gross,
            tax19_amount = excluded.tax19_amount,
            tax7_amount = excluded.tax7_amount,
            total_attendees_count = excluded.total_attendees_count,
            business_attendees_count = excluded.business_attendees_count,
            business_share_percent = excluded.business_share_percent,
            tax_deductible_net = excluded.tax_deductible_net,
            tax_non_deductible_net = excluded.tax_non_deductible_net,
            private_share_gross = excluded.private_share_gross,
            attendees_json = excluded.attendees_json,
            location_address = excluded.location_address,
            is_own_receipt = excluded.is_own_receipt,
            own_receipt_reason = excluded.own_receipt_reason,
            transport_type = excluded.transport_type,
            distance_km = excluded.distance_km,
            origin_address = excluded.origin_address,
            destination_address = excluded.destination_address,
            parent_hospitality_voucher_id = excluded.parent_hospitality_voucher_id,
            skr04_account = excluded.skr04_account,
            skr03_account = excluded.skr03_account,
            receipt_r2_key = excluded.receipt_r2_key,
            receipt_filename = excluded.receipt_filename,
            receipt_mime_type = excluded.receipt_mime_type,
            payment_slip_r2_key = excluded.payment_slip_r2_key,
            payment_slip_filename = excluded.payment_slip_filename,
            payment_slip_total_gross = excluded.payment_slip_total_gross,
            payment_method = excluded.payment_method,
            secondary_attachment_r2_key = excluded.secondary_attachment_r2_key,
            secondary_attachment_filename = excluded.secondary_attachment_filename,
            voucher_pdf_hash_sha256 = excluded.voucher_pdf_hash_sha256,
            updated_at_utc = excluded.updated_at_utc,
            status = excluded.status
        `).bind(
          id, voucherNumber, voucherType, voucherDate, supplierName, description, businessPurpose,
          body.project_id || null, body.customer_id || null, body.is_billable_to_client ? 1 : 0,
          amountGross, amountNet, rawTaxRate, taxAmount, tipAmount,
          tax19Gross, tax7Gross, tax19Amount, tax7Amount,
          totalAttendees, businessAttendees, businessSharePercent,
          taxDeductibleNet, taxNonDeductibleNet, privateShareGross,
          typeof body.attendees_json === 'string' ? body.attendees_json : JSON.stringify(body.attendees_json || []), body.location_address || null,
          body.is_own_receipt ? 1 : 0, body.own_receipt_reason || null,
          body.transport_type || null, Number(body.distance_km) || 0.0, body.origin_address || null, body.destination_address || null, body.parent_hospitality_voucher_id || null,
          skr04, skr03,
          body.receipt_r2_key || null, body.receipt_filename || null, body.receipt_mime_type || null,
          body.payment_slip_r2_key || null, body.payment_slip_filename || null, Number(body.payment_slip_total_gross) || (tipAmount > 0 ? amountGross + tipAmount : 0.0), body.payment_method || "Card_NFC",
          body.secondary_attachment_r2_key || null, body.secondary_attachment_filename || null,
          sha256,
          now, now, status
        ).run();

        await logAuditEvent(env, {
          eventType: 'voucher_created',
          entityType: 'operational_voucher',
          entityId: id,
          actor: 'Freelancer',
          description: `Neuer Beleg ${voucherNumber} (${voucherType}, ${amountGross.toFixed(2)} €) erfasst`,
          dataPayload: { voucherNumber, voucherType, amountGross, taxDeductibleNet, sha256 }
        });

        return jsonResponse({
          success: true,
          voucherId: id,
          voucherNumber,
          dataHash: sha256,
          message: `Beleg ${voucherNumber} wurde GoBD-konform gespeichert.`
        });
      }

      // 20e. Einzelnen Beleg abrufen (GET /api/v1/vouchers/:id)
      const voucherGetMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)$/);
      if (voucherGetMatch && method === "GET") {
        await ensureOperationalVouchers(env);
        const vId = voucherGetMatch[1];
        const v = await env.DB.prepare(`
          SELECT v.*, 
                 p.name as project_name, p.project_number,
                 c.name as customer_name, c.customer_number
          FROM operational_vouchers v
          LEFT JOIN projects p ON v.project_id = p.id
          LEFT JOIN customers c ON v.customer_id = c.id
          WHERE v.id = ?
        `).bind(vId).first<any>();

        if (!v) return errorResponse("Beleg nicht gefunden.", 404);

        const { results: linkedTransit } = await env.DB.prepare(`
          SELECT * FROM operational_vouchers 
          WHERE parent_hospitality_voucher_id = ? 
          ORDER BY created_at_utc ASC
        `).bind(vId).all<any>();

        return jsonResponse({ success: true, voucher: v, linkedTransit: linkedTransit || [] });
      }

      // 20e-2. Verknüpfte Fahrtkosten löschen (vor Update) (DELETE /api/v1/vouchers/:id/linked-transit)
      const voucherLinkedTransitMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/linked-transit$/);
      if (voucherLinkedTransitMatch && method === "DELETE") {
        await ensureOperationalVouchers(env);
        const vId = voucherLinkedTransitMatch[1];
        await env.DB.prepare("DELETE FROM operational_vouchers WHERE parent_hospitality_voucher_id = ?").bind(vId).run();
        return jsonResponse({ success: true, message: "Verknüpfte Fahrten gelöscht." });
      }

      // 20f. Beleg löschen (DELETE /api/v1/vouchers/:id)
      if (voucherGetMatch && method === "DELETE") {
        await ensureOperationalVouchers(env);
        const vId = voucherGetMatch[1];
        const v = await env.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?").bind(vId).first<any>();
        if (!v) return errorResponse("Beleg nicht gefunden.", 404);

        await env.DB.prepare("DELETE FROM operational_vouchers WHERE id = ?").bind(vId).run();

        await logAuditEvent(env, {
          eventType: 'voucher_deleted',
          entityType: 'operational_voucher',
          entityId: vId,
          actor: 'Freelancer',
          description: `Beleg ${v.voucher_number} (${v.amount_gross} €) gelöscht`,
          dataPayload: { voucherNumber: v.voucher_number }
        });

        return jsonResponse({ success: true, message: `Beleg ${v.voucher_number} gelöscht.` });
      }


  // 20g. Lexware Office Beleg-Upload
  const voucherSyncMatch = path.match(/^\/api\/v1\/vouchers\/([a-zA-Z0-9_-]+)\/sync-lexware$/);
  if (voucherSyncMatch && method === "POST") {
    return syncVoucherToLexware(voucherSyncMatch[1], env);
  }

  return null;
}
