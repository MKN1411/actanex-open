import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { logAuditEvent } from "../utils/audit";
import { sendSystemEmail } from "./email.service";

export async function getAuditLogsAndSeals(env: Env): Promise<Response> {
  const { results: logs } = await env.DB.prepare(
    "SELECT * FROM audit_events ORDER BY timestamp_utc DESC LIMIT 200"
  ).all<any>();
  const { results: seals } = await env.DB.prepare(
    "SELECT * FROM monthly_archive_seals ORDER BY period DESC"
  ).all<any>();
  return jsonResponse({ logs, seals });
}

export async function requestAuditResetOtp(env: Env): Promise<Response> {
  const settings = await env.DB.prepare(
    "SELECT email_sender_email, email_sender_name FROM app_settings WHERE id = 'global_config'"
  ).first<any>();
  const recipientEmail = settings?.email_sender_email || "mkn@ankbs.de";
  const senderName = settings?.email_sender_name || "Michael Kirst-Neshva";

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const enc = new TextEncoder();
  const hashBuf = await crypto.subtle.digest("SHA-256", enc.encode(otpCode));
  const otpHash = Array.from(new Uint8Array(hashBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
  const now = new Date().toISOString();

  await env.DB.prepare(`
    INSERT INTO otp_verifications (id, timesheet_id, email, otp_code_hash, expires_at_utc, attempts, is_verified, created_at_utc)
    VALUES (?, 'SYSTEM_AUDIT_RESET', ?, ?, ?, 0, 0, ?)
  `)
    .bind(crypto.randomUUID(), recipientEmail, otpHash, expiresAt, now)
    .run();

  const mailSubject = `Sicherheitscode für Testdaten- und Protokoll-Reset`;
  const mailText = `Guten Tag,

Sie haben die Bereinigung der Testdaten und Audit-Protokolle im Freelancer Evidence & Billing Hub initiiert.

Ihr 6-stelliger Bestätigungscode (2FA / OTP) lautet:

👉  ${otpCode}  👈

Dieser Code ist 15 Minuten gültig.
Falls Sie diese Aktion nicht veranlasst haben, ignorieren Sie bitte diese E-Mail.

Mit freundlichen Grüßen,
${senderName}`;

  await sendSystemEmail(env, {
    to: recipientEmail,
    subject: mailSubject,
    text: mailText,
  });

  await logAuditEvent(env, {
    eventType: "AUDIT_RESET_OTP_REQUESTED",
    entityType: "system",
    entityId: "audit_log",
    actor: recipientEmail,
    description: `2FA-Sicherheitscode für Testdaten- und Protokoll-Reset an '${recipientEmail}' versendet.`,
  });

  const masked = recipientEmail.replace(
    /^(.)(.*)(@.*)$/,
    (_m: string, c1: string, c2: string, c3: string) =>
      c1 + "*".repeat(Math.max(c2.length, 3)) + c3
  );
  return jsonResponse({
    success: true,
    message: `Ein 6-stelliger Sicherheitscode wurde an ${masked} gesendet.`,
  });
}

export async function sealMonthArchive(period: string, env: Env): Promise<Response> {
  if (!period) return errorResponse("period (YYYY-MM) erforderlich", 400);

  const existingSeal = await env.DB.prepare(
    "SELECT * FROM monthly_archive_seals WHERE period = ?"
  )
    .bind(period)
    .first<any>();
  if (existingSeal) {
    return errorResponse(
      `Der Monat ${period} wurde bereits am ${existingSeal.sealed_at_utc} unveränderbar versiegelt.`,
      400
    );
  }

  const { results: monthEvents } = await env.DB.prepare(
    "SELECT * FROM audit_events WHERE timestamp_utc LIKE ?"
  )
    .bind(`${period}%`)
    .all<any>();
  const now = new Date().toISOString();
  let currentHash = "0000000000000000000000000000000000000000000000000000000000000000";

  if (monthEvents && monthEvents.length > 0) {
    const sortedEvents = monthEvents
      .slice()
      .sort(
        (a: any, b: any) =>
          String(a.timestamp_utc).localeCompare(String(b.timestamp_utc)) ||
          String(a.id).localeCompare(String(b.id))
      );
    for (const ev of sortedEvents) {
      const evData = `${ev.id}|${ev.timestamp_utc}|${ev.event_type}|${ev.entity_type}|${ev.entity_id}|${ev.actor || ""}|${ev.description || ""}|${ev.data_payload_json || ""}|${currentHash}`;
      const hBuf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(evData));
      currentHash = Array.from(new Uint8Array(hBuf))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
    }
  }
  const rootHash = `SHA256_${currentHash}`;
  const sealId = `seal_${period.replace("-", "_")}_${Date.now()}`;

  await env.DB.prepare(`
    INSERT INTO monthly_archive_seals (id, period, sealed_at_utc, sealed_by, total_events_count, merkle_root_hash, is_locked)
    VALUES (?, ?, ?, 'GoBD AutoSealer', ?, ?, 1)
  `)
    .bind(sealId, period, now, monthEvents.length, rootHash)
    .run();

  await logAuditEvent(env, {
    eventType: "MONTHLY_ARCHIVE_SEALED",
    entityType: "monthly_seal",
    entityId: sealId,
    actor: "Admin / GoBD Sealer",
    description: `Monat ${period} wurde schreibgeschützt archiviert mit ${monthEvents.length} Audit-Events (Merkle Hash: ${rootHash}).`,
  });

  return jsonResponse({
    success: true,
    sealId,
    period,
    sealedAt: now,
    eventsCount: monthEvents.length,
    rootHash,
    message: `Monat ${period} wurde erfolgreich mit kryptografischem SHA-256 Hash versiegelt und schreibgeschützt archiviert.`,
  });
}

export async function generateDisasterRecoverySqlDump(env: Env): Promise<Response> {
  let tables: string[] = [];
  try {
    const { results: dbTables } = await env.DB.prepare(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE '_cf_%' ORDER BY name"
    ).all<any>();
    if (dbTables && dbTables.length > 0) {
      const priority = [
        "app_settings",
        "users",
        "customers",
        "projects",
        "trips",
        "timesheet_versions",
      ];
      const discovered = dbTables.map((t: any) => t.name);
      tables = [
        ...priority.filter((p) => discovered.includes(p)),
        ...discovered.filter((d: string) => !priority.includes(d)),
      ];
    }
  } catch {
    tables = [
      "app_settings",
      "users",
      "customers",
      "projects",
      "time_entries",
      "trips",
      "trip_segments",
      "trip_expenses",
      "trip_legs",
      "receipts",
      "operational_vouchers",
      "timesheet_versions",
      "approvals",
      "billing_batches",
      "signed_documents",
      "project_vouchers",
      "otp_verifications",
      "monthly_archive_seals",
      "audit_events",
    ];
  }

  let sqlDump = `-- ========================================================\n`;
  sqlDump += `-- FREELANCER EVIDENCE & BILLING HUB - DISASTER RECOVERY DUMP\n`;
  sqlDump += `-- Exported at: ${new Date().toISOString()}\n`;
  sqlDump += `-- Compatible with SQLite 3 / Cloudflare D1 / PostgreSQL\n`;
  sqlDump += `-- ========================================================\n\n`;
  sqlDump += `PRAGMA foreign_keys = OFF;\n\n`;

  for (const table of tables) {
    try {
      const schemaRow = await env.DB.prepare(
        "SELECT sql FROM sqlite_master WHERE type='table' AND name = ?"
      ).bind(table).first<{ sql: string }>();

      const { results } = await env.DB.prepare(`SELECT * FROM ${table}`).all<any>();
      if ((schemaRow && schemaRow.sql) || (results && results.length > 0)) {
        sqlDump += `-- --------------------------------------------------------\n`;
        sqlDump += `-- Table: ${table} (${results ? results.length : 0} rows)\n`;
        sqlDump += `-- --------------------------------------------------------\n`;
        if (schemaRow && schemaRow.sql) {
          sqlDump += `${schemaRow.sql};\n\n`;
        }
        if (results && results.length > 0) {
          for (const row of results) {
            const cols = Object.keys(row);
            const vals = cols.map((c) => {
              const val = row[c];
              if (val === null || val === undefined) return "NULL";
              if (typeof val === "number") return val;
              if (typeof val === "boolean") return val ? 1 : 0;
              // Echte SQLite-Stringliterale: Newlines originalgetreu erhalten, Hochkommas verdoppeln
              const escaped = String(val).replace(/'/g, "''");
              return `'${escaped}'`;
            });
            sqlDump += `INSERT OR REPLACE INTO ${table} (${cols.join(", ")}) VALUES (${vals.join(", ")});\n`;
          }
          sqlDump += `\n`;
        }
      }
    } catch (e: any) {
      sqlDump += `-- Table ${table} empty or skipped: ${e?.message || e}\n\n`;
    }
  }

  sqlDump += `PRAGMA foreign_keys = ON;\n`;
  sqlDump += `-- End of Disaster Recovery Dump\n`;

  const filename = `evidence_hub_database_dump_${new Date().toISOString().substring(0, 10)}.sql`;
  return new Response(sqlDump, {
    headers: {
      "Content-Type": "application/sql; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-cache",
      "Access-Control-Allow-Origin": "*",
    },
  });
}
