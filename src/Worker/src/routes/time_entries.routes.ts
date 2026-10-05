import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";

export async function handleTimeEntriesRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

  // 7. Zeiteinträge abrufen
  if (path === "/api/v1/time-entries" && method === "GET") {
    const projectId = url.searchParams.get("projectId");
    const timesheetId = url.searchParams.get("timesheetId");

    const isDemo = isDemoRequest(request);
    let query;
    if (timesheetId) {
      query = env.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.timesheet_version_id = ? ORDER BY t.entry_date DESC, t.start_time DESC"
      ).bind(timesheetId);
    } else if (projectId) {
      query = env.DB.prepare(
        "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE t.project_id = ? ORDER BY t.entry_date DESC, t.start_time DESC"
      ).bind(projectId);
    } else {
      query = isDemo
        ? env.DB.prepare(
            "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE (p.id LIKE 'prj_demo_%' OR t.id LIKE 'te_demo_%') ORDER BY t.entry_date DESC, t.start_time DESC LIMIT 100"
          )
        : env.DB.prepare(
            "SELECT t.*, p.name as project_name FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.id NOT LIKE 'prj_demo_%' AND t.id NOT LIKE 'te_demo_%' ORDER BY t.entry_date DESC, t.start_time DESC LIMIT 100"
          );
    }

    const { results } = await query.all();
    return jsonResponse(results);
  }

  // 8. Neuen Zeiteintrag anlegen
  if (
    (path === "/api/v1/time-entries" || path === "/api/v1/timesheets/entries") &&
    method === "POST"
  ) {
    const body = (await request.json()) as any;
    const entryId = body.id || crypto.randomUUID();
    const now = new Date().toISOString();

    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(body.projectId)
      .first<any>();
    if (!project) return errorResponse("Projekt nicht gefunden", 404);
    if (project.is_active === 0 || project.is_archived === 1) {
      return errorResponse(
        "Auf archivierte oder gesperrte Projekte können keine Zeiten gebucht werden.",
        400
      );
    }

    const billingType =
      body.billingType || (body.isBillable === false ? "NonBillableVisible" : "Billable");
    const isBillable = billingType === "Billable" ? 1 : 0;
    const billingRate = isBillable
      ? body.billingRateSnapshot || project.default_hourly_rate || 120.0
      : 0.0;

    let actualHours = 0;
    if (body.startTime && body.endTime) {
      const [startH, startM] = body.startTime.split(":").map(Number);
      const [endH, endM] = body.endTime.split(":").map(Number);
      const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - (body.breakMinutes || 0);
      actualHours = Math.max(0, Math.round((totalMinutes / 60) * 100) / 100);
    } else {
      actualHours =
        body.actualHours !== undefined
          ? body.actualHours
          : body.durationHours !== undefined
            ? body.durationHours
            : body.hours !== undefined
              ? body.hours
              : body.billableHours || 8.0;
    }

    const billableHours = isBillable
      ? body.billableHours !== undefined
        ? body.billableHours
        : body.durationHours !== undefined
          ? body.durationHours
          : body.hours !== undefined
            ? body.hours
            : actualHours
      : 0.0;

    const taskRef = body.taskReference || (body.evidence && body.evidence.deliverable) || null;
    const entryDate = body.entryDate || body.date || now.substring(0, 10);
    const shortDescription = body.shortDescription || body.taskDescription || "Projektarbeit";

    await env.DB.prepare(`
      INSERT INTO time_entries (id, project_id, timesheet_version_id, entry_date, start_time, end_time, break_minutes, actual_duration_hours, billable_duration_hours, category, location, short_description, task_or_ticket_reference, is_billable, billing_type, billing_rate_snapshot, created_at_utc)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        project_id = excluded.project_id,
        entry_date = excluded.entry_date,
        actual_duration_hours = excluded.actual_duration_hours,
        billable_duration_hours = excluded.billable_duration_hours,
        short_description = excluded.short_description
    `)
      .bind(
        entryId,
        body.projectId,
        body.timesheetVersionId || null,
        entryDate,
        body.startTime || "09:00",
        body.endTime || "17:30",
        body.breakMinutes || 0,
        actualHours,
        billableHours,
        body.category || "Architecture",
        body.location || "Remote",
        shortDescription,
        taskRef,
        isBillable,
        billingType,
        billingRate,
        now
      )
      .run();

    if (
      body.evidence &&
      (body.evidence.problemStatement ||
        body.evidence.methodology ||
        body.evidence.result ||
        body.evidence.deliverable)
    ) {
      const evId = crypto.randomUUID();
      const probStmt =
        body.evidence.problemStatement ||
        body.evidence.deliverable ||
        body.evidence.result ||
        body.shortDescription ||
        "Architektur- & Fachleistung gem. § 18 EStG";
      await env.DB.prepare(`
        INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
        .bind(
          evId,
          entryId,
          probStmt,
          body.evidence.methodology || "",
          body.evidence.technicalActivity || "",
          body.evidence.result || body.evidence.deliverable || "",
          body.evidence.responsibility || "Eigenverantwortliche Konzeption & Durchführung",
          body.evidence.deliverable || taskRef || null
        )
        .run();
    }

    let typeLabel = "Abrechenbar";
    if (billingType === "NonBillableVisible")
      typeLabel = "Nicht abrechenbar (Kunden-sichtbar)";
    if (billingType === "InternalOnly") typeLabel = "Nur Intern (Kunden-unsichtbar)";

    await logAuditEvent(env, {
      eventType: "TIME_ENTRY_CREATED",
      entityType: "time_entry",
      entityId: entryId,
      actor: "User",
      description: `Zeiteintrag für ${project.name} am ${body.entryDate} (${actualHours}h, Typ: ${typeLabel}) erfasst.`,
    });

    return jsonResponse({
      success: true,
      id: entryId,
      actualHours,
      billableHours,
      billingRate,
      isBillable,
      billingType,
    });
  }

  // 8b. Zeiteintrag Details, Bearbeiten und Löschen
  const timeEntryEditMatch = path.match(/^\/api\/v1\/time-entries\/([a-zA-Z0-9_-]+)$/);
  if (timeEntryEditMatch) {
    const entryId = timeEntryEditMatch[1];
    const existing = await env.DB.prepare(`
      SELECT t.*, p.name as project_name, p.default_hourly_rate, tv.status as ts_status 
      FROM time_entries t 
      JOIN projects p ON t.project_id = p.id 
      LEFT JOIN timesheet_versions tv ON t.timesheet_version_id = tv.id 
      WHERE t.id = ?
    `)
      .bind(entryId)
      .first<any>();

    if (!existing) return errorResponse("Zeiteintrag nicht gefunden", 404);

    const evidence = await env.DB.prepare(
      "SELECT * FROM activity_evidences WHERE time_entry_id = ?"
    )
      .bind(entryId)
      .first<any>();

    if (method === "GET") {
      const isEditable =
        !existing.ts_status ||
        existing.ts_status === "Draft" ||
        existing.ts_status === "Rejected" ||
        existing.ts_status === "InvoiceCanceled";
      return jsonResponse({
        entry: existing,
        evidence: evidence || null,
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
        `Dieser Eintrag ist Teil eines Leistungsnachweises im Status '${existing.ts_status}' und GoBD-gesperrt. Um Änderungen vorzunehmen, muss der Nachweis abgelehnt oder storniert sein.`,
        403
      );
    }

    if (method === "DELETE") {
      await env.DB.prepare("DELETE FROM activity_evidences WHERE time_entry_id = ?")
        .bind(entryId)
        .run();
      await env.DB.prepare("DELETE FROM time_entries WHERE id = ?").bind(entryId).run();
      await logAuditEvent(env, {
        eventType: "TIME_ENTRY_DELETED",
        entityType: "time_entry",
        entityId: entryId,
        actor: "User",
        description: `Zeiteintrag ${entryId} für ${existing.project_name} am ${existing.entry_date} (${existing.actual_duration_hours}h, '${existing.short_description}') gelöscht.`,
      });
      return jsonResponse({ success: true, message: "Zeiteintrag erfolgreich gelöscht." });
    }

    if (method === "PUT") {
      const body = (await request.json()) as any;
      const entryDate = body.entryDate || existing.entry_date;
      const startTime = body.startTime || existing.start_time;
      const endTime = body.endTime || existing.end_time;
      const breakMinutes =
        body.breakMinutes !== undefined
          ? parseInt(body.breakMinutes || "0")
          : existing.break_minutes;
      const category = body.category || existing.category;
      const location = body.location || existing.location;
      const shortDescription = body.shortDescription || existing.short_description;
      const billingType = body.billingType || existing.billing_type || "Billable";
      const isBillable = billingType === "Billable" ? 1 : 0;
      const billingRate = isBillable
        ? body.billingRateSnapshot ||
          existing.billing_rate_snapshot ||
          existing.default_hourly_rate ||
          120.0
        : 0.0;

      let actualHours = existing.actual_duration_hours;
      if (startTime && endTime) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const totalMinutes = endH * 60 + endM - (startH * 60 + startM) - breakMinutes;
        actualHours = Math.max(0, Math.round((totalMinutes / 60) * 100) / 100);
      }
      const billableHours = isBillable
        ? body.billableHours !== undefined
          ? body.billableHours
          : actualHours
        : 0.0;

      const changes: string[] = [];
      if (entryDate !== existing.entry_date)
        changes.push(`Datum: ${existing.entry_date} -> ${entryDate}`);
      if (actualHours !== existing.actual_duration_hours)
        changes.push(`Dauer: ${existing.actual_duration_hours}h -> ${actualHours}h`);
      if (billingType !== existing.billing_type)
        changes.push(`Typ: ${existing.billing_type} -> ${billingType}`);
      if (shortDescription !== existing.short_description)
        changes.push(`Tätigkeit: '${existing.short_description}' -> '${shortDescription}'`);
      if (category !== existing.category)
        changes.push(`Kategorie: ${existing.category} -> ${category}`);
      if (location !== existing.location)
        changes.push(`Ort: ${existing.location} -> ${location}`);

      const taskReference =
        body.taskReference !== undefined
          ? body.taskReference
          : body.evidence && body.evidence.deliverable !== undefined
            ? body.evidence.deliverable
            : existing.task_or_ticket_reference;

      await env.DB.prepare(`
        UPDATE time_entries
        SET entry_date = ?, start_time = ?, end_time = ?, break_minutes = ?, actual_duration_hours = ?, billable_duration_hours = ?, category = ?, location = ?, short_description = ?, task_or_ticket_reference = ?, is_billable = ?, billing_type = ?, billing_rate_snapshot = ?
        WHERE id = ?
      `)
        .bind(
          entryDate,
          startTime,
          endTime,
          breakMinutes,
          actualHours,
          billableHours,
          category,
          location,
          shortDescription,
          taskReference,
          isBillable,
          billingType,
          billingRate,
          entryId
        )
        .run();

      if (
        body.evidence &&
        (body.evidence.problemStatement ||
          body.evidence.methodology ||
          body.evidence.result ||
          body.evidence.deliverable)
      ) {
        const probStmt =
          body.evidence.problemStatement ||
          body.evidence.deliverable ||
          body.evidence.result ||
          shortDescription ||
          "Architektur- und Fachleistung gem. § 18 EStG";
        const meth = body.evidence.methodology || "";
        const resStr = body.evidence.result || body.evidence.deliverable || "";
        const deliv =
          body.evidence.deliverable !== undefined
            ? body.evidence.deliverable
            : taskReference || null;

        if (evidence) {
          await env.DB.prepare(`
            UPDATE activity_evidences 
            SET problem_statement = ?, methodology = ?, result = ?, deliverable = ?
            WHERE time_entry_id = ?
          `)
            .bind(
              body.evidence.problemStatement || evidence.problem_statement || probStmt,
              body.evidence.methodology !== undefined ? body.evidence.methodology : evidence.methodology,
              body.evidence.result !== undefined ? body.evidence.result : evidence.result,
              deliv !== null ? deliv : evidence.deliverable,
              entryId
            )
            .run();
        } else {
          const evId = crypto.randomUUID();
          await env.DB.prepare(`
            INSERT INTO activity_evidences (id, time_entry_id, problem_statement, methodology, technical_activity, result, responsibility, deliverable)
            VALUES (?, ?, ?, ?, ?, ?, 'Eigenverantwortliche Durchführung', ?)
          `)
            .bind(evId, entryId, probStmt, meth, "", resStr, deliv)
            .run();
        }
        changes.push("§ 18 EStG & ADR Nachweis aktualisiert");
      }

      const changeSummary = changes.length > 0 ? changes.join(", ") : "Werte bestätigt";
      await logAuditEvent(env, {
        eventType: "TIME_ENTRY_UPDATED",
        entityType: "time_entry",
        entityId: entryId,
        actor: "User",
        description: `Zeiteintrag für ${existing.project_name} am ${entryDate} korrigiert (${changeSummary}).`,
      });

      return jsonResponse({
        success: true,
        message: `Zeiteintrag erfolgreich korrigiert!`,
        changes: changeSummary,
        entry: {
          id: entryId,
          actualHours,
          billableHours,
          billingType,
          shortDescription,
        },
      });
    }
  }

  return null;
}
