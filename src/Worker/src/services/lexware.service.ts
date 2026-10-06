import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { ensureOperationalVouchers } from "./db_bootstrap.service";

export async function fetchLexwareWithRetry(
  url: string,
  options: RequestInit,
  maxRetries = 3,
  initialDelayMs = 1500
): Promise<Response> {
  let delay = initialDelayMs;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      if (attempt < maxRetries) {
        const retryAfterHeader = res.headers.get("Retry-After");
        let waitMs = delay;
        if (retryAfterHeader) {
          const parsedSec = parseFloat(retryAfterHeader);
          if (!isNaN(parsedSec) && parsedSec > 0) {
            waitMs = Math.ceil(parsedSec * 1000) + 300;
          }
        }
        console.warn(
          `[Lexware API] 429 Rate Limit encountered on ${url}. Retrying in ${waitMs}ms (attempt ${attempt + 1}/${maxRetries})...`
        );
        await new Promise((r) => setTimeout(r, waitMs));
        delay = Math.round(delay * 1.8);
        continue;
      }
    }
    return res;
  }
  return fetch(url, options);
}

export async function getEffectiveLexwareApiKey(env: Env, request?: Request): Promise<string> {
  const headerKey = request?.headers.get("X-Lexware-Api-Key");
  if (headerKey && headerKey.trim()) return headerKey.trim();

  try {
    const s = await env.DB.prepare(
      "SELECT lexware_api_key FROM app_settings WHERE id = 'global_config'"
    ).first<any>();
    if (s?.lexware_api_key && s.lexware_api_key.trim()) return s.lexware_api_key.trim();
  } catch {}

  if (env.LEXWARE_API_KEY && env.LEXWARE_API_KEY.trim()) return env.LEXWARE_API_KEY.trim();

  return "";
}

export async function getEffectiveLexwareOwnVendorId(env: Env, apiKey?: string): Promise<string> {
  let val = "";
  try {
    const s = await env.DB.prepare(
      "SELECT lexware_own_vendor_id FROM app_settings WHERE id = 'global_config'"
    ).first<any>();
    if (s?.lexware_own_vendor_id && s.lexware_own_vendor_id.trim()) {
      val = s.lexware_own_vendor_id.trim();
    }
  } catch {}

  const isGuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
  if (isGuid) return val;

  if (apiKey) {
    try {
      const res = await fetchLexwareWithRetry("https://api.lexware.io/v1/contacts", {
        headers: { Authorization: `Bearer ${apiKey}`, Accept: "application/json" },
      });
      if (res.ok) {
        const data = (await res.json()) as any;
        const contacts = data.content || [];

        if (val) {
          const match = contacts.find((c: any) => {
            const num = c.roles?.vendor?.number?.toString() || "";
            const name = (
              c.company?.name || `${c.person?.firstName || ""} ${c.person?.lastName || ""}`
            )
              .trim()
              .toLowerCase();
            return num === val || name.includes(val.toLowerCase()) || c.id === val;
          });
          if (match?.id) return match.id;
        }

        const autoMatch = contacts.find((c: any) => {
          const note = (c.note || "").toLowerCase();
          const name = (
            c.company?.name || `${c.person?.firstName || ""} ${c.person?.lastName || ""}`
          )
            .trim()
            .toLowerCase();
          return c.roles && c.roles.vendor && (note.includes("eigen") || note.includes("inhaber"));
        });
        if (autoMatch?.id) return autoMatch.id;
      }
    } catch (err) {
      console.warn("Could not resolve vendor number to contact ID:", err);
    }
  }

  return val;
}

let lastLexwareContactsSyncTime = 0;

