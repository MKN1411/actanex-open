import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { sendSystemEmail } from "../services/email.service";
import { getAuthenticatedUser } from "../services/auth.service";
import { ensureProjectColumns, ensureSettings } from "../services/db_bootstrap.service";
import { syncLexwareContactsInternal, fetchLexwareWithRetry } from "../services/lexware.service";

export async function handleTimesheetsApprovalRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

      if (path === "/api/v1/billing/pending-approvals" && method === "GET") {
        const { results: list } = await env.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.approver_email as default_approver_email, p.approver_name as default_approver_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person as customer_contact,
                 a.decision as approval_decision, a.approver_email as actual_approver_email, a.decision_at_utc
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          LEFT JOIN approvals a ON tv.id = a.timesheet_version_id
          WHERE p.is_archived = 0
          ORDER BY tv.created_at_utc DESC
        `).all<any>();

        return jsonResponse({
          success: true,
          approvals: list || []
        });
      }

      // 9. Abrechnungs-Hierarchie (Kunde -> Projekt -> Monat)
      if (path === "/api/v1/billing/hierarchy" && method === "GET") {
        const isDemo = isDemoRequest(request);

        try {
          if (!isDemo) {
            await syncLexwareContactsInternal(env);
          }
        } catch (e: any) {
          console.warn("Auto-sync Lexware contacts for billing failed silently:", e?.message || e);
        }

        const { results: customers } = await env.DB.prepare(
          isDemo
            ? "SELECT * FROM customers WHERE (id LIKE 'cust_demo_%') AND id != 'cust_internal' ORDER BY name ASC"
            : "SELECT * FROM customers WHERE id NOT LIKE 'cust_demo_%' AND id != 'cust_internal' ORDER BY name ASC"
        ).all<any>();

        const { results: projects } = await env.DB.prepare(
          isDemo
            ? "SELECT * FROM projects WHERE is_active = 1 AND is_archived = 0 AND (id LIKE 'prj_demo_%' OR customer_id LIKE 'cust_demo_%') AND (customer_id != 'cust_internal' OR customer_id IS NULL) ORDER BY name ASC"
            : "SELECT * FROM projects WHERE is_active = 1 AND is_archived = 0 AND id NOT LIKE 'prj_demo_%' AND (customer_id != 'cust_internal' OR customer_id IS NULL) AND (customer_id NOT LIKE 'cust_demo_%' OR customer_id IS NULL) ORDER BY name ASC"
        ).all<any>();

        const { results: timeEntries } = await env.DB.prepare(
          isDemo
            ? `SELECT t.*, p.customer_id, p.name as project_name, p.project_number, p.default_hourly_rate, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled, ae.deliverable, ae.result as evidence_result
               FROM time_entries t
               JOIN projects p ON t.project_id = p.id
               LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
               LEFT JOIN activity_evidences ae ON t.id = ae.time_entry_id
               WHERE (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%') AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
               ORDER BY t.entry_date DESC`
            : `SELECT t.*, p.customer_id, p.name as project_name, p.project_number, p.default_hourly_rate, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled, ae.deliverable, ae.result as evidence_result
               FROM time_entries t
               JOIN projects p ON t.project_id = p.id
               LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id
               LEFT JOIN activity_evidences ae ON t.id = ae.time_entry_id
               WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
               ORDER BY t.entry_date DESC`
        ).all<any>();

        const { results: trips } = await env.DB.prepare(
          isDemo
            ? `SELECT tr.*, p.customer_id, p.name as project_name, p.project_number, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
               FROM trips tr
               JOIN projects p ON tr.project_id = p.id
               LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
               WHERE (p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%')
                 AND tr.is_billable_to_client = 1
                 AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
                 AND (tr.status = 'Completed' OR tr.status IS NULL)
               ORDER BY tr.trip_date DESC`
            : `SELECT tr.*, p.customer_id, p.name as project_name, p.project_number, tv.status as ts_status, tv.lexware_invoice_number, tv.is_invoice_canceled
               FROM trips tr
               JOIN projects p ON tr.project_id = p.id
               LEFT JOIN timesheet_versions tv ON tr.timesheet_version_id = tv.id
               WHERE p.id NOT LIKE 'prj_demo_%'
                 AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
                 AND tr.is_billable_to_client = 1
                 AND (p.customer_id != 'cust_internal' OR p.customer_id IS NULL)
                 AND (tr.status = 'Completed' OR tr.status IS NULL)
               ORDER BY tr.trip_date DESC`
        ).all<any>();

        const { results: timesheetList } = await env.DB.prepare(
          isDemo
            ? `SELECT tv.*, p.customer_id, p.name as project_name, p.project_number
               FROM timesheet_versions tv
               JOIN projects p ON tv.project_id = p.id
               WHERE p.id LIKE 'prj_demo_%' OR p.customer_id LIKE 'cust_demo_%'
               ORDER BY tv.period DESC`
            : `SELECT tv.*, p.customer_id, p.name as project_name, p.project_number
               FROM timesheet_versions tv
               JOIN projects p ON tv.project_id = p.id
               WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL)
               ORDER BY tv.period DESC`
        ).all<any>();

        // Organisiere nach Kunde -> Projekt -> Monat
        const hierarchy = customers.map(cust => {
          const custProjects = projects.filter(p => p.customer_id === cust.id).map(proj => {
            const projEntries = timeEntries.filter(e => e.project_id === proj.id);
            const projTrips = trips.filter(tr => tr.project_id === proj.id);

            // Monate ermitteln
            const monthSet = new Set<string>();
            projEntries.forEach(e => { if (e.entry_date) monthSet.add(e.entry_date.substring(0, 7)); });
            projTrips.forEach(tr => { if (tr.trip_date && tr.is_billable_to_client) monthSet.add(tr.trip_date.substring(0, 7)); });
            timesheetList.filter(ts => ts.project_id === proj.id).forEach(ts => { if (ts.period) monthSet.add(ts.period); });

            const months = Array.from(monthSet).sort().reverse().map(period => {
              const monthEntries = projEntries.filter(e => e.entry_date?.startsWith(period));
              const monthTrips = projTrips.filter(tr => tr.trip_date?.startsWith(period) && tr.is_billable_to_client);
              const existingTs = timesheetList.filter(ts => ts.project_id === proj.id && ts.period === period).sort((a, b) => (b.version_number || 1) - (a.version_number || 1))[0];

              const totalHours = monthEntries.reduce((sum, e) => sum + (e.billable_duration_hours || 0), 0);
              const timeAmountNet = monthEntries.reduce((sum, e) => sum + ((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || proj.default_hourly_rate)), 0);
              const travelAmountNet = monthTrips.reduce((sum, tr) => sum + (tr.ticket_cost || (tr.distance_km * tr.rate_per_km) || 0), 0);
              const totalAmountNet = timeAmountNet + travelAmountNet;

              let status = existingTs?.status || "Draft";
              if (existingTs?.is_invoice_canceled === 1) {
                status = "InvoiceCanceled";
              }

              return {
                period,
                timesheetId: existingTs?.id || null,
                versionNumber: existingTs?.version_number || 1,
                status,
                rejectionReason: existingTs?.rejection_reason || null,
                lexwareInvoiceId: existingTs?.lexware_invoice_id || null,
                lexwareInvoiceNumber: existingTs?.lexware_invoice_number || null,
                isInvoiceCanceled: existingTs?.is_invoice_canceled === 1,
                approvedBy: existingTs?.approved_by || null,
                approvedAt: existingTs?.approved_at_utc || null,
                approvalMethod: existingTs?.approval_method || null,
                pdfFrozenHash: existingTs?.pdf_frozen_hash || null,
                entriesCount: monthEntries.length,
                tripsCount: monthTrips.length,
                totalHours,
                timeAmountNet,
                travelAmountNet,
                totalAmountNet,
                timeEntries: monthEntries,
                trips: monthTrips
              };
            });

            return {
              ...proj,
              months
            };
          }).filter(p => p.months && p.months.length > 0);

          if (custProjects.length === 0) return null;

          return {
            ...cust,
            projects: custProjects
          };
        }).filter(Boolean);

        return jsonResponse(hierarchy);
      }

      // 9b. Leistungsnachweis zur Unterzeichnung vorlegen (PDF Freeze mit selektiven Einträgen)
      if (path === "/api/v1/billing/submit-for-signature" && method === "POST") {
        const body = await request.json() as any;
        const { projectId, period, selectedTimeEntryIds, selectedTripIds } = body;
        if (!projectId || !period) return errorResponse("projectId und period erforderlich", 400);

        const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(projectId).first<any>();
        if (!project) return errorResponse("Projekt nicht gefunden", 404);

        // Hole alle Einträge des Monats
        const { results: allEntries } = await env.DB.prepare("SELECT * FROM time_entries WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).all<any>();
        const { results: allTrips } = await env.DB.prepare("SELECT * FROM trips WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).all<any>();

        const entries = selectedTimeEntryIds && Array.isArray(selectedTimeEntryIds)
          ? allEntries.filter(e => selectedTimeEntryIds.includes(e.id))
          : allEntries;

        const monthTrips = selectedTripIds && Array.isArray(selectedTripIds)
          ? allTrips.filter(tr => selectedTripIds.includes(tr.id))
          : allTrips;

        if (entries.length === 0 && monthTrips.length === 0) {
          return errorResponse("Bitte wählen Sie mindestens einen Zeiteintrag oder eine Reisekosten-Position aus.", 400);
        }

        const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
        const actualHours = entries.reduce((s, e) => s + (e.actual_duration_hours || e.billable_duration_hours || 0), 0);
        const timeNet = entries.reduce((s, e) => s + ((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || project.default_hourly_rate)), 0);
        const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || (tr.distance_km * tr.rate_per_km) || 0), 0);
        const totalNet = timeNet + travelNet;

        const { results: allTsForPeriod } = await env.DB.prepare("SELECT * FROM timesheet_versions WHERE project_id = ? AND period = ? ORDER BY version_number DESC").bind(projectId, period).all<any>();
        const latestTs = allTsForPeriod && allTsForPeriod.length > 0 ? allTsForPeriod[0] : null;

        let tsId: string;
        let versionNumber = 1;
        const now = new Date().toISOString();

        // Echte GoBD-Hashberechnung über alle selektierten Zeiteinträge und Reisekosten (Finding A08)
        const entriesPayload = entries
          .slice()
          .sort((a: any, b: any) => String(a.entry_date).localeCompare(String(b.entry_date)) || String(a.id).localeCompare(String(b.id)))
          .map((e: any) => `${e.id}:${e.entry_date}:${e.billable_duration_hours}:${e.billing_rate_snapshot || project.default_hourly_rate}`)
          .join(";");
        const tripsPayload = monthTrips
          .slice()
          .sort((a: any, b: any) => String(a.trip_date).localeCompare(String(b.trip_date)) || String(a.id).localeCompare(String(b.id)))
          .map((t: any) => `${t.id}:${t.trip_date}:${t.ticket_cost || (t.distance_km * t.rate_per_km) || 0}`)
          .join(";");
        const freezePayload = `${projectId}|${period}|${totalHours}|${totalNet}|${entriesPayload}|${tripsPayload}|${now}`;
        const freezeHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(freezePayload));
        const frozenHash = `SHA256_${Array.from(new Uint8Array(freezeHashBuf)).map(b => b.toString(16).padStart(2, '0')).join('')}`;

        // Wenn bereits eine Version freigegeben, storniert oder abgelehnt war: saubere neue Revision (v2.0, v3.0 etc.)
        if (latestTs && (latestTs.status === "Approved" || latestTs.status === "InvoiceCanceled" || latestTs.status === "Invoiced" || latestTs.status === "Rejected" || latestTs.is_invoice_canceled === 1)) {
          versionNumber = (latestTs.version_number || 1) + 1;
          tsId = `ts_${period.replace("-", "_")}_${projectId}_v${versionNumber}_${Date.now()}`;
          
          await env.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, supersedes_version_id, created_at_utc)
            VALUES (?, ?, ?, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, versionNumber, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, latestTs.id, now).run();
        } else if (latestTs) {
          // Vorhandene offene Version aktualisieren
          tsId = latestTs.id;
          versionNumber = latestTs.version_number || 1;
          await env.DB.prepare(`
            UPDATE timesheet_versions SET
              status = 'PendingSignature',
              total_actual_hours = ?,
              total_billable_hours = ?,
              total_reimbursable_expenses = ?,
              total_amount_net = ?,
              pdf_frozen_hash = ?,
              frozen_at_utc = ?,
              approved_at_utc = NULL,
              approved_by = NULL,
              approval_method = NULL,
              rejection_reason = NULL,
              lexware_invoice_id = NULL,
              lexware_invoice_number = NULL
            WHERE id = ?
          `).bind(actualHours, totalHours, travelNet, totalNet, frozenHash, now, tsId).run();
        } else {
          // Erste Version anlegen (v1.0)
          tsId = `ts_${period.replace("-", "_")}_${projectId}_v1_${Date.now()}`;
          await env.DB.prepare(`
            INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, pdf_frozen_hash, frozen_at_utc, created_at_utc)
            VALUES (?, ?, 1, ?, 'PendingSignature', ?, ?, 0, ?, ?, ?, ?, ?, ?)
          `).bind(tsId, projectId, period, actualHours, totalHours, travelNet, totalNet, frozenHash, frozenHash, now, now).run();
        }

        // Erst alle Posten des Projekts und Monats lösen
        await env.DB.prepare("UPDATE time_entries SET timesheet_version_id = NULL WHERE project_id = ? AND entry_date LIKE ?").bind(projectId, `${period}%`).run();
        await env.DB.prepare("UPDATE trips SET timesheet_version_id = NULL WHERE project_id = ? AND trip_date LIKE ?").bind(projectId, `${period}%`).run();

        // Verknüpfe NUR die selektierten Einträge mit diesem Timesheet
        for (const e of entries) {
          await env.DB.prepare("UPDATE time_entries SET timesheet_version_id = ? WHERE id = ?").bind(tsId, e.id).run();
        }
        for (const tr of monthTrips) {
          await env.DB.prepare("UPDATE trips SET timesheet_version_id = ? WHERE id = ?").bind(tsId, tr.id).run();
        }

        await logAuditEvent(env, {
          eventType: "TIMESHEET_SUBMITTED_FOR_SIGNATURE",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Leistungsnachweis für ${project.name} (${period}) zur Unterzeichnung vorgelegt. ${entries.length} Zeiteinträge & ${monthTrips.length} Reisekosten GoBD-gesperrt (Hash: ${frozenHash}).`
        });

        return jsonResponse({
          success: true,
          timesheetId: tsId,
          status: "PendingSignature",
          pdfFrozenHash: frozenHash,
          message: `Leistungsnachweis (${period}) liegt zur Unterzeichnung vor. ${entries.length} Zeiteinträge & ${monthTrips.length} Reisekosten wurden schreibgeschützt.`
        });
      }

      // 9b-2. Druck- und PDF-Daten für Leistungsnachweis (GET /api/v1/timesheets/:id/pdf-data)
      const pdfDataMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/pdf-data$/);
      if (pdfDataMatch && method === "GET") {
        const tsId = pdfDataMatch[1];
        const timesheet = await env.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first<any>();
        if (!timesheet) return errorResponse("Leistungsnachweis nicht gefunden", 404);

        const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?").bind(timesheet.project_id).first<any>();
        const customer = project ? await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(project.customer_id).first<any>() : null;

        const isLocked = timesheet.status === "Approved" || timesheet.status === "Invoiced";

        const { results: entries } = await env.DB.prepare(isLocked ? `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE t.timesheet_version_id = ? AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        ` : `
          SELECT t.*, ae.problem_statement, ae.methodology, ae.technical_activity, ae.result, ae.responsibility, ae.deliverable
          FROM time_entries t
          LEFT JOIN activity_evidences ae ON ae.time_entry_id = t.id
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.entry_date LIKE ? AND (t.timesheet_version_id IS NULL OR t.timesheet_version_id = '')))
            AND (t.billing_type IS NULL OR t.billing_type != 'InternalOnly')
          ORDER BY t.entry_date ASC, t.start_time ASC
        `).bind(...(isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`])).all<any>();

        const { results: trips } = await env.DB.prepare(isLocked ? `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE tr.timesheet_version_id = ?
          ORDER BY tr.trip_date ASC
        ` : `
          SELECT tr.*, COALESCE(tr.origin, tr.origin_location) as origin, COALESCE(tr.destination, tr.destination_location) as destination, COALESCE(tr.ticket_cost, tr.customer_reimbursable_cost) as ticket_cost
          FROM trips tr
          WHERE (tr.timesheet_version_id = ? OR (tr.project_id = ? AND tr.trip_date LIKE ? AND (tr.timesheet_version_id IS NULL OR tr.timesheet_version_id = '')))
            AND (tr.is_billable_to_client = 1 OR tr.is_billable_to_client IS NULL)
          ORDER BY tr.trip_date ASC
        `).bind(...(isLocked ? [tsId] : [tsId, timesheet.project_id, `${timesheet.period}%`])).all<any>();

        // Dynamische Summenberechnung für offene/korrigierte Nachweise
        if (!isLocked) {
          const totalHours = entries.reduce((s, e) => s + (e.is_billable !== 0 ? (e.billable_duration_hours || 0) : 0), 0);
          const hourlyRate = project?.default_hourly_rate || 0;
          const timeNet = entries.reduce((s, e) => s + (e.is_billable !== 0 ? ((e.billable_duration_hours || 0) * (e.billing_rate_snapshot || hourlyRate)) : 0), 0);
          const travelNet = trips.reduce((s, tr) => s + (tr.ticket_cost || (tr.distance_km * (tr.rate_per_km || 0.30)) || 0), 0);
          timesheet.total_billable_hours = totalHours;
          timesheet.total_reimbursable_expenses = travelNet;
          timesheet.total_amount_net = timeNet + travelNet;
        }

        const { results: approvals } = await env.DB.prepare("SELECT * FROM approvals WHERE timesheet_version_id = ? ORDER BY decision_at_utc DESC").bind(tsId).all<any>();

        return jsonResponse({
          timesheet,
          project,
          customer,
          entries,
          trips,
          approvals
        });
      }

      // 9c. Leistungsnachweis genehmigen (OTP oder manuell per E-Mail)
      const approveMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/approve$/);
      if (approveMatch && method === "POST") {
        const tsId = approveMatch[1];
        const body = await request.json() as any;
        const methodType = body.method || "ManualEmail";
        const approverName = body.approverName || "Kunde";
        const now = new Date().toISOString();

        const ts = await env.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first<any>();
        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);

        await env.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Approved',
            approval_method = ?,
            approved_by = ?,
            approved_at_utc = ?,
            rejection_reason = NULL
          WHERE id = ?
        `).bind(methodType, approverName, now, tsId).run();

        await logAuditEvent(env, {
          eventType: "TIMESHEET_APPROVED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: approverName,
          description: `Leistungsnachweis ${tsId} genehmigt via ${methodType}.`
        });

        return jsonResponse({ success: true, status: "Approved", message: `Leistungsnachweis wurde erfolgreich als genehmigt markiert (${methodType}).` });
      }

      // 9d. Leistungsnachweis ablehnen mit Begründung
      const rejectMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/reject$/);
      if (rejectMatch && method === "POST") {
        const tsId = rejectMatch[1];
        const body = await request.json() as any;
        const reason = body.reason || "Keine Begründung angegeben";
        const now = new Date().toISOString();

        const ts = await env.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(tsId).first<any>();
        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);

        await env.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Rejected',
            rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();

        await logAuditEvent(env, {
          eventType: "TIMESHEET_REJECTED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Kunde",
          description: `Leistungsnachweis ${tsId} abgelehnt. Begründung: ${reason}`
        });

        return jsonResponse({ success: true, status: "Rejected", message: `Leistungsnachweis wurde abgelehnt.` });
      }

      // 9e. Rechnung in Lexware Office erstellen
      const createInvoiceMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/create-invoice$/);
      if (createInvoiceMatch && method === "POST") {
        const tsId = createInvoiceMatch[1];
        if (!env.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);

        const ts = await env.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.project_number, p.default_hourly_rate, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first<any>();

        if (!ts) return errorResponse("Leistungsnachweis nicht gefunden", 404);
        if (ts.status !== "Approved" && ts.status !== "InvoiceCanceled") {
          return errorResponse(`Rechnung kann nur für genehmigte Leistungsnachweise erstellt werden (Aktueller Status: ${ts.status}).`, 400);
        }

        const { results: entries } = await env.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(tsId).all<any>();
        const { results: monthTrips } = await env.DB.prepare("SELECT * FROM trips WHERE timesheet_version_id = ?").bind(tsId).all<any>();

        const totalHours = entries.reduce((s, e) => s + (e.billable_duration_hours || 0), 0);
        const hourlyRate = ts.default_hourly_rate || 135.0;
        const travelNet = monthTrips.reduce((s, tr) => s + (tr.ticket_cost || (tr.distance_km * tr.rate_per_km) || 0), 0);

        const lineItems: any[] = [];
        if (totalHours > 0) {
          lineItems.push({
            type: "custom",
            name: `Beratungs- & Architekturleistungen (${ts.period})`,
            description: `Projekt: ${ts.project_name} (${ts.project_number})\nLeistungszeitraum: ${ts.period}\nAbgerechnete Stunden: ${totalHours.toFixed(2)} Std. à ${hourlyRate.toFixed(2)} €/h Netto gem. freigegebenem Leistungsnachweis.`,
            quantity: totalHours,
            unitName: "Stunde",
            unitPrice: {
              currency: "EUR",
              netAmount: hourlyRate,
              taxRatePercentage: 19.0
            }
          });
        }

        if (travelNet > 0) {
          lineItems.push({
            type: "custom",
            name: `Reisekosten & Auslagen (${ts.period})`,
            description: `Reisekosten / Fahrten im Leistungszeitraum ${ts.period} gem. Leistungsnachweis.`,
            quantity: 1,
            unitName: "Pauschal",
            unitPrice: {
              currency: "EUR",
              netAmount: travelNet,
              taxRatePercentage: 19.0
            }
          });
        }

        const invoicePayload = {
          voucherDate: new Date().toISOString(),
          address: {
            name: ts.customer_name || "Kunde",
            contactId: ts.lexware_contact_id,
            street: ts.street || null,
            zip: ts.zip_code || null,
            city: ts.city || null,
            countryCode: ts.country_code || "DE"
          },
          lineItems,
          totalPrice: { currency: "EUR" },
          taxConditions: { taxType: "net" },
          shippingConditions: {
            shippingDate: new Date().toISOString(),
            shippingType: "service"
          },
          paymentConditions: {
            paymentTermLabel: "Zahlbar innerhalb von 14 Tagen rein netto",
            paymentTermDuration: 14
          },
          introduction: `Sehr geehrte Damen und Herren,\n\nfür die vereinbarten und freigegebenen Leistungen stellen wir Ihnen folgende Positionen in Rechnung:`,
          remark: `Rechnung zu Leistungsnachweis ${ts.id} (${ts.period}). Vielen Dank für die angenehme Zusammenarbeit.`
        };

        const invRes = await fetch("https://api.lexware.io/v1/invoices", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${env.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify(invoicePayload)
        });

        if (!invRes.ok) {
          const errText = await invRes.text();
          return errorResponse(`Lexware Invoice API Fehler: ${errText}`, 400);
        }

        const invData = await invRes.json() as any;
        const lexwareInvoiceId = invData.id;
        let lexwareInvoiceNumber = null;

        try {
          const invDetailRes = await fetch(`https://api.lexware.io/v1/invoices/${lexwareInvoiceId}`, {
            headers: { "Authorization": `Bearer ${env.LEXWARE_API_KEY}`, "Accept": "application/json" }
          });
          if (invDetailRes.ok) {
            const invDetail = await invDetailRes.json() as any;
            lexwareInvoiceNumber = invDetail.voucherNumber || null;
          }
        } catch {}

        await env.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            lexware_invoice_id = ?,
            lexware_invoice_number = ?,
            is_invoice_canceled = 0
          WHERE id = ?
        `).bind(lexwareInvoiceId, lexwareInvoiceNumber, tsId).run();

        await logAuditEvent(env, {
          eventType: "INVOICE_CREATED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Rechnung in Lexware erstellt (ID: ${lexwareInvoiceId}, Beleg-Nr: ${lexwareInvoiceNumber || 'Erstellt'}).`
        });

        return jsonResponse({
          success: true,
          status: "Invoiced",
          lexwareInvoiceId,
          lexwareInvoiceNumber,
          message: `Rechnung in Lexware erfolgreich erstellt (Beleg-Nr: ${lexwareInvoiceNumber || lexwareInvoiceId})!`
        });
      }

      // 9f. Stand-Alone Modus: Rechnung manuell als extern abgerechnet markieren
      const markInvoicedMatch = path.match(/^\/api\/v1\/billing\/([a-zA-Z0-9_-]+)\/mark-invoiced$/);
      if (markInvoicedMatch && method === "POST") {
        const tsId = markInvoicedMatch[1];
        const body = await request.json() as any || {};
        const invoiceNumber = (body.invoiceNumber || "").trim();
        const invoiceDate = body.invoiceDate || new Date().toISOString().split("T")[0];

        if (!invoiceNumber) {
          return errorResponse("Bitte geben Sie eine externe Rechnungsnummer an.", 400);
        }

        const now = new Date().toISOString();
        await env.DB.prepare(`
          UPDATE timesheet_versions SET
            status = 'Invoiced',
            external_invoice_number = ?,
            external_invoice_date = ?,
            updated_at_utc = ?
          WHERE id = ?
        `).bind(invoiceNumber, invoiceDate, now, tsId).run();

        await logAuditEvent(env, {
          eventType: "TIMESHEET_MANUALLY_INVOICED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Admin",
          description: `Stundenzettel manuell als abgerechnet markiert (Rechnungsnummer: ${invoiceNumber}, Datum: ${invoiceDate}).`
        });

        return jsonResponse({
          success: true,
          status: "Invoiced",
          externalInvoiceNumber: invoiceNumber,
          externalInvoiceDate: invoiceDate,
          message: `Stundenzettel erfolgreich als abgerechnet markiert (Rechnung: ${invoiceNumber})!`
        });
      }

      // 10. Revisionssichere Kopie erstellen
      const cloneMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/clone-revision$/);
      if (cloneMatch && method === "POST") {
        const sourceTsId = cloneMatch[1];
        const sourceTs = await env.DB.prepare("SELECT * FROM timesheet_versions WHERE id = ?").bind(sourceTsId).first<any>();

        if (!sourceTs) {
          return errorResponse("Ausgangs-Stundenzettel nicht gefunden", 404);
        }

        const newTsId = `ts_${sourceTs.period.replace("-", "_")}_v${sourceTs.version_number + 1}_${Date.now()}`;
        const newVersionNumber = sourceTs.version_number + 1;
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO timesheet_versions (id, project_id, version_number, period, status, total_actual_hours, total_billable_hours, total_billable_travel_hours, total_reimbursable_expenses, total_amount_net, data_hash_sha256, supersedes_version_id, created_at_utc)
          VALUES (?, ?, ?, ?, 'Draft', ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newTsId,
          sourceTs.project_id,
          newVersionNumber,
          sourceTs.period,
          sourceTs.total_actual_hours,
          sourceTs.total_billable_hours,
          sourceTs.total_billable_travel_hours,
          sourceTs.total_reimbursable_expenses,
          sourceTs.total_amount_net,
          "PENDING_RECALCULATION",
          sourceTsId,
          now
        ).run();

        const { results: oldEntries } = await env.DB.prepare("SELECT * FROM time_entries WHERE timesheet_version_id = ?").bind(sourceTsId).all<any>();
        for (const entry of oldEntries) {
          const newEntryId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot, created_at_utc)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `).bind(
            newEntryId,
            entry.project_id,
            newTsId,
            entry.entry_date,
            entry.start_time,
            entry.end_time,
            entry.break_minutes,
            entry.actual_duration_hours,
            entry.billable_duration_hours,
            entry.category,
            entry.location || "Remote",
            entry.short_description,
            entry.task_or_ticket_reference,
            entry.is_billable,
            entry.billing_rate_snapshot,
            now
          ).run();
        }

        await logAuditEvent(env, {
          eventType: "REVISION_CLONED",
          entityType: "timesheet_version",
          entityId: newTsId,
          actor: "Admin",
          description: `Revisionskopie v${newVersionNumber} aus Stundenzettel ${sourceTsId} erzeugt.`
        });

        return jsonResponse({
          success: true,
          newTimesheetId: newTsId,
          versionNumber: newVersionNumber,
          message: `Neue Revision v${newVersionNumber} wurde als Entwurf erstellt.`
        });
      }

      // 12. ÖFFENTLICHE KUNDENFREIGABE (Zero-Trust Portal mit Capability-Token-Prüfung)
      const publicApprovalMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/approval-data$/);
      if (publicApprovalMatch && method === "GET") {
        await ensureProjectColumns(env);
        const tsId = publicApprovalMatch[1];
        const url = new URL(request.url);
        const providedToken = url.searchParams.get("token") || request.headers.get("x-approval-token") || "";
        const authUser = await getAuthenticatedUser(request, env).catch(() => null);

        const ts = await env.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.project_number, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name, 
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first<any>();

        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }

        // Token-Prüfung (Finding B02): Anonyme Aufrufe erfordern ein gültiges Token
        if (!authUser) {
          if (!providedToken) {
            return errorResponse("Zugriff verweigert. Gültiges Freigabetoken erforderlich.", 403);
          }
          if (ts.approval_token && ts.approval_token !== providedToken) {
            return errorResponse("Ungültiges Freigabetoken.", 403);
          }
        }

        const { results: entries } = await env.DB.prepare(`
          SELECT id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_rate_snapshot
          FROM time_entries
          WHERE timesheet_version_id = ? OR (project_id = ? AND entry_date LIKE ?)
          ORDER BY entry_date ASC, start_time ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all<any>();

        const { results: trips } = await env.DB.prepare(`
          SELECT t.*, 
            (SELECT COALESCE(SUM(te.amount_net), 0) FROM trip_expenses te WHERE te.trip_id = t.id AND te.is_billable_to_client = 1) as total_expenses_net
          FROM trips t
          WHERE (t.timesheet_version_id = ? OR (t.project_id = ? AND t.trip_date LIKE ?)) AND t.is_billable_to_client = 1
          ORDER BY t.trip_date ASC
        `).bind(tsId, ts.project_id, `${ts.period}%`).all<any>();

        // Liste aller autorisierten Freigabe-Empfänger zusammenstellen
        const authorizedApprovers = [];
        if (ts.approver_email) {
          authorizedApprovers.push({ name: ts.approver_name || "1. Freigabeberechtigter", email: ts.approver_email, role: "Hauptfreigebender" });
        }
        if (ts.approver_2_email) {
          authorizedApprovers.push({ name: ts.approver_2_name || "2. Freigabeberechtigter", email: ts.approver_2_email, role: "Endkunde / Fachverantwortlicher" });
        }
        if (ts.approver_3_email) {
          authorizedApprovers.push({ name: ts.approver_3_name || "3. Freigabeberechtigter", email: ts.approver_3_email, role: "Projektleitung" });
        }
        if (authorizedApprovers.length === 0 && ts.customer_email) {
          authorizedApprovers.push({ name: ts.contact_person || ts.customer_name, email: ts.customer_email, role: "Kooperationspartner" });
        }

        return jsonResponse({
          success: true,
          timesheet: {
            id: ts.id,
            period: ts.period,
            versionNumber: ts.version_number,
            status: ts.status,
            totalActualHours: ts.total_actual_hours,
            totalBillableHours: ts.total_billable_hours,
            totalReimbursableExpenses: ts.total_reimbursable_expenses,
            totalAmountNet: ts.total_amount_net,
            dataHashSha256: ts.data_hash_sha256,
            approvedAt: ts.approved_at_utc,
            approvedBy: ts.approved_by,
            approvalMethod: ts.approval_method,
            rejectionReason: ts.rejection_reason,
            signedDocumentR2Key: ts.signed_document_r2_key,
            signedDocumentFilename: ts.signed_document_filename
          },
          project: {
            name: ts.project_name,
            projectNumber: ts.project_number,
            endCustomerName: ts.end_customer_name || null,
            hourlyRate: ts.default_hourly_rate,
            approverEmail: ts.approver_email || ts.customer_email,
            approverName: ts.approver_name || ts.contact_person,
            approver2Email: ts.approver_2_email || null,
            approver2Name: ts.approver_2_name || null,
            approver3Email: ts.approver_3_email || null,
            approver3Name: ts.approver_3_name || null
          },
          customer: {
            name: ts.customer_name,
            contactPerson: ts.contact_person
          },
          authorizedApprovers,
          entries,
          trips
        });
      }

      // 13. OTP Code anfordern (Öffentlich / Kundenseitig)
      const requestOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/request-otp|otp\/request)$/);
      if (requestOtpMatch && method === "POST") {
        await ensureSettings(env);
        await ensureProjectColumns(env);
        const body = await request.json() as any;
        const timesheetId = requestOtpMatch[1] || body.timesheetId;
        const email = (body.email || "").trim().toLowerCase();

        if (!timesheetId || !email) {
          return errorResponse("timesheetId und email sind erforderlich", 400);
        }

        const ts = await env.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.end_customer_name,
                 p.approver_email, p.approver_name,
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.email as customer_email, c.contact_person
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(timesheetId).first<any>();

        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }

        // Autorisierungsprüfung: E-Mail muss einem berechtigten Freigeber entsprechen (Finding A03)
        const authorizedApprovers = [
          ts.approver_email?.toLowerCase(),
          ts.approver_2_email?.toLowerCase(),
          ts.approver_3_email?.toLowerCase(),
          ts.customer_email?.toLowerCase(),
        ].filter(Boolean);

        if (!authorizedApprovers.includes(email)) {
          return errorResponse("Die angegebene E-Mail-Adresse ist nicht als autorisierter Freigebender für dieses Projekt hinterlegt.", 403);
        }

        // Ermittle Namen des Empfängers
        let recipientName = ts.contact_person || ts.customer_name;
        if (ts.approver_email && ts.approver_email.toLowerCase() === email) recipientName = ts.approver_name || recipientName;
        if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === email) recipientName = ts.approver_2_name || recipientName;
        if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === email) recipientName = ts.approver_3_name || recipientName;

        const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
        const otpHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        const now = new Date().toISOString();

        await env.DB.prepare(`
          INSERT INTO otp_verifications (id, timesheet_id, email, otp_code_hash, expires_at_utc, attempts, is_verified, created_at_utc)
          VALUES (?, ?, ?, ?, ?, 0, 0, ?)
        `).bind(crypto.randomUUID(), timesheetId, email, otpHash, expiresAt, now).run();

        // E-Mail mit OTP-Code versenden
        const mailSubject = `Ihr Bestätigungscode für ${ts.project_name}`;
        const mailText = `Guten Tag ${recipientName},\n\nIhr 6-stelliger Einmalcode zur Freigabe des Leistungsnachweises für das Projekt "${ts.project_name}" (Abrechnungsmonat ${ts.period}) lautet:\n\n👉  ${otpCode}  👈\n\nDieser Code ist 15 Minuten gültig.\n\nMit freundlichen Grüßen,\n${ts.customer_name}`;

        await sendSystemEmail(env, {
          to: email,
          subject: mailSubject,
          text: mailText
        });

        await logAuditEvent(env, {
          eventType: "OTP_REQUESTED",
          entityType: "timesheet_version",
          entityId: timesheetId,
          actor: email,
          description: `6-stelliger OTP-Freigabecode für '${email}' angefordert (15 Min. Gültigkeit).`
        });

        return jsonResponse({
          success: true,
          message: `Ein 6-stelliger Freigabecode wurde an ${email} gesendet.`
        });
      }

      // 14. OTP Code verifizieren & Freigeben (Digital oder via hochgeladenem Dokument)
      const verifyOtpMatch = path.match(/^\/api\/v1\/(?:public\/)?(?:timesheets\/([a-zA-Z0-9_-]+)\/verify-otp|otp\/verify)$/);
      if (verifyOtpMatch && method === "POST") {
        const body = await request.json() as any;
        const timesheetId = verifyOtpMatch[1] || body.timesheetId;
        const email = (body.email || "").trim().toLowerCase();
        const otpCode = (body.otpCode || body.code || "").trim();

        if (!timesheetId || !otpCode) {
          return errorResponse("timesheetId und otpCode sind erforderlich", 400);
        }

        const enc = new TextEncoder();
        const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
        const otpHash = Array.from(new Uint8Array(hashBuf)).map(b => b.toString(16).padStart(2, '0')).join('');

        const validOtp = await env.DB.prepare(`
          SELECT * FROM otp_verifications
          WHERE timesheet_id = ? AND otp_code_hash = ? AND is_verified = 0 AND datetime(expires_at_utc) > datetime('now')
          ORDER BY created_at_utc DESC LIMIT 1
        `).bind(timesheetId, otpHash).first<any>();

        if (!validOtp) {
          return errorResponse("Der eingegebene Freigabecode ist ungültig oder abgelaufen (15 Min. Gültigkeit). Bitte fordern Sie einen neuen Code an.", 403);
        }

        // B04 Schutz: E-Mail-Spoofing verhindern
        if (email && email !== validOtp.email.toLowerCase()) {
          return errorResponse("E-Mail-Adresse stimmt nicht mit dem Empfänger des Freigabecodes überein.", 403);
        }
        const approverEmail = validOtp.email;

        // Atomares Entwerten des OTP-Codes (Schutz vor Replay / parallelen Requests)
        const updateOtpRes = await env.DB.prepare(
          "UPDATE otp_verifications SET is_verified = 1 WHERE id = ? AND is_verified = 0"
        ).bind(validOtp.id).run();

        if (updateOtpRes.meta.changes === 0) {
          return errorResponse("Freigabecode wurde bereits eingelöst.", 409);
        }

        const now = new Date().toISOString();
        const rawIp = request.headers.get("CF-Connecting-IP") || "127.0.0.1";
        const maskedIp = rawIp.replace(/\.\d+$/, ".xxx");
        const country = request.headers.get("CF-IPCountry") || "DE";
        const userAgent = request.headers.get("User-Agent") || "Browser";

        // B05 Schutz: Echter kanonischer SHA-256 Hash des freigegebenen Leistungsnachweises
        const tsSummary = await env.DB.prepare(`
          SELECT tv.id, tv.period, tv.total_actual_hours, tv.total_billable_hours, tv.total_amount_net,
                 p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(timesheetId).first<any>();

        const { results: tsEntries } = await env.DB.prepare(`
          SELECT id, entry_date, start_time, end_time, actual_duration_hours, billable_duration_hours, short_description
          FROM time_entries
          WHERE timesheet_version_id = ?
          ORDER BY entry_date ASC, id ASC
        `).bind(timesheetId).all<any>();

        const canonicalPayload = JSON.stringify({
          timesheet: tsSummary || { id: timesheetId },
          entries: tsEntries || [],
          approvedBy: approverEmail,
          approvalMethod: "VerifiedOTP",
          approvedAtUtc: now
        });
        const docHashBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(canonicalPayload));
        const realDocumentHash = Array.from(new Uint8Array(docHashBuf)).map(b => b.toString(16).padStart(2, "0")).join("");

        await env.DB.prepare(`
          UPDATE timesheet_versions 
          SET status = 'Approved', approved_at_utc = ?, approval_method = 'VerifiedOTP', approved_by = ?, document_hash = ?
          WHERE id = ?
        `).bind(now, approverEmail, realDocumentHash, timesheetId).run();

        const approvalId = crypto.randomUUID();
        await env.DB.prepare(`
          INSERT INTO approvals (id, timesheet_version_id, decision, method, approver_email, bound_document_hash_sha256, client_ip, user_agent, decision_at_utc)
          VALUES (?, ?, 'Approve', 'CustomerOTP', ?, ?, ?, ?, ?)
        `).bind(
          approvalId,
          timesheetId,
          approverEmail,
          realDocumentHash,
          `${maskedIp} (${country})`,
          userAgent,
          now
        ).run();

        await logAuditEvent(env, {
          eventType: "TIMESHEET_APPROVED_OTP",
          entityType: "timesheet_version",
          entityId: timesheetId,
          actor: approverEmail,
          description: `Leistungsnachweis durch Auftraggeber freigegeben (Hash: ${realDocumentHash.substring(0, 16)}..., IP: ${maskedIp}, Land: ${country}).`
        });

        return jsonResponse({
          success: true,
          status: "Approved",
          approvedAt: now,
          approvedBy: email || validOtp.email,
          message: "Leistungsnachweis wurde erfolgreich freigegeben."
        });
      }

      // 15. Ablehnung durch Kunden mit Begründung (Öffentlich)
      const rejectPublicMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/reject$/);
      if (rejectPublicMatch && method === "POST") {
        await ensureSettings(env);
        const tsId = rejectPublicMatch[1];
        const body = await request.json() as any;
        const reason = (body.reason || "").trim();
        const email = (body.email || "Kunde").trim();

        if (!reason) {
          return errorResponse("Bitte geben Sie eine Begründung für die Ablehnung bzw. Korrekturanforderung an.", 400);
        }

        const ts = await env.DB.prepare(`
          SELECT tv.*, p.name as project_name, c.name as customer_name
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first<any>();

        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }

        await env.DB.prepare(`
          UPDATE timesheet_versions
          SET status = 'Rejected', rejection_reason = ?
          WHERE id = ?
        `).bind(reason, tsId).run();

        await logAuditEvent(env, {
          eventType: "TIMESHEET_REJECTED_BY_CLIENT",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: email,
          description: `Leistungsnachweis durch Kunde abgelehnt. Begründung: "${reason}".`
        });

        // Benachrichtigung an Admin
        const settings = await env.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first<any>();
        if (settings?.email_admin_notify_rejection !== 0) {
          const adminMail = settings?.email_sender_email || "admin@example.com";
          const mailSubject = `⚠️ Korrekturanforderung: Leistungsnachweis ${ts.period} (${ts.project_name})`;
          const mailText = `Hallo,\n\nder Kunde/Auftraggeber (${ts.customer_name}, ${email}) hat den Leistungsnachweis für den Zeitraum ${ts.period} im Projekt "${ts.project_name}" abgelehnt bzw. eine Korrektur angefordert.\n\nBegründung des Kunden:\n"${reason}"\n\nBitte prüfen Sie den Nachweis im ActaNex Dashboard.\n\nStatus: Rejected`;

          await sendSystemEmail(env, {
            to: adminMail,
            subject: mailSubject,
            text: mailText
          });
        }

        return jsonResponse({
          success: true,
          status: "Rejected",
          message: "Ihre Korrekturanforderung wurde erfolgreich an den Auftragnehmer übermittelt."
        });
      }

      // 16. Upload eines unterschriebenen Dokuments (Hybrid-Signatur)
      const uploadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/upload-signed-document$/);
      if (uploadSignedMatch && method === "POST") {
        const tsId = uploadSignedMatch[1];
        const formData = await request.formData();
        const file = formData.get("file") as File | null;

        if (!file) {
          return errorResponse("Keine Datei zum Upload übergeben", 400);
        }

        const safeFilename = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const r2Key = `signed-approvals/${tsId}_${Date.now()}_${safeFilename}`;
        const arrayBuffer = await file.arrayBuffer();

        await env.STORAGE.put(r2Key, arrayBuffer, {
          httpMetadata: { contentType: file.type || "application/pdf" },
          customMetadata: { timesheetId: tsId, originalFilename: file.name }
        });

        await env.DB.prepare(`
          UPDATE timesheet_versions
          SET signed_document_r2_key = ?, signed_document_filename = ?
          WHERE id = ?
        `).bind(r2Key, file.name, tsId).run();

        await logAuditEvent(env, {
          eventType: "SIGNED_DOCUMENT_UPLOADED",
          entityType: "timesheet_version",
          entityId: tsId,
          actor: "Client / Admin",
          description: `Unterschriebenes Dokument '${file.name}' hochgeladen und in R2 archiviert.`
        });

        return jsonResponse({
          success: true,
          r2Key,
          filename: file.name,
          message: `Unterschriebenes Dokument '${file.name}' erfolgreich hochgeladen!`
        });
      }

      // 17. Download des unterschriebenen Dokuments
      const downloadSignedMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/download-signed-document$/);
      if (downloadSignedMatch && method === "GET") {
        const tsId = downloadSignedMatch[1];
        const ts = await env.DB.prepare("SELECT signed_document_r2_key, signed_document_filename FROM timesheet_versions WHERE id = ?").bind(tsId).first<any>();

        if (!ts || !ts.signed_document_r2_key) {
          return errorResponse("Kein signiertes Dokument für diesen Nachweis hinterlegt.", 404);
        }

        const object = await env.STORAGE.get(ts.signed_document_r2_key);
        if (!object) {
          return errorResponse("Dokument in R2 nicht gefunden", 404);
        }

        const headers = new Headers();
        headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
        headers.set("Content-Disposition", `inline; filename="${ts.signed_document_filename || 'signed_timesheet.pdf'}"`);
        headers.set("Access-Control-Allow-Origin", "*");

        return new Response(object.body, { headers });
      }

      // 17b. PDF-Download für Leistungsnachweis (/api/v1/timesheets/:id/pdf)
      const downloadPdfMatch = path.match(/^\/api\/v1\/(?:public\/)?timesheets\/([a-zA-Z0-9_-]+)\/pdf$/);
      if (downloadPdfMatch && method === "GET") {
        const tsId = downloadPdfMatch[1];
        const ts = await env.DB.prepare("SELECT signed_document_r2_key, signed_document_filename FROM timesheet_versions WHERE id = ?").bind(tsId).first<any>();

        if (ts && ts.signed_document_r2_key) {
          const object = await env.STORAGE.get(ts.signed_document_r2_key);
          if (object) {
            const headers = new Headers();
            headers.set("Content-Type", object.httpMetadata?.contentType || "application/pdf");
            headers.set("Content-Disposition", `attachment; filename="${ts.signed_document_filename || 'timesheet.pdf'}"`);
            headers.set("Access-Control-Allow-Origin", "*");
            return new Response(object.body, { headers });
          }
        }
        return errorResponse("Kein druckfertiges PDF für diesen Nachweis hinterlegt.", 404);
      }

      // 18. E-Mail Einladung an Kunden/Approver versenden (Admin Action)
      const sendEmailMatch = path.match(/^\/api\/v1\/timesheets\/([a-zA-Z0-9_-]+)\/send-approval-email$/);
      if (sendEmailMatch && method === "POST") {
        await ensureSettings(env);
        await ensureProjectColumns(env);
        const tsId = sendEmailMatch[1];
        const bodyReq = await request.json().catch(() => ({})) as any;
        const ts = await env.DB.prepare(`
          SELECT tv.*, 
                 p.name as project_name, p.default_hourly_rate, p.end_customer_name,
                 p.approver_email, p.approver_name, 
                 p.approver_2_email, p.approver_2_name,
                 p.approver_3_email, p.approver_3_name,
                 c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.id = ?
        `).bind(tsId).first<any>();

        if (!ts) {
          return errorResponse("Leistungsnachweis nicht gefunden", 404);
        }

        // Liste aller Empfänger ermitteln
        let recipientEmails: string[] = [];
        if (bodyReq.recipientEmails && Array.isArray(bodyReq.recipientEmails) && bodyReq.recipientEmails.length > 0) {
          recipientEmails = bodyReq.recipientEmails.filter(Boolean);
        } else if (bodyReq.email) {
          recipientEmails = [bodyReq.email];
        } else {
          const list = [ts.approver_email, ts.approver_2_email, ts.approver_3_email, ts.customer_email].filter(Boolean);
          recipientEmails = Array.from(new Set(list));
        }

        if (recipientEmails.length === 0) {
          return errorResponse("Keine Freigabe-E-Mail-Adresse beim Kunden/Projekt hinterlegt.", 400);
        }

        const settings = await env.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first<any>();
        const origin = new URL(request.url).origin;
        const approvalLink = `${origin}/?portal=approve&token=${tsId}`;
        const senderName = settings?.email_sender_name || "ActaNex Admin";

        let subject = settings?.email_subject_template || "Freigabe Leistungsnachweis {period} für Projekt {projectName}";
        subject = subject.replace("{period}", ts.period).replace("{projectName}", ts.project_name).replace("{customerName}", ts.customer_name);

        for (const recipientEmail of recipientEmails) {
          let contactPerson = ts.contact_person || "Auftraggeber";
          if (ts.approver_email && ts.approver_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_name || contactPerson;
          if (ts.approver_2_email && ts.approver_2_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_2_name || contactPerson;
          if (ts.approver_3_email && ts.approver_3_email.toLowerCase() === recipientEmail.toLowerCase()) contactPerson = ts.approver_3_name || contactPerson;

          let body = settings?.email_body_template || `Sehr geehrte(r) {contactPerson},\n\nfür das Projekt "{projectName}" ({customerName}) liegt der Tätigkeits- und Leistungsnachweis für den Abrechnungszeitraum {period} zur Prüfung und Freigabe bereit.\n\nÜbersicht:\n• Projekt: {projectName}\n• Zeitraum: {period}\n• Geleistete Stunden: {hours} Std.\n• Gesamtbetrag (Netto): {amountNet} €\n\nBitte prüfen und signieren Sie den Leistungsnachweis über folgenden Freigabelink:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
          
          body = body
            .replace(/{contactPerson}/g, contactPerson)
            .replace(/{projectName}/g, ts.project_name)
            .replace(/{customerName}/g, ts.customer_name)
            .replace(/{period}/g, ts.period)
            .replace(/{hours}/g, (ts.total_billable_hours || 0).toFixed(2))
            .replace(/{amountNet}/g, (ts.total_amount_net || 0).toFixed(2))
            .replace(/{approvalLink}/g, approvalLink)
            .replace(/{senderName}/g, senderName);

          await sendSystemEmail(env, {
            to: recipientEmail,
            subject,
            text: body
          });

          await logAuditEvent(env, {
            eventType: "APPROVAL_EMAIL_SENT",
            entityType: "timesheet_version",
            entityId: tsId,
            actor: "Admin",
            description: `Freigabe-Einladung per E-Mail an '${recipientEmail}' gesendet.`
          });
        }

        return jsonResponse({
          success: true,
          recipients: recipientEmails,
          approvalLink,
          message: `Freigabe-E-Mail wurde erfolgreich an ${recipientEmails.join(", ")} versendet!`
        });
      }

      // 19. Mahnwesen & Erinnerungen prüfen & versenden (3 Tage / 5 Tage)
      if (path === "/api/v1/timesheets/send-reminders" && method === "POST") {
        await ensureSettings(env);
        const settings = await env.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first<any>();
        const adminMail = settings?.email_sender_email || "admin@example.com";
        const senderName = settings?.email_sender_name || "ActaNex Admin";

        const { results: pendingList } = await env.DB.prepare(`
          SELECT tv.*, p.name as project_name, p.approver_email, p.approver_name, c.name as customer_name, c.contact_person, c.email as customer_email
          FROM timesheet_versions tv
          JOIN projects p ON tv.project_id = p.id
          JOIN customers c ON p.customer_id = c.id
          WHERE tv.status = 'PendingSignature'
        `).all<any>();

        let reminder1Count = 0;
        let reminder2Count = 0;
        const now = new Date();
        const nowIso = now.toISOString();

        for (const item of pendingList) {
          const recipientEmail = item.approver_email || item.customer_email;
          if (!recipientEmail) continue;

          const createdDate = new Date(item.created_at_utc);
          const daysElapsed = (now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24);
          const approvalLink = `https://evidence-hub-web.pages.dev/?portal=approve&token=${item.id}`;
          const contactPerson = item.approver_name || item.contact_person || "Auftraggeber";

          // 2. Erinnerung (ab Tag 5)
          if (daysElapsed >= 5 && !item.reminder_2_sent_at_utc) {
            let subj = settings?.email_reminder2_subject || "2. Dringende Erinnerung: Ausstehende Freigabe Leistungsnachweis {period} ({projectName})";
            subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);

            let body = settings?.email_reminder2_body || `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie freundlich daran erinnern, dass die Freigabe des Leistungsnachweises für das Projekt "{projectName}" ({item.period}) noch aussteht.\n\nBitte prüfen und bestätigen Sie die Posten zeitnah unter folgendem Link:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
            body = body
              .replace(/{contactPerson}/g, contactPerson)
              .replace(/{projectName}/g, item.project_name)
              .replace(/{customerName}/g, item.customer_name)
              .replace(/{period}/g, item.period)
              .replace(/{approvalLink}/g, approvalLink)
              .replace(/{senderName}/g, senderName);

            await sendSystemEmail(env, { to: recipientEmail, subject: subj, text: body });

            if (settings?.email_admin_notify_reminder !== 0) {
              await sendSystemEmail(env, {
                to: adminMail,
                subject: `[Status-Info] 2. Erinnerung versendet: ${item.customer_name} (${item.period})`,
                text: `Hallo Michael,\n\nfür das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 2. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
              });
            }

            await env.DB.prepare("UPDATE timesheet_versions SET reminder_2_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
            reminder2Count++;
          }
          // 1. Erinnerung (ab Tag 3)
          else if (daysElapsed >= 3 && !item.reminder_1_sent_at_utc && !item.reminder_2_sent_at_utc) {
            let subj = settings?.email_reminder1_subject || "1. Erinnerung: Freigabe Leistungsnachweis {period} für Projekt {projectName}";
            subj = subj.replace("{period}", item.period).replace("{projectName}", item.project_name).replace("{customerName}", item.customer_name);

            let body = settings?.email_reminder1_body || `Sehr geehrte(r) {contactPerson},\n\nwir möchten Sie kurz an die ausstehende Prüfung des Leistungsnachweises für das Projekt "{projectName}" ({item.period}) erinnern.\n\nLink zur Ansicht & Freigabe:\n{approvalLink}\n\nMit freundlichen Grüßen,\n{senderName}`;
            body = body
              .replace(/{contactPerson}/g, contactPerson)
              .replace(/{projectName}/g, item.project_name)
              .replace(/{customerName}/g, item.customer_name)
              .replace(/{period}/g, item.period)
              .replace(/{approvalLink}/g, approvalLink)
              .replace(/{senderName}/g, senderName);

            await sendSystemEmail(env, { to: recipientEmail, subject: subj, text: body });

            if (settings?.email_admin_notify_reminder !== 0) {
              await sendSystemEmail(env, {
                to: adminMail,
                subject: `[Status-Info] 1. Erinnerung versendet: ${item.customer_name} (${item.period})`,
                text: `Hallo Michael,\n\nfür das Projekt "${item.project_name}" (${item.customer_name}) wurde soeben die 1. Erinnerung nach ${Math.floor(daysElapsed)} Tagen an ${recipientEmail} versendet.`
              });
            }

            await env.DB.prepare("UPDATE timesheet_versions SET reminder_1_sent_at_utc = ? WHERE id = ?").bind(nowIso, item.id).run();
            reminder1Count++;
          }
        }

        return jsonResponse({
          success: true,
          checkedPendingCount: pendingList.length,
          reminder1Sent: reminder1Count,
          reminder2Sent: reminder2Count,
          message: `Mahnlauf abgeschlossen: ${pendingList.length} offene Nachweise geprüft (${reminder1Count}x 1. Erinnerung, ${reminder2Count}x 2. Erinnerung versendet).`
        });
      }

  return null;
}

