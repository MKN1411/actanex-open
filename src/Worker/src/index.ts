/**
 * FREELANCER EVIDENCE & BILLING HUB - CLOUDFLARE WORKER API
 * Architecture: Clean Modular Service Architecture (ADR-019)
 * Version: 2.15.0
 * (c) 2026 Michael Kirst-Neshva
 */

import { Env, AuthUser } from "./types";
import { corsHeaders, jsonResponse, errorResponse } from "./utils/http";
import { ensureCoreDatabase } from "./services/db_bootstrap.service";
import { getAuthenticatedUser } from "./services/auth.service";

import { handleAuthRoutes } from "./routes/auth.routes";
import { handleSettingsRoutes } from "./routes/settings.routes";
import { handleDashboardRoutes } from "./routes/dashboard.routes";
import { handleProjectsCustomersRoutes } from "./routes/projects_customers.routes";
import { handleTimeEntriesRoutes } from "./routes/time_entries.routes";
import { handleTripsExpensesRoutes } from "./routes/trips_expenses.routes";
import { handleTimesheetsApprovalRoutes } from "./routes/timesheets_approval.routes";
import { handleVouchersRoutes } from "./routes/vouchers.routes";
import { handleTaxExportRoutes } from "./routes/tax_export.routes";
import { handleInstallerRoutes } from "./routes/installer.routes";