export async function syncLexwareContactsInternal(env: Env, customApiKey?: string, force = false) {
  const apiKey = customApiKey || env.LEXWARE_API_KEY;
  if (!apiKey) {
    return { success: false, error: "Kein LEXWARE_API_KEY konfiguriert." };
  }

  const nowMs = Date.now();
  if (!force && nowMs - lastLexwareContactsSyncTime < 10000) {
    return { success: true, cached: true };
  }

  try {
    try {
      await env.DB.prepare("ALTER TABLE customers ADD COLUMN customer_number TEXT").run();
    } catch {}

    const lexRes = await fetch("https://api.lexware.io/v1/contacts?size=250", {
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Accept: "application/json",
      },
    });

    if (!lexRes.ok) {
      const errText = await lexRes.text();
      return {
        success: false,
        error: `Fehler beim Abruf von Lexware API (HTTP ${lexRes.status}): ${errText}`,
      };
    }

    const lexData = (await lexRes.json()) as any;
    const lexContacts = lexData.content || [];
    const now = new Date().toISOString();

    let createdCount = 0;
    let updatedCount = 0;
    const activeLexwareIds = new Set<string>();

    for (const item of lexContacts) {
      const lexContactId = item.id;
      if (!lexContactId) continue;

      const hasCustomerRole = !!(item.roles?.customer || item.customerNumber);
      const hasVendorRole = !!(item.roles?.vendor || item.vendorNumber);

      if (hasVendorRole && !hasCustomerRole) continue;
      if (!hasCustomerRole) continue;

      activeLexwareIds.add(lexContactId);

      const existing = await env.DB.prepare(
        "SELECT id, email, contact_person FROM customers WHERE lexware_contact_id = ?"
      )
        .bind(lexContactId)
        .first<any>();

      const custId = existing?.id || `cust_${crypto.randomUUID().substring(0, 12)}`;

      const displayName =
        item.company?.name ||
        `${item.person?.firstName || ""} ${item.person?.lastName || ""}`.trim() ||
        "Unbekannter Kunde";

      const personName =
        item.company && item.person?.lastName
          ? `${item.person?.salutation ? item.person.salutation + " " : ""}${item.person.firstName ? item.person.firstName + " " : ""}${item.person.lastName}`
          : item.person?.lastName
            ? `${item.person.firstName ? item.person.firstName + " " : ""}${item.person.lastName}`
            : "";

      let email = existing?.email || "";
      if (!email && item.emailAddresses) {
        if (typeof item.emailAddresses === "string") {
          email = item.emailAddresses;
        } else if (item.emailAddresses.business && item.emailAddresses.business[0]) {
          email = item.emailAddresses.business[0];
        } else if (item.emailAddresses.primary) {
          email = item.emailAddresses.primary;
        }
      }

      let street = "";
      let zipCode = "";
      let city = "";
      let countryCode = "DE";

      const primaryAddr =
        item.addresses?.billing?.[0] ||
        item.addresses?.primary ||
        item.addresses?.shipping?.[0];
      if (primaryAddr) {
        street = primaryAddr.street || "";
        zipCode = primaryAddr.zip || "";
        city = primaryAddr.city || "";
        countryCode = primaryAddr.countryCode || "DE";
      }

      const vatId = item.taxInformation?.vatId || null;
      const customerNumber = item.roles?.customer?.number || item.customerNumber || null;
      const customerNumberStr = customerNumber ? String(customerNumber) : null;

      if (existing) {
        updatedCount++;
      } else {
        createdCount++;
      }

      await env.DB.prepare(`
        INSERT INTO customers (id, lexware_contact_id, customer_number, name, contact_person, email, street, zip_code, city, country_code, vat_id, is_active, is_archived, created_at_utc, updated_at_utc)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, ?, ?)
        ON CONFLICT(lexware_contact_id) DO UPDATE SET
          customer_number = excluded.customer_number,
          name = excluded.name,
          contact_person = excluded.contact_person,
          email = excluded.email,
          street = excluded.street,
          zip_code = excluded.zip_code,
          city = excluded.city,
          country_code = excluded.country_code,
          vat_id = excluded.vat_id,
          is_active = 1,
          is_archived = 0,
          updated_at_utc = excluded.updated_at_utc
      `)
        .bind(
          custId,
          lexContactId,
          customerNumberStr,
          displayName,
          personName || null,
          email || null,
          street,
          zipCode,
          city,
          countryCode,
          vatId,
          now,
          now
        )
        .run();

      if (email) {
        try {
          await env.DB.prepare(`
            UPDATE projects
            SET 
              approver_email = CASE WHEN approver_email IS NULL OR approver_email = '' THEN ? ELSE approver_email END,
              approver_name = CASE WHEN approver_name IS NULL OR approver_name = '' THEN ? ELSE approver_name END
            WHERE customer_id = ?
          `)
            .bind(email, personName || null, custId)
            .run();
        } catch {}
      }
    }

    const { results: localCustomers } = await env.DB.prepare(
      "SELECT * FROM customers WHERE id != 'cust_internal'"
    ).all<any>();
    let archivedCount = 0;
    let deletedCount = 0;

    for (const localCust of localCustomers) {
      if (!activeLexwareIds.has(localCust.lexware_contact_id)) {
        const projCount = await env.DB.prepare(
          "SELECT COUNT(*) as cnt FROM projects WHERE customer_id = ?"
        )
          .bind(localCust.id)
          .first<any>();
        const hasHistory = (projCount?.cnt || 0) > 0;

        if (hasHistory) {
          await env.DB.prepare(
            "UPDATE customers SET is_active = 0, is_archived = 1, updated_at_utc = ? WHERE id = ?"
          )
            .bind(now, localCust.id)
            .run();
          archivedCount++;
        } else {
          await env.DB.prepare("DELETE FROM customers WHERE id = ?").bind(localCust.id).run();
          deletedCount++;
        }
      }
    }

    await env.DB.prepare(`
      INSERT INTO customers (id, lexware_contact_id, name, contact_person, email, street, zip_code, city, country_code, is_active, is_archived, created_at_utc, updated_at_utc)
      VALUES ('cust_internal', 'INTERNAL_ORG', '[INTERN] Eigene Organisation & Administration', 'Max Mustermann', 'admin@example.com', '', '', '', 'DE', 1, 0, ?, ?)
      ON CONFLICT(id) DO UPDATE SET
        is_active = 1,
        is_archived = 0,
        name = '[INTERN] Eigene Organisation & Administration',
        updated_at_utc = excluded.updated_at_utc
    `)
      .bind(now, now)
      .run();

    lastLexwareContactsSyncTime = Date.now();

    return {
      success: true,
      stats: {
        totalFromLexware: lexContacts.length,
        created: createdCount,
        updated: updatedCount,
        archived: archivedCount,
        deleted: deletedCount,
      },
    };
  } catch (err: any) {
    console.error("Fehler bei Lexware Kunden-Sync:", err?.message || err);
    return { success: false, error: err?.message || String(err) };
  }
}

