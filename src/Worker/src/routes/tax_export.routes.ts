import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { ensureTripExpenses } from "../services/db_bootstrap.service";
import {
  getTaxReportSummary,
  exportDatevExtf,
  exportLexwareCsv,
  exportAccountingData,
  exportTimesheetManifest,
  exportTaxReceiptsManifest,
  downloadReceiptFile,
} from "../services/tax_travel.service";
import {
  getAuditLogsAndSeals,
  requestAuditResetOtp,
  sealMonthArchive,
  generateDisasterRecoverySqlDump,
} from "../services/gobd_vault.service";

export async function handleTaxExportRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  // 11f. Einzelbeleg-Download (/api/v1/receipts/:id/download)
  const receiptDownloadMatch = path.match(/^\/api\/v1\/receipts\/([a-zA-Z0-9_.-]+)\/download$/);
  if (receiptDownloadMatch && method === "GET") {
    return downloadReceiptFile(receiptDownloadMatch[1], env);
  }

  // 11b-2. Steuer- & EÜR-Zusammenfassung
  if (path === "/api/v1/tax-reports/summary" && method === "GET") {
    return getTaxReportSummary(request, env);
  }

  // 11b. DATEV EXTF 700 Export
  if (path === "/api/v1/export/datev-extf" && method === "POST") {
    return exportDatevExtf(request, env);
  }

  // 11c. Lexware Offline CSV Export
  if (path === "/api/v1/export/lexware-csv" && method === "POST") {
    return exportLexwareCsv(request, env);
  }

  // 11c. Buchungsdaten & Transaktionsexport
  if (path === "/api/v1/export/accounting-data" && method === "POST") {
    return exportAccountingData(request, env);
  }

  // 11d. Leistungsnachweise Manifest
  if (path === "/api/v1/export/timesheet-manifest" && method === "POST") {
    return exportTimesheetManifest(request, env);
  }

  // 11e. Steuer- & Belege Manifest
  if (path === "/api/v1/export/tax-receipts-manifest" && method === "POST") {
    return exportTaxReceiptsManifest(request, env);
  }

  // 11b. Disaster Recovery SQL Dump
  if (path === "/api/v1/export/full-disaster-recovery-sql" && method === "GET") {
    return generateDisasterRecoverySqlDump(env);
  }

  // 11. Audit Logs & Siegel abrufen
  if (path === "/api/v1/audit/logs" && method === "GET") {
    return getAuditLogsAndSeals(env);
  }

  // 11. 2FA Reset OTP anfordern
  if (path === "/api/v1/audit/request-reset-otp" && method === "POST") {
    return requestAuditResetOtp(env);
  }

  // 11. Audit Logs leeren (GoBD-gesperrt)
  if (path === "/api/v1/audit/clear-logs" && method === "POST") {
    return errorResponse(
      "Unzulässige Operation: GoBD-relevante Audit-Logs und Revisionssiegel dürfen in der Produktivumgebung nicht gelöscht werden.",
      403
    );
  }

  // 11. GoBD Monatsarchiv versiegeln
  if (path === "/api/v1/audit/seal-month" && method === "POST") {
    const body = ((await request.json()) as any) || {};
    return sealMonthArchive(body.period, env);
  }

  // 6h. Archiv Übersicht API (Monatsrevisionen, Storno-Belege, GoBD)
  if (path === "/api/v1/archive/overview" && method === "GET") {
    await ensureTripExpenses(env);

    const { results: timesheetRevisions } = await env.DB.prepare(`
      SELECT ts.*, p.name as project_name, p.project_number, c.name as customer_name
      FROM timesheet_versions ts
      LEFT JOIN projects p ON ts.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE ts.status IN ('InvoiceCanceled', 'Rejected', 'Voided') OR ts.is_archived = 1 OR ts.is_invoice_canceled = 1
      ORDER BY ts.period DESC, ts.version_number DESC
    `).all<any>();

    const { results: canceledExpenses } = await env.DB.prepare(`
      SELECT te.*, t.purpose as trip_purpose, t.trip_date, p.name as project_name, c.name as customer_name
      FROM trip_expenses te
      LEFT JOIN trips t ON te.trip_id = t.id
      LEFT JOIN projects p ON t.project_id = p.id
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE te.is_voucher_canceled = 1 OR te.lexware_status IN ('voided', 'deleted')
      ORDER BY te.expense_date DESC
    `).all<any>();

    const { results: archivedProjects } = await env.DB.prepare(`
      SELECT p.*, c.name as customer_name,
        (SELECT COUNT(*) FROM time_entries te WHERE te.project_id = p.id) as time_entries_count
      FROM projects p
      LEFT JOIN customers c ON p.customer_id = c.id
      WHERE p.is_active = 0 OR p.is_archived = 1 OR p.lexware_quotation_status = 'rejected'
      ORDER BY p.name ASC
    `).all<any>();

    let gobdSeals: any[] = [];
    try {
      const { results } = await env.DB.prepare(`
        SELECT * FROM monthly_archive_seals ORDER BY period DESC
      `).all<any>();
      gobdSeals = results || [];
    } catch {}

    return jsonResponse({
      timesheetRevisions: timesheetRevisions || [],
      canceledExpenses: canceledExpenses || [],
      archivedProjects: archivedProjects || [],
      gobdSeals,
    });
  }

  return null;
}