// Re-exports for public interface compatibility
export * from "./types";
export {
  fetchLexwareWithRetry,
  getEffectiveLexwareApiKey,
  getEffectiveLexwareOwnVendorId,
  syncLexwareContactsInternal,
} from "./services/lexware.service";
export { scanVoucherWithAi } from "./services/ai_vision.service";
export { calculateSha256Hex } from "./utils/crypto";
export { logAuditEvent } from "./utils/audit";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;

    // 1. CORS Preflight
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders,
      });
    }

    try {
      // 2. Ensure Core Database & Auth Tables
      await ensureCoreDatabase(env);

      // 3. Root Landing & Status Page
      if (path === "/" && method === "GET") {
        const acceptHeader = request.headers.get("accept") || "";
        const dashboardUrl = `https://actanex-open-web.pages.dev/?api=${encodeURIComponent(url.origin + "/api/v1")}`;

        if (acceptHeader.includes("text/html")) {
          return new Response(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>ActaNex Open - Worker API Online</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: radial-gradient(circle at top, #1e293b, #0f172a); color: #f8fafc; min-height: 100vh; display: flex; align-items: center; justify-content: center; margin: 0; padding: 20px; }
    .card { background: rgba(30, 41, 59, 0.9); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 20px; padding: 40px 32px; max-width: 480px; width: 100%; text-align: center; box-shadow: 0 25px 50px -12px rgba(0,0,0,0.6); backdrop-filter: blur(12px); }
    .status-badge { display: inline-flex; align-items: center; gap: 8px; padding: 6px 14px; border-radius: 9999px; background: rgba(16, 185, 129, 0.15); border: 1px solid rgba(16, 185, 129, 0.3); color: #34d399; font-size: 13px; font-weight: 600; margin-bottom: 20px; }
    .pulse { width: 8px; height: 8px; border-radius: 50%; background: #10b981; box-shadow: 0 0 8px #10b981; }
    h1 { font-size: 24px; font-weight: 800; margin: 0 0 8px 0; color: #fff; }
    p { font-size: 14px; color: #94a3b8; line-height: 1.6; margin: 0 0 24px 0; }
    .btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; width: 100%; background: linear-gradient(135deg, #2563eb, #1d4ed8); color: #fff; text-decoration: none; padding: 14px 20px; border-radius: 10px; font-weight: 700; font-size: 15px; box-shadow: 0 10px 15px -3px rgba(37, 99, 235, 0.3); transition: transform 0.1s, opacity 0.2s; }
    .btn-primary:hover { opacity: 0.95; transform: translateY(-1px); }
    .info-box { background: rgba(15, 23, 42, 0.6); border: 1px solid rgba(255, 255, 255, 0.06); border-radius: 10px; padding: 14px; margin: 24px 0; font-size: 12px; text-align: left; }
    .info-row { display: flex; justify-content: space-between; padding: 4px 0; color: #cbd5e1; }
    .info-row span:first-child { color: #64748b; }
    .links { font-size: 12px; color: #64748b; }
    .links a { color: #38bdf8; text-decoration: none; margin: 0 6px; }
  </style>
</head>
<body>
  <div class="card">
    <div class="status-badge"><span class="pulse"></span> Cloudflare Worker API ist aktiv</div>
    <h1>ActaNex Open</h1>
    <p>Diese Instanz verarbeitet alle Backend REST API Anfragen, D1 Edge-Datenbank-Operationen und R2-Dateispeicherzugriffe.</p>
    <a href="${dashboardUrl}" class="btn-primary">
      <span>🚀 Zum Web-Dashboard wechseln</span>
    </a>
    <div class="info-box">
      <div class="info-row"><span>Status:</span><span style="color:#34d399;">200 OK (Healthy)</span></div>
      <div class="info-row"><span>Version:</span><span>3.0.0 (ACNX)</span></div>
      <div class="info-row"><span>API Basis-URL:</span><code style="font-size:11px; color:#38bdf8;">${url.origin}/api/v1</code></div>
    </div>
    <div class="links">
      <a href="/api/v1/health">API Diagnostics</a> &bull;
      <a href="https://actanex-open-web.pages.dev/installer.html">Installer Wizard</a>
    </div>
  </div>
</body>
</html>`, {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }

        return jsonResponse({
          status: "healthy",
          service: "ActaNex Open Worker REST API",
          version: "2.15.0",
          dashboard: dashboardUrl,
          health: `${url.origin}/api/v1/health`
        });
      }

      // 3b. Health & Public Diagnostics Endpoints
      if ((path === "/health" || path === "/api/v1/health") && method === "GET") {
        return jsonResponse({
          status: "healthy",
          app: "Freelancer Evidence & Billing Hub",
          version: "2.15.0",
          architecture: "ADR-019 Modular Service Architecture",
          author: "ActaNex Open Contributors",
          copyright: "(c) 2026 ActaNex Open",
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Auth Routes (Public login, logout, me, change credentials)
      const authRes = await handleAuthRoutes(request, env, path, method);
      if (authRes) return authRes;

      // 4b. Cloud-Native Installer Routes (Public Setup & Provisioning)
      const installerRes = await handleInstallerRoutes(request, env, path, method);
      if (installerRes) return installerRes;

      // 5. Central Auth- & Role-Middleware (Security Hardening / Finding A01 & B02)
      const isPublicRoute =
        path === "/health" ||
        path === "/api/v1/health" ||
        path.startsWith("/api/v1/installer/") ||
        path === "/api/v1/tax-reports/bmf-rates" ||
        path.startsWith("/api/v1/trips/receipts/") ||
        path.startsWith("/api/v1/vouchers/receipts/") ||
        /^\/api\/v1\/vouchers\/upload-session\/[a-zA-Z0-9_-]+\/(?:upload|status)$/.test(path) ||
        /^\/api\/v1\/receipts\/[a-zA-Z0-9_.-]+\/download$/.test(path) ||
        /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/download-signed-document$/.test(path) ||
        /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/pdf$/.test(path) ||
        /^\/api\/v1\/(?:public\/)?timesheets\/[a-zA-Z0-9_-]+\/approval-data$/.test(path) ||
        /^\/api\/v1\/(?:public\/)?(?:timesheets\/[a-zA-Z0-9_-]+\/request-otp|otp\/request)$/.test(path) ||
        /^\/api\/v1\/(?:public\/)?(?:timesheets\/[a-zA-Z0-9_-]+\/verify-otp|otp\/verify)$/.test(path);

      let authenticatedUser: AuthUser | null = null;
      if (path.startsWith("/api/v1/") && !isPublicRoute) {
        authenticatedUser = await getAuthenticatedUser(request, env);
        if (!authenticatedUser) {
          return errorResponse("Nicht authentifiziert. Bitte melden Sie sich an.", 401);
        }

        const isAdminOnlyRoute =
          path === "/api/v1/system/diagnostics" ||
          path.startsWith("/api/v1/settings") ||
          path.startsWith("/api/v1/backup/") ||
          path.startsWith("/api/v1/export/full-disaster-recovery-sql") ||
          path.startsWith("/api/v1/audit/");

        if (isAdminOnlyRoute && authenticatedUser.role !== "Admin") {
          return errorResponse("Zugriff verweigert. Administrator-Rechte erforderlich.", 403);
        }
      }

      if (path === "/api/v1/system/diagnostics" && method === "GET") {
        let customersCount = 0;
        let projectsCount = 0;
        let timeEntriesCount = 0;
        let timesheetVersionsCount = 0;
        let tripsCount = 0;
        let auditCount = 0;
        let recentAuditEvents: any[] = [];

        try {
          const c = await env.DB.prepare("SELECT COUNT(*) as count FROM customers").first<{ count: number }>();
          customersCount = c?.count || 0;
        } catch {}
        try {
          const p = await env.DB.prepare("SELECT COUNT(*) as count FROM projects").first<{ count: number }>();
          projectsCount = p?.count || 0;
        } catch {}
        try {
          const t = await env.DB.prepare("SELECT COUNT(*) as count FROM time_entries").first<{ count: number }>();
          timeEntriesCount = t?.count || 0;
        } catch {}
        try {
          const tv = await env.DB.prepare("SELECT COUNT(*) as count FROM timesheet_versions").first<{ count: number }>();
          timesheetVersionsCount = tv?.count || 0;
        } catch {}
        try {
          const tr = await env.DB.prepare("SELECT COUNT(*) as count FROM trips").first<{ count: number }>();
          tripsCount = tr?.count || 0;
        } catch {}
        try {
          const a = await env.DB.prepare("SELECT COUNT(*) as count FROM audit_events").first<{ count: number }>();
          auditCount = a?.count || 0;
        } catch {}
        try {
          const recent = await env.DB.prepare(`
            SELECT id, event_type, entity_type, entity_id, timestamp_utc, description
            FROM audit_events
            ORDER BY timestamp_utc DESC
            LIMIT 30
          `).all<any>();
          recentAuditEvents = recent.results || [];
        } catch {}

        return jsonResponse({
          report_name: "Evidence Hub Diagnostics & Support Bundle",
          app_version: "3.0.0",
          architecture: "ADR-019 Modular Router",
          generated_at_utc: new Date().toISOString(),
          environment: {
            is_cloudflare_worker: true,
            has_lexware_key: !!env.LEXWARE_API_KEY,
            has_resend_key: !!env.RESEND_API_KEY,
            has_jwt_secret: !!env.JWT_SECRET,
            has_r2_bucket: !!(env.STORAGE || env.DOCUMENTS_BUCKET),
          },
          database_health: {
            customers: customersCount,
            projects: projectsCount,
            time_entries: timeEntriesCount,
            timesheets: timesheetVersionsCount,
            trips: tripsCount,
            audit_events: auditCount,
          },
          recent_audit_log: recentAuditEvents,
        });
      }

      // 6. Modular Route Dispatching
      const settingsRes = await handleSettingsRoutes(request, env, path, method);
      if (settingsRes) return settingsRes;

      const dashboardRes = await handleDashboardRoutes(request, env, path, method);
      if (dashboardRes) return dashboardRes;

      const pcRes = await handleProjectsCustomersRoutes(request, env, path, method);
      if (pcRes) return pcRes;

      const teRes = await handleTimeEntriesRoutes(request, env, path, method);
      if (teRes) return teRes;

      const tripsRes = await handleTripsExpensesRoutes(request, env, path, method);
      if (tripsRes) return tripsRes;

      const tsApprovalRes = await handleTimesheetsApprovalRoutes(request, env, path, method);
      if (tsApprovalRes) return tsApprovalRes;

      const vouchersRes = await handleVouchersRoutes(request, env, path, method);
      if (vouchersRes) return vouchersRes;

      const taxExportRes = await handleTaxExportRoutes(request, env, path, method);
      if (taxExportRes) return taxExportRes;

      // 7. Route Not Found Fallback
      return errorResponse("Endpoint nicht gefunden", 404);
    } catch (err: any) {
      console.error("Unhandled Worker Exception:", err);
      const isDev = (env as any).ENVIRONMENT === "development" || (env as any).ENVIRONMENT === "local";
      return jsonResponse({
        error: isDev ? err.message : "Interner Serverfehler",
        ...(isDev ? { stack: err.stack } : {})
      }, 500);
    }
  },
};