export async function createLexwareQuotation(projectId: string, env: Env): Promise<Response> {
  const project = await env.DB.prepare(
    "SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?"
  )
    .bind(projectId)
    .first<any>();

  if (!project) return errorResponse("Projekt nicht gefunden", 404);
  if (!env.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);

  const defaultRate = project.default_hourly_rate || 120.0;
  const plannedHours = project.planned_hours || 0.0;
  const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;

  const quotationPayload = {
    voucherDate: new Date().toISOString(),
    expirationDate: project.end_date
      ? new Date(project.end_date).toISOString()
      : new Date(Date.now() + 30 * 86400000).toISOString(),
    address: {
      name: project.customer_name || "Kunde",
      contactId: project.lexware_contact_id,
      street: project.street || null,
      zip: project.zip_code || null,
      city: project.city || null,
      countryCode: project.country_code || "DE",
    },
    lineItems: [
      {
        type: "custom",
        name: `Architektur & Engineering: ${project.name}`,
        description: `Projekt: ${project.project_number || "Standard"}\nLaufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Vereinbarung"}\nGeplantes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. à ${defaultRate.toFixed(2)} €/h Netto.`,
        quantity: plannedHours > 0 ? plannedHours : 1,
        unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
        unitPrice: {
          currency: "EUR",
          netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
          taxRatePercentage: 19.0,
        },
      },
    ],
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
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

  if (!qRes.ok) {
    const errText = await qRes.text();
    return errorResponse(`Lexware Quotation Fehler: ${errText}`, 400);
  }

  const qData = (await qRes.json()) as any;
  const lexwareQuotationId = qData.id;
  let lexwareQuotationNumber = null;

  try {
    const qDetailRes = await fetch(`https://api.lexware.io/v1/quotations/${lexwareQuotationId}`, {
      headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
    });
    if (qDetailRes.ok) {
      const qDetail = (await qDetailRes.json()) as any;
      lexwareQuotationNumber = qDetail.voucherNumber || null;
    }
  } catch {}

  await env.DB.prepare(
    "UPDATE projects SET lexware_quotation_id = ?, lexware_quotation_number = ?, lexware_quotation_status = 'open' WHERE id = ?"
  )
    .bind(lexwareQuotationId, lexwareQuotationNumber, projectId)
    .run();

  return jsonResponse({
    success: true,
    lexwareQuotationId,
    lexwareQuotationNumber,
    message: `Angebot in Lexware erfolgreich erstellt (ID: ${lexwareQuotationId}${lexwareQuotationNumber ? ", Nr: " + lexwareQuotationNumber : ""})!`,
  });
}

export async function createLexwareOrderConfirmation(
  projectId: string,
  env: Env
): Promise<Response> {
  const project = await env.DB.prepare(
    "SELECT p.*, c.name as customer_name, c.lexware_contact_id, c.street, c.zip_code, c.city, c.country_code FROM projects p JOIN customers c ON p.customer_id = c.id WHERE p.id = ?"
  )
    .bind(projectId)
    .first<any>();

  if (!project) return errorResponse("Projekt nicht gefunden", 404);
  if (!env.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);

  const defaultRate = project.default_hourly_rate || 120.0;
  const plannedHours = project.planned_hours || 0.0;
  const totalBudgetNet = project.total_budget_net || defaultRate * plannedHours;

  const orderConfPayload = {
    voucherDate: new Date().toISOString(),
    address: {
      name: project.customer_name || "Kunde",
      contactId: project.lexware_contact_id,
      street: project.street || null,
      zip: project.zip_code || null,
      city: project.city || null,
      countryCode: project.country_code || "DE",
    },
    lineItems: [
      {
        type: "custom",
        name: `Auftragsbestätigung: ${project.name}`,
        description: `Projekt: ${project.project_number || "Standard"}\nLaufzeit: ${project.start_date || "sofort"} bis ${project.end_date || "gem. Vereinbarung"}\nVereinbartes Stundenkontingent: ${plannedHours > 0 ? plannedHours : 1} Std. à ${defaultRate.toFixed(2)} €/h Netto.`,
        quantity: plannedHours > 0 ? plannedHours : 1,
        unitName: plannedHours > 0 ? "Stunde" : "Pauschal",
        unitPrice: {
          currency: "EUR",
          netAmount: plannedHours > 0 ? defaultRate : totalBudgetNet,
          taxRatePercentage: 19.0,
        },
      },
    ],
    totalPrice: { currency: "EUR" },
    taxConditions: { taxType: "net" },
    shippingConditions: {
      shippingDate: project.start_date ? new Date(project.start_date).toISOString() : new Date().toISOString(),
      shippingType: "service",
    },
    introduction: `Sehr geehrte Damen und Herren,\n\nvielen Dank für die Auftragserteilung. Wir bestätigen Ihren Auftrag zu folgenden Konditionen:`,
    remark: `Abrechnung erfolgt monatlich mit GoBD-konformem Tätigkeits- und Leistungsnachweis.`,
  };

  const ocRes = await fetch("https://api.lexware.io/v1/order-confirmations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(orderConfPayload),
  });

  if (!ocRes.ok) {
    const errText = await ocRes.text();
    return errorResponse(`Lexware Order-Confirmation Fehler: ${errText}`, 400);
  }

  const ocData = (await ocRes.json()) as any;
  const lexwareOrderConfId = ocData.id;
  let lexwareOrderConfNumber = null;

  try {
    const ocDetailRes = await fetch(
      `https://api.lexware.io/v1/order-confirmations/${lexwareOrderConfId}`,
      {
        headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
      }
    );
    if (ocDetailRes.ok) {
      const ocDetail = (await ocDetailRes.json()) as any;
      lexwareOrderConfNumber = ocDetail.voucherNumber || null;
    }
  } catch {}

  await env.DB.prepare(
    "UPDATE projects SET lexware_order_confirmation_id = ?, lexware_order_confirmation_number = ? WHERE id = ?"
  )
    .bind(lexwareOrderConfId, lexwareOrderConfNumber, projectId)
    .run();

  return jsonResponse({
    success: true,
    lexwareOrderConfId,
    lexwareOrderConfNumber,
    message: `Auftragsbestätigung in Lexware erfolgreich erstellt (ID: ${lexwareOrderConfId}${lexwareOrderConfNumber ? ", Nr: " + lexwareOrderConfNumber : ""})!`,
  });
}

