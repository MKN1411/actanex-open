import { Env } from "../types";
import { jsonResponse, errorResponse, isDemoRequest } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { ensureProjectColumns, ensureDemoSeedData } from "../services/db_bootstrap.service";
import {
  syncLexwareContactsInternal,
  createLexwareQuotation,
  createLexwareOrderConfirmation,
  getEffectiveLexwareApiKey,
} from "../services/lexware.service";

export async function handleProjectsCustomersRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  const url = new URL(request.url);

  // 2. Kunden abrufen
  if (path === "/api/v1/customers" && method === "GET") {
    const isDemo = isDemoRequest(request);

    if (isDemo) {
      await ensureDemoSeedData(env);
      const { results } = await env.DB.prepare(`
        SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1) as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
        FROM customers c 
        WHERE c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal'
        ORDER BY c.name ASC
      `).all();

      const sanitized = (results || []).map((c: any) => {
        if (c.id === "cust_internal") {
          return {
            ...c,
            contact_person: "Max Mustercontoso",
            email: "admin@example.com",
            street: "Contoso Allee 100",
            city: "Berlin",
            zip_code: "10115",
          };
        }
        return c;
      });
      return jsonResponse(sanitized);
    }

    try {
      await syncLexwareContactsInternal(env);
    } catch (e: any) {
      console.warn("Auto-sync Lexware contacts failed silently:", e?.message || e);
    }

    const includeArchived = url.searchParams.get("includeArchived") === "true";
    const query = includeArchived
      ? `SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1 AND p.id NOT LIKE 'prj_demo_%') as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
         FROM customers c 
         WHERE c.id NOT LIKE 'cust_demo_%'
         ORDER BY c.is_archived ASC, c.name ASC`
      : `SELECT c.*, 
          (SELECT COUNT(*) FROM projects p WHERE p.customer_id = c.id AND p.is_active = 1 AND p.id NOT LIKE 'prj_demo_%') as active_projects_count,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t JOIN projects p ON t.project_id = p.id WHERE p.customer_id = c.id) as total_recorded_hours
         FROM customers c 
         WHERE c.is_archived = 0 AND c.id NOT LIKE 'cust_demo_%'
         ORDER BY c.name ASC`;

    const { results } = await env.DB.prepare(query).all();
    return jsonResponse(results);
  }

  // 3. Kunden-Detail & Projektübersicht
  const customerOverviewMatch = path.match(
    /^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)\/overview$/
  );
  if (customerOverviewMatch && method === "GET") {
    await ensureProjectColumns(env);
    const customerId = customerOverviewMatch[1];
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
      .bind(customerId)
      .first<any>();

    if (!customer) {
      return errorResponse("Kunde nicht gefunden", 404);
    }

    const { results: projects } = await env.DB.prepare(`
      SELECT p.*,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
        (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs,
        (SELECT COUNT(*) FROM timesheet_versions tv WHERE tv.project_id = p.id) as timesheets_count,
        parent.name as parent_project_name,
        parent.project_number as parent_project_number
      FROM projects p
      LEFT JOIN projects parent ON p.parent_project_id = parent.id
      WHERE p.customer_id = ?
      ORDER BY p.is_archived ASC, p.name ASC
    `)
      .bind(customerId)
      .all<any>();

    const enrichedProjects = (projects || []).map((p: any) => {
      const plannedHours = p.planned_hours || 0;
      const recordedHours = p.recorded_hours || 0;
      const totalBudgetNet = p.total_budget_net || p.default_hourly_rate * plannedHours;
      const recordedAmountNet =
        p.recorded_amount_net || recordedHours * p.default_hourly_rate;
      const recordedTravelCosts = p.recorded_travel_costs || 0.0;
      const travelBudgetNet = p.travel_budget_net || 0.0;
      const remainingHours = Math.max(0, plannedHours - recordedHours);
      const remainingBudgetNet = Math.max(0, totalBudgetNet - recordedAmountNet);
      const remainingTravelBudgetNet =
        travelBudgetNet > 0
          ? Math.max(0, travelBudgetNet - recordedTravelCosts)
          : 0.0;
      const budgetUsagePercent =
        totalBudgetNet > 0
          ? Math.min(100, Math.round((recordedAmountNet / totalBudgetNet) * 100))
          : 0;
      const travelUsagePercent =
        travelBudgetNet > 0
          ? Math.min(100, Math.round((recordedTravelCosts / travelBudgetNet) * 100))
          : 0;

      const directChildren = (projects || []).filter(
        (c: any) => c.parent_project_id === p.id
      );
      const allDescendants = (projects || []).filter(
        (c: any) =>
          c.parent_project_id === p.id ||
          (projects || []).some(
            (p2: any) => p2.parent_project_id === p.id && c.parent_project_id === p2.id
          )
      );

      let rollupHours = recordedHours;
      let rollupAmountNet = recordedAmountNet;
      let rollupTravelCosts = recordedTravelCosts;

      for (const desc of allDescendants) {
        rollupHours += desc.recorded_hours || 0;
        rollupAmountNet += desc.recorded_amount_net || 0;
        rollupTravelCosts += desc.recorded_travel_costs || 0;
      }

      const rollupTotalSpentNet = rollupAmountNet + rollupTravelCosts;
      const rollupRemainingBudgetNet = Math.max(0, totalBudgetNet - rollupAmountNet);
      const rollupBudgetUsagePercent =
        totalBudgetNet > 0
          ? Math.min(100, Math.round((rollupAmountNet / totalBudgetNet) * 100))
          : 0;

      return {
        ...p,
        hierarchy_level: p.hierarchy_level || 1,
        budget_mode: p.budget_mode || "Dedicated",
        travel_budget_net: travelBudgetNet,
        travel_budget_mode: p.travel_budget_mode || "Dedicated",
        total_budget_net: totalBudgetNet,
        recorded_hours: recordedHours,
        recorded_amount_net: recordedAmountNet,
        recorded_travel_costs: recordedTravelCosts,
        remaining_hours: remainingHours,
        remaining_budget_net: remainingBudgetNet,
        remaining_travel_budget_net: remainingTravelBudgetNet,
        budget_usage_percent: budgetUsagePercent,
        travel_usage_percent: travelUsagePercent,
        direct_children_count: directChildren.length,
        descendants_count: allDescendants.length,
        rollup_hours: rollupHours,
        rollup_amount_net: rollupAmountNet,
        rollup_travel_costs: rollupTravelCosts,
        rollup_total_spent_net: rollupTotalSpentNet,
        rollup_remaining_budget_net: rollupRemainingBudgetNet,
        rollup_budget_usage_percent: rollupBudgetUsagePercent,
      };
    });

    return jsonResponse({
      customer,
      projects: enrichedProjects,
    });
  }

  // 4. Lexware Live Kunden-Sync
  if (
    path === "/api/v1/sync/lexware-contacts" &&
    (method === "POST" || method === "GET")
  ) {
    const apiKey =
      request.headers.get("X-Lexware-Api-Key") || env.LEXWARE_API_KEY;
    if (!apiKey) {
      return errorResponse(
        "Kein LEXWARE_API_KEY im Worker konfiguriert oder im Header 'X-Lexware-Api-Key' übergeben.",
        400
      );
    }

    const syncResult = await syncLexwareContactsInternal(env, apiKey, true);
    if (!syncResult.success) {
      return errorResponse(
        syncResult.error || "Fehler beim Lexware-Abgleich",
        502
      );
    }

    const { results: updatedList } = await env.DB.prepare(
      "SELECT * FROM customers ORDER BY is_archived ASC, name ASC"
    ).all();

    return jsonResponse({
      success: true,
      message: `Kundenabgleich erfolgreich! ${syncResult.stats?.totalFromLexware || 0} Kontakte synchronisiert (${syncResult.stats?.created || 0} neu angelegt, ${syncResult.stats?.updated || 0} aktualisiert, ${syncResult.stats?.archived || 0} archiviert, ${syncResult.stats?.deleted || 0} gelöscht).`,
      stats: syncResult.stats,
      customers: updatedList,
    });
  }

  // 4b. Manuellen Kunden anlegen (auch ohne Lexware XXL API)
  if (path === "/api/v1/customers" && method === "POST") {
    const body = (await request.json()) as any;
    const name = (body.name || "").trim();
    if (!name) {
      return errorResponse("Der Kunden- bzw. Firmenname ist erforderlich.", 400);
    }

    const customerId = "cust_manual_" + crypto.randomUUID().slice(0, 8);
    const now = new Date().toISOString();
    const customerNumber = (body.customerNumber || body.customer_number || "").trim() ||
      `KD-${Math.floor(1000 + Math.random() * 9000)}`;
    const contactPerson = (body.contactPerson || body.contact_person || "").trim();
    const email = (body.email || "").trim().toLowerCase();
    const street = (body.street || "").trim();
    const zipCode = (body.zipCode || body.zip_code || "").trim();
    const city = (body.city || "").trim();
    const countryCode = ((body.countryCode || body.country_code || "DE").trim()).toUpperCase() || "DE";
    const vatId = (body.vatId || body.vat_id || "").trim();
    const lexwareContactId = (body.lexwareContactId || body.lexware_contact_id || "").trim() ||
      `MANUAL_${customerId.slice(12)}`;

    // Prüfen, ob bereits ein aktiver Kunde mit diesem Namen existiert
    const existing = await env.DB.prepare(
      "SELECT id FROM customers WHERE LOWER(name) = ? AND is_archived = 0"
    ).bind(name.toLowerCase()).first();
    if (existing) {
      return errorResponse(`Ein aktiver Kunde mit dem Namen "${name}" existiert bereits.`, 409);
    }

    await env.DB.prepare(`
      INSERT INTO customers (
        id, lexware_contact_id, customer_number, name, contact_person, email,
        street, zip_code, city, country_code, vat_id, is_active, is_archived,
        created_at_utc, updated_at_utc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
    `).bind(
      customerId,
      lexwareContactId,
      customerNumber,
      name,
      contactPerson || null,
      email || null,
      street || null,
      zipCode || null,
      city || null,
      countryCode,
      vatId || null,
      now,
      now
    ).run();

    await logAuditEvent(env, {
      eventType: "CUSTOMER_CREATED",
      entityType: "customer",
      entityId: customerId,
      actor: "User",
      description: `Kunde "${name}" (${customerNumber}) manuell angelegt.`
    });

    const createdCustomer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
      .bind(customerId)
      .first<any>();

    return jsonResponse({
      success: true,
      message: `Kunde "${name}" erfolgreich angelegt!`,
      id: customerId,
      customer: createdCustomer
    }, 201);
  }

  // 4c. Kunden aktualisieren
  const customerUpdateMatch = path.match(/^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)$/);
  if (customerUpdateMatch && method === "PUT") {
    const customerId = customerUpdateMatch[1];
    const existing = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
      .bind(customerId)
      .first<any>();
    if (!existing) {
      return errorResponse("Kunde nicht gefunden", 404);
    }

    const body = (await request.json()) as any;
    const name = (body.name || existing.name).trim();
    if (!name) {
      return errorResponse("Der Kundenname darf nicht leer sein.", 400);
    }

    const now = new Date().toISOString();
    const customerNumber = (body.customerNumber !== undefined ? body.customerNumber : existing.customer_number || "").trim();
    const contactPerson = (body.contactPerson !== undefined ? body.contactPerson : existing.contact_person || "").trim();
    const email = (body.email !== undefined ? body.email : existing.email || "").trim().toLowerCase();
    const street = (body.street !== undefined ? body.street : existing.street || "").trim();
    const zipCode = (body.zipCode !== undefined ? body.zipCode : existing.zip_code || "").trim();
    const city = (body.city !== undefined ? body.city : existing.city || "").trim();
    const countryCode = ((body.countryCode || existing.country_code || "DE").trim()).toUpperCase() || "DE";
    const vatId = (body.vatId !== undefined ? body.vatId : existing.vat_id || "").trim();
    const lexwareContactId = (body.lexwareContactId || body.lexware_contact_id || existing.lexware_contact_id || "").trim();

    await env.DB.prepare(`
      UPDATE customers SET
        name = ?,
        customer_number = ?,
        contact_person = ?,
        email = ?,
        street = ?,
        zip_code = ?,
        city = ?,
        country_code = ?,
        vat_id = ?,
        lexware_contact_id = ?,
        updated_at_utc = ?
      WHERE id = ?
    `).bind(
      name,
      customerNumber || null,
      contactPerson || null,
      email || null,
      street || null,
      zipCode || null,
      city || null,
      countryCode,
      vatId || null,
      lexwareContactId,
      now,
      customerId
    ).run();

    await logAuditEvent(env, {
      eventType: "CUSTOMER_UPDATED",
      entityType: "customer",
      entityId: customerId,
      actor: "User",
      description: `Kundenstammdaten für "${name}" aktualisiert.`
    });

    const updatedCustomer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
      .bind(customerId)
      .first<any>();

    return jsonResponse({
      success: true,
      message: `Kunde "${name}" erfolgreich aktualisiert.`,
      customer: updatedCustomer
    });
  }

  // 4d. Kunden archivieren / Status umschalten
  const customerArchiveMatch = path.match(/^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)\/archive$/);
  if (customerArchiveMatch && method === "POST") {
    const customerId = customerArchiveMatch[1];
    if (customerId === "cust_internal") {
      return errorResponse("Das interne Organisations-Cockpit kann nicht archiviert werden.", 400);
    }

    const existing = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first<any>();
    if (!existing) return errorResponse("Kunde nicht gefunden", 404);

    const now = new Date().toISOString();
    const newArchivedState = existing.is_archived === 1 ? 0 : 1;
    const newActiveState = newArchivedState === 1 ? 0 : 1;

    await env.DB.prepare("UPDATE customers SET is_archived = ?, is_active = ?, updated_at_utc = ? WHERE id = ?")
      .bind(newArchivedState, newActiveState, now, customerId).run();

    await logAuditEvent(env, {
      eventType: newArchivedState === 1 ? "CUSTOMER_ARCHIVED" : "CUSTOMER_RESTORED",
      entityType: "customer",
      entityId: customerId,
      actor: "User",
      description: `Kunde "${existing.name}" ${newArchivedState === 1 ? "archiviert" : "wiederhergestellt"}.`
    });

    return jsonResponse({
      success: true,
      isArchived: newArchivedState === 1,
      message: `Kunde "${existing.name}" ${newArchivedState === 1 ? "erfolgreich archiviert" : "erfolgreich wiederhergestellt"}.`
    });
  }

  // 4e. Kunden löschen (revisionssichere Prüfung auf verknüpfte Projekte)
  const customerDeleteMatch = path.match(/^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)$/);
  if (customerDeleteMatch && method === "DELETE") {
    const customerId = customerDeleteMatch[1];
    if (customerId === "cust_internal") {
      return errorResponse("Das interne Organisations-Cockpit kann nicht gelöscht werden.", 400);
    }

    const existing = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first<any>();
    if (!existing) return errorResponse("Kunde nicht gefunden", 404);

    const projCount = await env.DB.prepare("SELECT COUNT(*) as cnt FROM projects WHERE customer_id = ?").bind(customerId).first<any>();
    const hasProjects = (projCount?.cnt || 0) > 0;

    if (hasProjects) {
      const now = new Date().toISOString();
      await env.DB.prepare("UPDATE customers SET is_archived = 1, is_active = 0, updated_at_utc = ? WHERE id = ?")
        .bind(now, customerId).run();

      await logAuditEvent(env, {
        eventType: "CUSTOMER_ARCHIVED",
        entityType: "customer",
        entityId: customerId,
        actor: "User",
        description: `Kunde "${existing.name}" besitzt verknüpfte Projekte und wurde revisionssicher archiviert.`
      });

      return jsonResponse({
        success: true,
        archived: true,
        message: `Kunde "${existing.name}" besitzt verknüpfte Projekte und wurde revisionssicher archiviert.`
      });
    }

    await env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(customerId).run();

    await logAuditEvent(env, {
      eventType: "CUSTOMER_DELETED",
      entityType: "customer",
      entityId: customerId,
      actor: "User",
      description: `Kunde "${existing.name}" endgültig gelöscht.`
    });

    return jsonResponse({
      success: true,
      deleted: true,
      message: `Kunde "${existing.name}" erfolgreich gelöscht.`
    });
  }

  // 4f. Manuellen Kunden zu Lexware übertragen (optional, falls Lexware API später hinterlegt)
  const customerSyncLexwareMatch = path.match(/^\/api\/v1\/customers\/([a-zA-Z0-9_-]+)\/sync-to-lexware$/);
  if (customerSyncLexwareMatch && method === "POST") {
    const customerId = customerSyncLexwareMatch[1];
    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?").bind(customerId).first<any>();
    if (!customer) return errorResponse("Kunde nicht gefunden", 404);

    const apiKey = await getEffectiveLexwareApiKey(env);
    if (!apiKey) {
      return errorResponse("Kein Lexware API-Schlüssel konfiguriert. Bitte in den Einstellungen hinterlegen.", 400);
    }

    try {
      const contactPayload: any = {
        version: 0,
        roles: { customer: {} },
        company: {
          name: customer.name,
          contactPersons: customer.contact_person ? [
            {
              primary: true,
              salutation: "",
              firstName: "",
              lastName: customer.contact_person,
              emailAddress: customer.email || ""
            }
          ] : []
        },
        addresses: {
          billing: [
            {
              primary: true,
              street: customer.street || "",
              zip: customer.zip_code || "",
              city: customer.city || "",
              countryCode: customer.country_code || "DE"
            }
          ]
        }
      };

      const lexRes = await fetch("https://api.lexware.io/v1/contacts", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify(contactPayload)
      });

      if (!lexRes.ok) {
        const errText = await lexRes.text();
        return errorResponse(`Lexware API Fehler (${lexRes.status}): ${errText}`, 502);
      }

      const lexData = (await lexRes.json()) as any;
      const newLexwareContactId = lexData.id;
      const now = new Date().toISOString();

      await env.DB.prepare("UPDATE customers SET lexware_contact_id = ?, updated_at_utc = ? WHERE id = ?")
        .bind(newLexwareContactId, now, customerId).run();

      await logAuditEvent(env, {
        eventType: "CUSTOMER_SYNCED_TO_LEXWARE",
        entityType: "customer",
        entityId: customerId,
        actor: "User",
        description: `Kunde "${customer.name}" erfolgreich zu Lexware synchronisiert (ID: ${newLexwareContactId}).`
      });

      return jsonResponse({
        success: true,
        message: `Kunde "${customer.name}" erfolgreich zu Lexware übertragen!`,
        lexwareContactId: newLexwareContactId
      });
    } catch (lexErr: any) {
      return errorResponse(`Synchronisation fehlgeschlagen: ${lexErr.message}`, 500);
    }
  }

  // 5. Projekt-Detail & Alle Zeiterfassungen
  const projectDetailsMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/details$/
  );
  if (projectDetailsMatch && method === "GET") {
    await ensureProjectColumns(env);
    const projId = projectDetailsMatch[1];
    const project = await env.DB.prepare(`
      SELECT p.*, c.name as customer_name, c.email as customer_email, c.contact_person, c.lexware_contact_id
      FROM projects p 
      JOIN customers c ON p.customer_id = c.id 
      WHERE p.id = ?
    `)
      .bind(projId)
      .first<any>();

    if (!project) {
      return errorResponse("Projekt nicht gefunden", 404);
    }

    const { results: entries } = await env.DB.prepare(`
      SELECT t.*, e.problem_statement, e.methodology, e.technical_activity, e.result, e.deliverable
      FROM time_entries t
      LEFT JOIN activity_evidences e ON t.id = e.time_entry_id
      WHERE t.project_id = ?
      ORDER BY t.entry_date DESC, t.start_time DESC
    `)
      .bind(projId)
      .all<any>();

    const { results: trips } = await env.DB.prepare(`
      SELECT tr.*, p.name as project_name
      FROM trips tr
      LEFT JOIN projects p ON tr.project_id = p.id
      WHERE tr.project_id = ?
      ORDER BY tr.trip_date DESC
    `)
      .bind(projId)
      .all<any>();

    const { results: children } = await env.DB.prepare(`
      SELECT p.*,
        (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
        (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
        (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs
      FROM projects p
      WHERE p.parent_project_id = ? OR p.parent_project_id IN (SELECT id FROM projects WHERE parent_project_id = ?)
      ORDER BY p.hierarchy_level ASC, p.name ASC
    `)
      .bind(projId, projId)
      .all<any>();

    let parentProject = null;
    if (project.parent_project_id) {
      parentProject = await env.DB.prepare(`
        SELECT p.*,
          (SELECT COALESCE(SUM(t.billable_duration_hours), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_hours,
          (SELECT COALESCE(SUM(t.billable_duration_hours * t.billing_rate_snapshot), 0) FROM time_entries t WHERE t.project_id = p.id) as recorded_amount_net,
          (SELECT COALESCE(SUM(tr.customer_reimbursable_cost), 0) FROM trips tr WHERE tr.project_id = p.id) as recorded_travel_costs
        FROM projects p WHERE p.id = ?
      `)
        .bind(project.parent_project_id)
        .first<any>();
    }

    const totalHours = (entries || []).reduce(
      (sum: number, e: any) => sum + (e.billable_duration_hours || 0),
      0
    );
    const totalAmountNet = (entries || []).reduce(
      (sum: number, e: any) =>
        sum +
        (e.billable_duration_hours || 0) *
          (e.billing_rate_snapshot || project.default_hourly_rate),
      0
    );
    const totalTravelCost = (trips || []).reduce(
      (sum: number, tr: any) => sum + (tr.customer_reimbursable_cost || 0),
      0
    );
    const plannedHours = project.planned_hours || 0;
    const totalBudgetNet =
      project.total_budget_net || plannedHours * project.default_hourly_rate;
    const travelBudgetNet = project.travel_budget_net || 0.0;

    const childHours = (children || []).reduce(
      (s: number, c: any) => s + (c.recorded_hours || 0),
      0
    );
    const childAmount = (children || []).reduce(
      (s: number, c: any) => s + (c.recorded_amount_net || 0),
      0
    );
    const childTravel = (children || []).reduce(
      (s: number, c: any) => s + (c.recorded_travel_costs || 0),
      0
    );

    const rollupHours = totalHours + childHours;
    const rollupAmountNet = totalAmountNet + childAmount;
    const rollupTravelCosts = totalTravelCost + childTravel;
    const rollupTotalSpentNet = rollupAmountNet + rollupTravelCosts;

    return jsonResponse({
      project: {
        ...project,
        recorded_hours: totalHours,
        recorded_amount_net: totalAmountNet,
        recorded_travel_costs: totalTravelCost,
        travel_budget_net: travelBudgetNet,
        planned_hours: plannedHours,
        total_budget_net: totalBudgetNet,
        remaining_hours: Math.max(0, plannedHours - totalHours),
        remaining_budget_net: Math.max(0, totalBudgetNet - totalAmountNet),
        remaining_travel_budget_net:
          travelBudgetNet > 0 ? Math.max(0, travelBudgetNet - totalTravelCost) : 0.0,
        budget_usage_percent:
          totalBudgetNet > 0
            ? Math.min(100, Math.round((totalAmountNet / totalBudgetNet) * 100))
            : 0,
      },
      timeEntries: entries || [],
      trips: trips || [],
      children: children || [],
      parentProject: parentProject,
      rollup: {
        rollup_hours: rollupHours,
        rollup_amount_net: rollupAmountNet,
        rollup_travel_costs: rollupTravelCosts,
        rollup_total_spent_net: rollupTotalSpentNet,
        rollup_remaining_budget_net: Math.max(0, totalBudgetNet - rollupAmountNet),
        rollup_budget_usage_percent:
          totalBudgetNet > 0
            ? Math.min(100, Math.round((rollupAmountNet / totalBudgetNet) * 100))
            : 0,
        children_count: (children || []).length,
      },
    });
  }

  // 5b. Alle aktiven Projekte abrufen
  if (path === "/api/v1/projects" && method === "GET") {
    await ensureProjectColumns(env);
    const isDemo = isDemoRequest(request);
    const customerId = url.searchParams.get("customerId");

    let query;
    if (isDemo) {
      await ensureDemoSeedData(env);
      query = customerId
        ? env.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.customer_id = ? AND (c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal') AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `).bind(customerId)
        : env.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE (c.id LIKE 'cust_demo_%' OR c.id = 'cust_internal') AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `);
    } else {
      query = customerId
        ? env.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.customer_id = ? AND p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `).bind(customerId)
        : env.DB.prepare(`
            SELECT p.*, c.name as customer_name, c.email as customer_email, c.is_archived as customer_archived,
              parent.name as parent_project_name, parent.project_number as parent_project_number
            FROM projects p 
            JOIN customers c ON p.customer_id = c.id 
            LEFT JOIN projects parent ON p.parent_project_id = parent.id
            WHERE p.id NOT LIKE 'prj_demo_%' AND (p.customer_id NOT LIKE 'cust_demo_%' OR p.customer_id IS NULL) AND p.is_active = 1 
            ORDER BY p.hierarchy_level ASC, p.name ASC
          `);
    }

    const { results } = await query.all();
    return jsonResponse(results);
  }

  // 6. Neues Projekt im Kontext des Kunden anlegen
  if (path === "/api/v1/projects" && method === "POST") {
    await ensureProjectColumns(env);
    const body = (await request.json()) as any;

    const projId = body.id || `prj_${Date.now()}`;
    const now = new Date().toISOString();

    const defaultRate = Number(body.defaultHourlyRate) || 120.0;
    const plannedHours = Number(body.plannedHours) || 0.0;
    const totalBudgetNet = body.totalBudgetNet
      ? Number(body.totalBudgetNet)
      : defaultRate * plannedHours;
    const parentProjectId = body.parentProjectId || null;
    const hierarchyLevel = Number(body.hierarchyLevel) || 1;
    const budgetMode = body.budgetMode || "Dedicated";
    const travelBudgetNet =
      body.travelBudgetNet !== undefined ? Number(body.travelBudgetNet) : 0.0;
    const travelBudgetMode = body.travelBudgetMode || "Dedicated";

    const customer = await env.DB.prepare("SELECT * FROM customers WHERE id = ?")
      .bind(body.customerId)
      .first<any>();
    const approverEmail = body.approverEmail || customer?.email || "";
    const approverName = body.approverName || customer?.contact_person || null;

    await env.DB.prepare(`
      INSERT INTO projects (
        id, customer_id, project_number, name, end_customer_name, purchase_order_number, contract_number, 
        default_hourly_rate, planned_hours, total_budget_net, travel_budget_net, travel_budget_mode,
        parent_project_id, hierarchy_level, budget_mode, start_date, end_date, 
        lexware_service_article_id, billing_interval_minutes, 
        approver_email, approver_name, approver_2_email, approver_2_name, approver_3_email, approver_3_name,
        travel_time_billable, travel_time_rate_multiplier, public_transit_reimbursable, is_active, created_at_utc, updated_at_utc
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    `)
      .bind(
        projId,
        body.customerId,
        body.projectNumber ||
          `PRJ-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
        body.name,
        body.endCustomerName || null,
        body.purchaseOrderNumber || null,
        body.contractNumber || null,
        defaultRate,
        plannedHours,
        totalBudgetNet,
        travelBudgetNet,
        travelBudgetMode,
        parentProjectId,
        hierarchyLevel,
        budgetMode,
        body.startDate || null,
        body.endDate || null,
        body.lexwareServiceArticleId || "IT-ARCH",
        body.billingIntervalMinutes || 15,
        approverEmail,
        approverName,
        body.approver2Email || null,
        body.approver2Name || null,
        body.approver3Email || null,
        body.approver3Name || null,
        body.travelTimeBillable ? 1 : 0,
        body.travelTimeRateMultiplier || 1.0,
        body.publicTransitReimbursable !== false ? 1 : 0,
        now,
        now
      )
      .run();

    if (Array.isArray(body.subProjects) && body.subProjects.length > 0) {
      for (let idx = 0; idx < body.subProjects.length; idx++) {
        const sub = body.subProjects[idx];
        if (!sub || !sub.name) continue;
        const subId =
          sub.id ||
          `prj_${Date.now()}_${idx + 1}_${Math.floor(100 + Math.random() * 900)}`;
        const subLevel = Number(sub.hierarchyLevel) || hierarchyLevel + 1;
        const subRate = Number(sub.defaultHourlyRate) || defaultRate;
        const subHours = Number(sub.plannedHours) || 0;
        const subBudgetMode = sub.budgetMode || "PooledFromParent";
        const subTotalBudget =
          subBudgetMode === "PooledFromParent"
            ? 0.0
            : sub.totalBudgetNet
              ? Number(sub.totalBudgetNet)
              : subRate * subHours;
        const subTravelBudget = Number(sub.travelBudgetNet) || 0.0;
        const subTravelMode = sub.travelBudgetMode || "PooledFromParent";
        const subParentId = sub.parentProjectId || projId;
        const subNumber =
          sub.projectNumber || `${body.projectNumber || "PRJ"}-S${idx + 1}`;

        await env.DB.prepare(`
          INSERT INTO projects (
            id, customer_id, project_number, name, end_customer_name,
            default_hourly_rate, planned_hours, total_budget_net, travel_budget_net, travel_budget_mode,
            parent_project_id, hierarchy_level, budget_mode, start_date, end_date,
            lexware_service_article_id, billing_interval_minutes,
            approver_email, approver_name, approver_2_email, approver_2_name, approver_3_email, approver_3_name,
            travel_time_billable, travel_time_rate_multiplier, public_transit_reimbursable, is_active, created_at_utc, updated_at_utc
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
        `)
          .bind(
            subId,
            body.customerId,
            subNumber,
            sub.name,
            body.endCustomerName || null,
            subRate,
            subHours,
            subTotalBudget,
            subTravelBudget,
            subTravelMode,
            subParentId,
            subLevel,
            subBudgetMode,
            body.startDate || null,
            body.endDate || null,
            body.lexwareServiceArticleId || "IT-ARCH",
            body.billingIntervalMinutes || 15,
            approverEmail,
            approverName,
            body.approver2Email || null,
            body.approver2Name || null,
            body.approver3Email || null,
            body.approver3Name || null,
            body.travelTimeBillable ? 1 : 0,
            body.travelTimeRateMultiplier || 1.0,
            body.publicTransitReimbursable !== false ? 1 : 0,
            now,
            now
          )
          .run();
      }
    }

    let lexwareQuotationId = null;
    let quotationError = null;

    if (
      body.createLexwareQuotation &&
      env.LEXWARE_API_KEY &&
      customer?.lexware_contact_id
    ) {
      try {
        const quotationPayload = {
          voucherDate: new Date().toISOString(),
          expirationDate: body.endDate
            ? new Date(body.endDate).toISOString()
            : new Date(Date.now() + 30 * 86400000).toISOString(),
          address: {
            name: customer.name || "Kunde",
            contactId: customer.lexware_contact_id,
            street: customer.street || null,
            zip: customer.zip_code || null,
            city: customer.city || null,
            countryCode: customer.country_code || "DE",
          },
          lineItems: [
            {
              type: "custom",
              name: `Architektur & Engineering: ${body.name}`,
              description: `Projekt: ${body.projectNumber || "Standard"}\nLaufzeit: ${body.startDate || "sofort"} bis ${body.endDate || "gem. Vereinbarung"}\nGeplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. à ${defaultRate.toFixed(2)} €/h Netto.`,
              quantity: plannedHours > 0 ? plannedHours : 1,
              unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
              unitPrice: {
                currency: "EUR",
                netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
                taxRatePercentage: 19.0,
              },
            },
          ],
          totalPrice: {
            currency: "EUR",
          },
          taxConditions: {
            taxType: "net",
          },
          introduction: `Sehr geehrte Damen und Herren,\n\nvielen Dank für die Projektanfrage. Gerne bieten wir Ihnen unsere freiberuflichen Architektur- und Beratungsleistungen wie folgt an:`,
          remark: `Abrechnung erfolgt monatlich nach tatsächlich erbrachten Stunden mit GoBD-konformem Tätigkeits- und Leistungsnachweis.`,
        };

        const qRes = await fetch("https://api.lexware.io/v1/quotations", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(quotationPayload),
        });

        if (qRes.ok) {
          const qData = (await qRes.json()) as any;
          lexwareQuotationId = qData.id;
          let lexwareQuotationNumber = null;
          try {
            const qDetailRes = await fetch(
              `https://api.lexware.io/v1/quotations/${lexwareQuotationId}`,
              {
                headers: {
                  Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
                  Accept: "application/json",
                },
              }
            );
            if (qDetailRes.ok) {
              const qDetail = (await qDetailRes.json()) as any;
              lexwareQuotationNumber = qDetail.voucherNumber || null;
            }
          } catch {}

          await env.DB.prepare(
            "UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ? WHERE id = ?"
          )
            .bind(lexwareQuotationId, lexwareQuotationNumber, projId)
            .run();
        } else {
          quotationError = await qRes.text();
          console.error("Lexware Quotation API Error:", qRes.status, quotationError);
        }
      } catch (e: any) {
        quotationError = e.message;
        console.error("Lexware Quotation Generation Exception:", e.message);
      }
    }

    return jsonResponse({
      success: true,
      id: projId,
      totalBudgetNet,
      lexwareQuotationId,
      quotationError,
      message: lexwareQuotationId
        ? `Projekt '${body.name}' erfolgreich angelegt und Angebot in Lexware erstellt (ID: ${lexwareQuotationId})!`
        : quotationError
          ? `Projekt angelegt, aber Lexware Angebot fehlgeschlagen: ${quotationError}`
          : `Projekt '${body.name}' erfolgreich angelegt.`,
    });
  }

  // 6b. Angebot in Lexware für bestehendes Projekt erstellen
  const createQuotationMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-quotation$/
  );
  if (createQuotationMatch && method === "POST") {
    return createLexwareQuotation(createQuotationMatch[1], env);
  }

  // 6c. Auftragsbestätigung in Lexware erstellen
  const createOrderConfMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/create-order-confirmation$/
  );
  if (createOrderConfMatch && method === "POST") {
    return createLexwareOrderConfirmation(createOrderConfMatch[1], env);
  }

  // 6e. Projekt bearbeiten
  const projectUpdateMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)$/
  );
  if (projectUpdateMatch && method === "PUT") {
    await ensureProjectColumns(env);
    const projId = projectUpdateMatch[1];
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projId)
      .first<any>();
    if (!project) return errorResponse("Projekt nicht gefunden", 404);

    const body = (await request.json()) as any;
    const now = new Date().toISOString();
    const defaultRate =
      body.defaultHourlyRate !== undefined
        ? Number(body.defaultHourlyRate)
        : project.default_hourly_rate || 120.0;
    const plannedHours =
      body.plannedHours !== undefined
        ? Number(body.plannedHours)
        : project.planned_hours;
    const totalBudgetNet =
      body.totalBudgetNet !== undefined
        ? Number(body.totalBudgetNet)
        : defaultRate * plannedHours;
    const travelBudgetNet =
      body.travelBudgetNet !== undefined
        ? Number(body.travelBudgetNet)
        : project.travel_budget_net || 0.0;
    const travelBudgetMode =
      body.travelBudgetMode !== undefined
        ? body.travelBudgetMode
        : project.travel_budget_mode || "Dedicated";
    const hierarchyLevel =
      body.hierarchyLevel !== undefined
        ? Number(body.hierarchyLevel)
        : project.hierarchy_level || 1;
    const budgetMode =
      body.budgetMode !== undefined
        ? body.budgetMode
        : project.budget_mode || "Dedicated";
    const parentProjectId =
      body.parentProjectId !== undefined
        ? body.parentProjectId || null
        : project.parent_project_id;

    await env.DB.prepare(`
      UPDATE projects SET
        name = COALESCE(?, name),
        end_customer_name = ?,
        project_number = COALESCE(?, project_number),
        purchase_order_number = ?,
        contract_number = ?,
        default_hourly_rate = ?,
        planned_hours = ?,
        total_budget_net = ?,
        travel_budget_net = ?,
        travel_budget_mode = ?,
        parent_project_id = ?,
        hierarchy_level = ?,
        budget_mode = ?,
        start_date = ?,
        end_date = ?,
        approver_email = ?,
        approver_name = ?,
        approver_2_email = ?,
        approver_2_name = ?,
        approver_3_email = ?,
        approver_3_name = ?,
        travel_time_billable = ?,
        travel_time_rate_multiplier = ?,
        public_transit_reimbursable = ?,
        is_active = 1,
        is_archived = 0,
        updated_at_utc = ?
      WHERE id = ?
    `)
      .bind(
        body.name || null,
        body.endCustomerName !== undefined
          ? body.endCustomerName
          : project.end_customer_name,
        body.projectNumber || null,
        body.purchaseOrderNumber !== undefined
          ? body.purchaseOrderNumber
          : project.purchase_order_number,
        body.contractNumber !== undefined
          ? body.contractNumber
          : project.contract_number,
        defaultRate,
        plannedHours,
        totalBudgetNet,
        travelBudgetNet,
        travelBudgetMode,
        parentProjectId,
        hierarchyLevel,
        budgetMode,
        body.startDate !== undefined ? body.startDate : project.start_date,
        body.endDate !== undefined ? body.endDate : project.end_date,
        body.approverEmail !== undefined
          ? body.approverEmail
          : project.approver_email,
        body.approverName !== undefined
          ? body.approverName
          : project.approver_name,
        body.approver2Email !== undefined
          ? body.approver2Email
          : project.approver_2_email,
        body.approver2Name !== undefined
          ? body.approver2Name
          : project.approver_2_name,
        body.approver3Email !== undefined
          ? body.approver3Email
          : project.approver_3_email,
        body.approver3Name !== undefined
          ? body.approver3Name
          : project.approver_3_name,
        body.travelTimeBillable !== undefined
          ? body.travelTimeBillable
            ? 1
            : 0
          : project.travel_time_billable,
        body.travelTimeRateMultiplier !== undefined
          ? Number(body.travelTimeRateMultiplier)
          : project.travel_time_rate_multiplier,
        body.publicTransitReimbursable !== undefined
          ? body.publicTransitReimbursable
            ? 1
            : 0
          : project.public_transit_reimbursable,
        now,
        projId
      )
      .run();

    const updatedProject = await env.DB.prepare(
      "SELECT * FROM projects WHERE id = ?"
    )
      .bind(projId)
      .first<any>();
    return jsonResponse({
      success: true,
      message: "Projektdaten und Freigabeberechtigte erfolgreich aktualisiert!",
      project: updatedProject,
    });
  }

  // 6f. Projekt löschen
  if (projectUpdateMatch && method === "DELETE") {
    const projId = projectUpdateMatch[1];
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projId)
      .first<any>();
    if (!project) return errorResponse("Projekt nicht gefunden", 404);

    const timeEntriesCount =
      (
        await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM time_entries WHERE project_id = ?"
        )
          .bind(projId)
          .first<any>()
      )?.cnt || 0;
    const tripsCount =
      (
        await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM trips WHERE project_id = ?"
        )
          .bind(projId)
          .first<any>()
      )?.cnt || 0;
    const hasVouchers = !!(
      project.lexware_quotation_id || project.lexware_order_confirmation_id
    );

    if (timeEntriesCount > 0 || tripsCount > 0 || hasVouchers) {
      return errorResponse(
        `Projekt kann nicht gelöscht werden, da Verknüpfungen existieren (${timeEntriesCount} Zeiteinträge, ${tripsCount} Reisekosten, Belege: ${project.lexware_quotation_number || project.lexware_order_confirmation_number || "Vorhanden"}). Bitte archivieren Sie das Projekt stattdessen.`,
        400
      );
    }

    try {
      await env.DB.prepare(
        "DELETE FROM approvals WHERE timesheet_version_id IN (SELECT id FROM timesheet_versions WHERE project_id = ?)"
      )
        .bind(projId)
        .run();
    } catch {}
    try {
      await env.DB.prepare(
        "DELETE FROM billing_batches WHERE project_id = ?"
      )
        .bind(projId)
        .run();
    } catch {}
    try {
      await env.DB.prepare(
        "DELETE FROM monthly_archive_seals WHERE project_id = ?"
      )
        .bind(projId)
        .run();
    } catch {}
    try {
      await env.DB.prepare("DELETE FROM receipts WHERE project_id = ?")
        .bind(projId)
        .run();
    } catch {}
    try {
      await env.DB.prepare(
        "DELETE FROM timesheet_versions WHERE project_id = ?"
      )
        .bind(projId)
        .run();
    } catch {}

    await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(projId).run();
    await logAuditEvent(env, {
      eventType: "PROJECT_DELETED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) restlos gelöscht.`,
    });

    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde erfolgreich gelöscht.`,
    });
  }

  // Projekt archivieren
  const projectArchiveMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/archive$/
  );
  if (projectArchiveMatch && method === "POST") {
    const projId = projectArchiveMatch[1];
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projId)
      .first<any>();
    if (!project) return errorResponse("Projekt nicht gefunden", 404);

    await env.DB.prepare(
      "UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?"
    )
      .bind(projId)
      .run();
    await logAuditEvent(env, {
      eventType: "PROJECT_ARCHIVED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) wurde manuell archiviert und gesperrt.`,
    });

    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde archiviert und gesperrt.`,
    });
  }

  // Projekt reaktivieren
  const projectUnarchiveMatch = path.match(
    /^\/api\/v1\/projects\/([a-zA-Z0-9_-]+)\/unarchive$/
  );
  if (projectUnarchiveMatch && method === "POST") {
    const projId = projectUnarchiveMatch[1];
    const project = await env.DB.prepare("SELECT * FROM projects WHERE id = ?")
      .bind(projId)
      .first<any>();
    if (!project) return errorResponse("Projekt nicht gefunden", 404);

    await env.DB.prepare(
      "UPDATE projects SET is_active = 1, is_archived = 0 WHERE id = ?"
    )
      .bind(projId)
      .run();
    await logAuditEvent(env, {
      eventType: "PROJECT_UNARCHIVED",
      entityType: "project",
      entityId: projId,
      actor: "Admin",
      description: `Projekt '${project.name}' (${project.project_number}) wurde reaktiviert und entsperrt.`,
    });

    return jsonResponse({
      success: true,
      message: `Projekt '${project.name}' wurde erfolgreich reaktiviert und entsperrt.`,
    });
  }

  return null;
}