export async function handleLexwareWebhook(request: Request, env: Env): Promise<Response> {
  const body = (await request.json()) as any;
  const event = (body.event || body.type || body.eventType || "").toLowerCase();
  const resourceId = body.resourceId || body.id || body.voucherId;
  const resourceType = (body.resourceType || "").toLowerCase();
  const now = new Date().toISOString();

  try {
    // A. Spesen- & Ausgaben-Belege (EXP...)
    if (event.startsWith("voucher.") || resourceType === "voucher") {
      const exp = await env.DB.prepare(
        "SELECT * FROM trip_expenses WHERE lexware_voucher_id = ?"
      )
        .bind(resourceId)
        .first<any>();
      if (exp) {
        if (event === "voucher.deleted" || event === "voucher_deleted") {
          await env.DB.prepare(
            "UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, lexware_status = 'deleted' WHERE id = ?"
          )
            .bind(exp.id)
            .run();
          await logAuditEvent(env, {
            eventType: "WEBHOOK_EXPENSE_DELETED",
            entityType: "trip_expense",
            entityId: exp.id,
            actor: "Lexware Webhook",
            description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} €) wurde in Lexware gelöscht. Verknüpfung im Hub freigegeben.`,
          });
        } else if (
          event === "voucher.status-changed" ||
          event === "voucher.voided" ||
          event === "voucher.canceled"
        ) {
          if (env.LEXWARE_API_KEY) {
            try {
              const vRes = await fetch(`https://api.lexware.io/v1/vouchers/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
                  Accept: "application/json",
                },
              });
              if (vRes.ok) {
                const vData = (await vRes.json()) as any;
                const vStat = (vData.voucherStatus || "").toLowerCase();
                if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                  await env.DB.prepare(
                    "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
                  )
                    .bind(now, exp.id)
                    .run();
                  await logAuditEvent(env, {
                    eventType: "WEBHOOK_EXPENSE_VOIDED",
                    entityType: "trip_expense",
                    entityId: exp.id,
                    actor: "Lexware Webhook",
                    description: `Ausgaben-Beleg '${exp.description}' (${exp.amount_gross} €) wurde in Lexware storniert. Im Archiv markiert.`,
                  });
                }
              }
            } catch {}
          }
        }
      }
    }

    // B. Ausgangsrechnungen (RE...)
    if (
      event.startsWith("invoice.") ||
      resourceType === "invoice" ||
      event.startsWith("voucher.")
    ) {
      const ts = await env.DB.prepare(
        "SELECT * FROM timesheet_versions WHERE lexware_invoice_id = ?"
      )
        .bind(resourceId)
        .first<any>();
      if (ts) {
        if (
          event === "invoice.canceled" ||
          event === "voucher.canceled" ||
          event === "invoice.voided" ||
          event === "voucher.status-changed"
        ) {
          if (env.LEXWARE_API_KEY) {
            try {
              const invRes = await fetch(`https://api.lexware.io/v1/invoices/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
                  Accept: "application/json",
                },
              });
              if (invRes.ok) {
                const invData = (await invRes.json()) as any;
                const vStat = (invData.voucherStatus || "").toLowerCase();
                if (vStat === "voided" || vStat === "canceled" || vStat === "storniert") {
                  await env.DB.prepare(
                    "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
                  )
                    .bind(now, ts.id)
                    .run();
                  await logAuditEvent(env, {
                    eventType: "WEBHOOK_INVOICE_CANCELED",
                    entityType: "timesheet_version",
                    entityId: ts.id,
                    actor: "Lexware Webhook",
                    description: `Rechnung ${ts.lexware_invoice_number || resourceId} in Lexware storniert. Stundenzettel auf 'InvoiceCanceled' gesetzt.`,
                  });
                } else if (vStat === "paid" || vStat === "paidoff") {
                  await env.DB.prepare(
                    "UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?"
                  )
                    .bind(now, ts.id)
                    .run();
                }
              } else if (invRes.status === 404) {
                await env.DB.prepare(
                  "UPDATE timesheet_versions SET status = 'Approved', lexware_invoice_id = NULL, lexware_invoice_number = NULL WHERE id = ?"
                )
                  .bind(ts.id)
                  .run();
              }
            } catch {}
          }
        }
      }
    }

    // C. Angebote (AG...) & Auftragsbestätigungen (AB...)
    if (event.startsWith("quotation.") || event.startsWith("order-confirmation.")) {
      const project = await env.DB.prepare(
        "SELECT * FROM projects WHERE lexware_quotation_id = ? OR lexware_order_confirmation_id = ?"
      )
        .bind(resourceId, resourceId)
        .first<any>();
      if (project) {
        if (event === "quotation.deleted" || event === "order-confirmation.deleted") {
          const { results: entries } = await env.DB.prepare(
            "SELECT id FROM time_entries WHERE project_id = ?"
          )
            .bind(project.id)
            .all();
          if (!entries || entries.length === 0) {
            await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(project.id).run();
          } else {
            await env.DB.prepare(
              "UPDATE projects SET is_active = 0, is_archived = 1 WHERE id = ?"
            )
              .bind(project.id)
              .run();
          }
        } else if (event === "quotation.status-changed") {
          if (env.LEXWARE_API_KEY) {
            try {
              const qRes = await fetch(`https://api.lexware.io/v1/quotations/${resourceId}`, {
                headers: {
                  Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
                  Accept: "application/json",
                },
              });
              if (qRes.ok) {
                const qData = (await qRes.json()) as any;
                const vStat = (qData.voucherStatus || "").toLowerCase();
                if (vStat === "accepted") {
                  await env.DB.prepare(
                    "UPDATE projects SET lexware_quotation_status = 'accepted', is_active = 1 WHERE id = ?"
                  )
                    .bind(project.id)
                    .run();
                } else if (vStat === "rejected") {
                  await env.DB.prepare(
                    "UPDATE projects SET lexware_quotation_status = 'rejected', is_active = 0, is_archived = 1 WHERE id = ?"
                  )
                    .bind(project.id)
                    .run();
                }
              }
            } catch {}
          }
        }
      }
    }
  } catch (webhookErr: any) {
    console.error("Webhook processing error:", webhookErr?.message || webhookErr);
  }

  return jsonResponse({ success: true, message: "Webhook empfangen & verarbeitet" });
}

export async function registerLexwareWebhooks(
  request: Request,
  env: Env
): Promise<Response> {
  if (!env.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);

  let reqBody: any = {};
  try {
    reqBody = await request.json();
  } catch {}

  let callbackUrl = reqBody.callbackUrl;
  if (!callbackUrl) {
    const workerOrigin = new URL(request.url).origin;
    callbackUrl = `${workerOrigin}/api/v1/webhooks/lexware`;
  }

  const eventsToSubscribe = [
    "voucher.created",
    "voucher.status-changed",
    "voucher.deleted",
    "invoice.created",
    "invoice.status-changed",
    "invoice.deleted",
    "quotation.status-changed",
    "quotation.deleted",
    "order-confirmation.status-changed",
    "order-confirmation.deleted",
  ];

  const results: any[] = [];
  for (const eventName of eventsToSubscribe) {
    try {
      const subRes = await fetch("https://api.lexware.io/v1/event-subscriptions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${env.LEXWARE_API_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          eventType: eventName,
          callbackUrl: callbackUrl,
        }),
      });

      if (subRes.ok) {
        const subData = (await subRes.json()) as any;
        results.push({ event: eventName, status: "subscribed", id: subData.id });
      } else {
        const errText = await subRes.text();
        results.push({
          event: eventName,
          status: "failed",
          statusCode: subRes.status,
          error: errText,
        });
      }
    } catch (e: any) {
      results.push({ event: eventName, status: "error", error: e.message });
    }
  }

  return jsonResponse({
    success: true,
    callbackUrl,
    subscriptions: results,
    message: `Lexware Webhook Registrierung für Callback-URL '${callbackUrl}' abgeschlossen.`,
  });
}

export async function syncFullLexwareStatus(env: Env): Promise<Response> {
  if (!env.LEXWARE_API_KEY) return errorResponse("LEXWARE_API_KEY nicht konfiguriert", 500);

  const now = new Date().toISOString();
  let canceledInvoicesCount = 0;
  let canceledExpensesCount = 0;
  let cleanedProjectsCount = 0;
  let paidInvoicesCount = 0;

  // 1. Voucherlist API Call für Invoices & Belege
  try {
    const vListRes = await fetch(
      "https://api.lexware.io/v1/voucherlist?voucherType=invoice,creditnote,purchase,expense&voucherStatus=draft,open,paid,paidoff,voided,transferred,sepadebit&size=250",
      {
        headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
      }
    );
    if (vListRes.ok) {
      const vListData = (await vListRes.json()) as any;
      const content = vListData.content || [];
      for (const item of content) {
        const vStatus = (item.voucherStatus || "").toLowerCase();
        const vNum = item.voucherNumber || "";
        const vId = item.id;
        const vType = (item.voucherType || "").toLowerCase();

        if (vType === "invoice" || vType === "creditnote") {
          if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
            const res = await env.DB.prepare(`
              UPDATE timesheet_versions 
              SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = COALESCE(invoice_canceled_at_utc, ?), lexware_invoice_number = COALESCE(lexware_invoice_number, ?)
              WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND (status != 'InvoiceCanceled' OR is_invoice_canceled = 0)
            `)
              .bind(now, vNum, vId, vNum)
              .run();
            if (res.meta.changes > 0) canceledInvoicesCount += res.meta.changes;
          } else if (vStatus === "paid" || vStatus === "paidoff") {
            const res = await env.DB.prepare(`
              UPDATE timesheet_versions 
              SET is_invoice_paid = 1, invoice_paid_at_utc = COALESCE(invoice_paid_at_utc, ?)
              WHERE (lexware_invoice_id = ? OR lexware_invoice_number = ?) AND is_invoice_paid = 0
            `)
              .bind(now, vId, vNum)
              .run();
            if (res.meta.changes > 0) paidInvoicesCount += res.meta.changes;
          }
        }

        if (vType === "purchase" || vType === "expense") {
          if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
            const res = await env.DB.prepare(`
              UPDATE trip_expenses 
              SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = COALESCE(voucher_canceled_at_utc, ?), lexware_voucher_number = COALESCE(lexware_voucher_number, ?)
              WHERE (lexware_voucher_id = ? OR lexware_voucher_number = ? OR description LIKE ?) AND is_voucher_canceled = 0
            `)
              .bind(now, vNum, vId, vNum, `%${vNum}%`)
              .run();
            if (res.meta.changes > 0) canceledExpensesCount += res.meta.changes;
          }
        }
      }
    }
  } catch (e: any) {
    console.error("Voucherlist sync error:", e.message);
  }

  // 2. Direkter Einzelabgleich für timesheet_versions mit lexware_invoice_id
  const { results: invoicedTimesheets } = await env.DB.prepare(
    "SELECT * FROM timesheet_versions WHERE lexware_invoice_id IS NOT NULL"
  ).all<any>();
  for (const ts of invoicedTimesheets) {
    try {
      const checkRes = await fetch(
        `https://api.lexware.io/v1/invoices/${ts.lexware_invoice_id}`,
        {
          headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
        }
      );
      if (checkRes.status === 404) {
        if (ts.status !== "InvoiceCanceled") {
          await env.DB.prepare(
            "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
          )
            .bind(now, ts.id)
            .run();
          canceledInvoicesCount++;
        }
      } else if (checkRes.ok) {
        const invData = (await checkRes.json()) as any;
        const vStatus = (invData.voucherStatus || "").toLowerCase();
        if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
          if (ts.status !== "InvoiceCanceled" || !ts.is_invoice_canceled) {
            await env.DB.prepare(
              "UPDATE timesheet_versions SET status = 'InvoiceCanceled', is_invoice_canceled = 1, invoice_canceled_at_utc = ? WHERE id = ?"
            )
              .bind(now, ts.id)
              .run();
            canceledInvoicesCount++;
          }
        } else if (vStatus === "paid" || vStatus === "paidoff") {
          if (!ts.is_invoice_paid) {
            await env.DB.prepare(
              "UPDATE timesheet_versions SET is_invoice_paid = 1, invoice_paid_at_utc = ? WHERE id = ?"
            )
              .bind(now, ts.id)
              .run();
            paidInvoicesCount++;
          }
        }
      }
    } catch {}
  }

  // 3. Direkter Einzelabgleich für trip_expenses mit lexware_voucher_id
  const { results: syncedExpenses } = await env.DB.prepare(
    "SELECT * FROM trip_expenses WHERE lexware_voucher_id IS NOT NULL"
  ).all<any>();
  for (const exp of syncedExpenses) {
    try {
      const checkRes = await fetch(
        `https://api.lexware.io/v1/vouchers/${exp.lexware_voucher_id}`,
        {
          headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
        }
      );
      if (checkRes.status === 404) {
        if (!exp.is_voucher_canceled) {
          await env.DB.prepare(
            "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
          )
            .bind(now, exp.id)
            .run();
          canceledExpensesCount++;
        }
      } else if (checkRes.ok) {
        const vData = (await checkRes.json()) as any;
        const vStatus = (vData.voucherStatus || "").toLowerCase();
        if (vStatus === "voided" || vStatus === "canceled" || vStatus === "storniert") {
          if (!exp.is_voucher_canceled) {
            await env.DB.prepare(
              "UPDATE trip_expenses SET is_voucher_canceled = 1, lexware_status = 'voided', voucher_canceled_at_utc = ? WHERE id = ?"
            )
              .bind(now, exp.id)
              .run();
            canceledExpensesCount++;
          }
        } else if (vData.voucherNumber && !exp.lexware_voucher_number) {
          await env.DB.prepare(
            "UPDATE trip_expenses SET lexware_voucher_number = ?, lexware_status = 'open' WHERE id = ?"
          )
            .bind(vData.voucherNumber, exp.id)
            .run();
        }
      }
    } catch {}
  }

  // 4. Angebote & Auftragsbestätigungen Check
  const { results: allProjectsWithDocs } = await env.DB.prepare(
    "SELECT * FROM projects WHERE lexware_quotation_id IS NOT NULL OR lexware_order_confirmation_id IS NOT NULL"
  ).all<any>();
  for (const proj of allProjectsWithDocs) {
    if (proj.lexware_quotation_id) {
      try {
        const qRes = await fetch(
          `https://api.lexware.io/v1/quotations/${proj.lexware_quotation_id}`,
          {
            headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
          }
        );
        if (qRes.status === 404) {
          const { results: entries } = await env.DB.prepare(
            "SELECT id FROM time_entries WHERE project_id = ?"
          )
            .bind(proj.id)
            .all();
          const { results: tripList } = await env.DB.prepare(
            "SELECT id FROM trips WHERE project_id = ?"
          )
            .bind(proj.id)
            .all();
          if ((!entries || entries.length === 0) && (!tripList || tripList.length === 0)) {
            await env.DB.prepare("DELETE FROM projects WHERE id = ?").bind(proj.id).run();
          } else {
            await env.DB.prepare(
              "UPDATE projects SET lexware_quotation_id = NULL, lexware_quotation_number = NULL, lexware_quotation_status = 'deleted', is_active = 0, is_archived = 1 WHERE id = ?"
            )
              .bind(proj.id)
              .run();
          }
          cleanedProjectsCount++;
        } else if (qRes.ok) {
          const qData = (await qRes.json()) as any;
          const vStatus = (qData.voucherStatus || "").toLowerCase();
          if (
            qData.archived === true ||
            vStatus === "archived" ||
            vStatus === "rejected" ||
            vStatus === "canceled" ||
            vStatus === "voided"
          ) {
            await env.DB.prepare(
              "UPDATE projects SET lexware_quotation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?"
            )
              .bind(vStatus === "archived" || qData.archived ? "archived" : "rejected", proj.id)
              .run();
            cleanedProjectsCount++;
          } else if (qData.voucherNumber && qData.voucherNumber !== proj.lexware_quotation_number) {
            await env.DB.prepare(
              "UPDATE projects SET lexware_quotation_number = ? WHERE id = ?"
            )
              .bind(qData.voucherNumber, proj.id)
              .run();
          }
        }
      } catch {}
    }

    if (proj.lexware_order_confirmation_id) {
      try {
        const ocRes = await fetch(
          `https://api.lexware.io/v1/order-confirmations/${proj.lexware_order_confirmation_id}`,
          {
            headers: { Authorization: `Bearer ${env.LEXWARE_API_KEY}`, Accept: "application/json" },
          }
        );
        if (ocRes.status === 404) {
          await env.DB.prepare(
            "UPDATE projects SET lexware_order_confirmation_id = NULL, lexware_order_confirmation_number = NULL, lexware_order_confirmation_status = 'deleted' WHERE id = ?"
          )
            .bind(proj.id)
            .run();
          cleanedProjectsCount++;
        } else if (ocRes.ok) {
          const ocData = (await ocRes.json()) as any;
          const ocStatus = (ocData.voucherStatus || "").toLowerCase();
          if (
            ocData.archived === true ||
            ocStatus === "archived" ||
            ocStatus === "rejected" ||
            ocStatus === "canceled" ||
            ocStatus === "voided"
          ) {
            await env.DB.prepare(
              "UPDATE projects SET lexware_order_confirmation_status = ?, is_active = 0, is_archived = 1 WHERE id = ?"
            )
              .bind(ocStatus === "archived" || ocData.archived ? "archived" : "rejected", proj.id)
              .run();
            cleanedProjectsCount++;
          } else if (
            ocData.voucherNumber &&
            ocData.voucherNumber !== proj.lexware_order_confirmation_number
          ) {
            await env.DB.prepare(
              "UPDATE projects SET lexware_order_confirmation_number = ? WHERE id = ?"
            )
              .bind(ocData.voucherNumber, proj.id)
              .run();
          }
        }
      } catch {}
    }
  }

  return jsonResponse({
    success: true,
    canceledInvoicesCount,
    canceledExpensesCount,
    cleanedProjectsCount,
    paidInvoicesCount,
    message: `Gesamtabgleich abgeschlossen: ${canceledInvoicesCount} Rechnungs-Stornos, ${canceledExpensesCount} stornierte Spesen, ${cleanedProjectsCount} bereinigte Angebote/Projekte, ${paidInvoicesCount} bezahlte Rechnungen synchronisiert.`,
  });
}

export async function unlinkExpenseFromLexware(
  expenseId: string,
  env: Env
): Promise<Response> {
  const exp = await env.DB.prepare("SELECT * FROM trip_expenses WHERE id = ?")
    .bind(expenseId)
    .first<any>();
  if (!exp) return errorResponse("Spesenbeleg nicht gefunden", 404);

  await env.DB.prepare(
    "UPDATE trip_expenses SET is_synced_to_lexware = 0, lexware_voucher_id = NULL, lexware_voucher_number = NULL, is_voucher_canceled = 0, lexware_status = 'open' WHERE id = ?"
  )
    .bind(expenseId)
    .run();

  await logAuditEvent(env, {
    eventType: "EXPENSE_UNLINKED",
    entityType: "trip_expense",
    entityId: expenseId,
    actor: "Admin",
    description: `Spesenbeleg '${exp.description}' (${exp.amount_gross} €) von Lexware entkoppelt und zur erneuten Buchung freigegeben.`,
  });

  return jsonResponse({
    success: true,
    message: "Spesenbeleg erfolgreich entkoppelt. Sie können ihn nun erneut an Lexware übertragen.",
  });
}

export async function syncVoucherToLexware(voucherId: string, env: Env): Promise<Response> {
  await ensureOperationalVouchers(env);
  const v = await env.DB.prepare("SELECT * FROM operational_vouchers WHERE id = ?")
    .bind(voucherId)
    .first<any>();
  if (!v) return errorResponse("Beleg nicht gefunden.", 404);

  const apiKey = env.LEXWARE_API_KEY;
  if (!apiKey) {
    return errorResponse("Kein LEXWARE_API_KEY konfiguriert.", 400);
  }

  try {
    const voucherItems: any[] = [];

    if (v.voucher_type === "Hospitality") {
      voucherItems.push({
        amount: Number(v.tax_deductible_net.toFixed(2)),
        taxAmount: Number(
          (
            v.amount_gross * (v.business_share_percent / 100) -
            v.amount_net * (v.business_share_percent / 100)
          ).toFixed(2)
        ),
        taxRatePercent: v.tax_rate,
        categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647",
      });
      if (v.tax_non_deductible_net > 0) {
        voucherItems.push({
          amount: Number(v.tax_non_deductible_net.toFixed(2)),
          taxAmount: 0,
          taxRatePercent: 0,
          categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647",
        });
      }
      if (v.tip_amount > 0) {
        voucherItems.push({
          amount: Number(v.tip_amount.toFixed(2)),
          taxAmount: 0,
          taxRatePercent: 0,
          categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647",
        });
      }
    } else {
      voucherItems.push({
        amount: Number(v.amount_net.toFixed(2)),
        taxAmount: Number(v.tax_amount.toFixed(2)),
        taxRatePercent: v.tax_rate,
        categoryId: "8f59d48b-3022-487e-902e-c5ee7cf75647",
      });
    }

    const lexBody = {
      voucherType: "purchaseinvoice",
      voucherNumber: v.voucher_number,
      voucherDate: `${v.voucher_date}T00:00:00.000+01:00`,
      shippingDate: `${v.voucher_date}T00:00:00.000+01:00`,
      totalGrossAmount: v.amount_gross + v.tip_amount,
      totalTaxAmount: v.tax_amount,
      taxType: "net",
      useAdditionalTax: false,
      remark: `${v.voucher_type}: ${v.supplier_name} - ${v.business_purpose}`,
      voucherItems,
    };

    const lexRes = await fetchLexwareWithRetry("https://api.lexoffice.io/v1/vouchers", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(lexBody),
    });

    if (!lexRes.ok) {
      const errText = await lexRes.text();
      if (lexRes.status === 429) {
        return errorResponse(
          "Lexware API Rate-Limit erreicht (max. 2 Anfragen/Sekunde). Bitte warten Sie ca. 5 Sekunden und versuchen Sie es erneut.",
          429
        );
      }
      return errorResponse(`Lexware API Fehler (${lexRes.status}): ${errText}`, 400);
    }

    const lexData = (await lexRes.json()) as any;
    const lexVoucherId = lexData.id;

    if (v.receipt_r2_key) {
      try {
        await new Promise((r) => setTimeout(r, 600));
        const fileObj = await env.STORAGE.get(v.receipt_r2_key);
        if (fileObj) {
          const fileBytes = await fileObj.arrayBuffer();
          const uploadForm = new FormData();
          const blob = new Blob([fileBytes], { type: v.receipt_mime_type || "image/jpeg" });
          uploadForm.append("file", blob, v.receipt_filename || "beleg.jpg");

          await fetchLexwareWithRetry(`https://api.lexoffice.io/v1/vouchers/${lexVoucherId}/files`, {
            method: "POST",
            headers: { Authorization: `Bearer ${apiKey}` },
            body: uploadForm,
          });
        }
      } catch (fileErr) {
        console.warn("Could not attach receipt file to Lexware voucher:", fileErr);
      }
    }

    await env.DB.prepare(`
      UPDATE operational_vouchers 
      SET is_synced_to_lexware = 1, lexware_voucher_id = ?, lexware_status = 'synced', updated_at_utc = ?
      WHERE id = ?
    `)
      .bind(lexVoucherId, new Date().toISOString(), voucherId)
      .run();

    return jsonResponse({
      success: true,
      lexwareVoucherId: lexVoucherId,
      message: `Beleg ${v.voucher_number} erfolgreich als Ausgabenbeleg zu Lexware übertragen.`,
    });
  } catch (err: any) {
    return errorResponse(`Fehler bei Lexware Sync: ${err?.message || err}`, 500);
  }
}
