/**
 * FREELANCER EVIDENCE & BILLING HUB - CLOUDFLARE WORKER API
 * Architecture: Clean Modular Service Architecture (ADR-019)
 * Version: 2.15.0
 * (c) 2026 Michael Kirst-Neshva
 */

import { Env, AuthUser } from "./types";
import { BUILD_VERSION, BUILD_RELEASE_ID } from "./version";
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
import { handleStripeRoutes } from "./routes/stripe.routes";
import { renderLandingPage } from "./templates/landing_page";
import { renderClaimPage } from "./templates/claim_page";

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
      const setupResponse = await handleInstallerRoutes(request, env, path, method);
      if (setupResponse) return setupResponse;

      const stripeResponse = await handleStripeRoutes(request, env, path, method);
      if (stripeResponse) return stripeResponse;
      // 2. Ensure Core Database & Auth Tables
      await ensureCoreDatabase(env);

      // 3. Intelligent Host-Based Routing (actanex.app vs. *.open.actanex.app)
      const host = url.hostname.toLowerCase();
      const acceptHeader = request.headers.get("accept") || "";

      // 3a. Custom Subdomains (*.open.actanex.app) - Unprovisioned Claim & Welcome Page
      if (host.endsWith(".open.actanex.app") && host !== "open.actanex.app" && host !== "fallback.open.actanex.app") {
        const subdomain = host.replace(".open.actanex.app", "");
        let isActiveTenant = false;

        if (env.PLATFORM_DB) {
          try {
            const instanceRow: any = await env.PLATFORM_DB.prepare(
              "SELECT id, status FROM instances WHERE tenant_slug = ? LIMIT 1"
            ).bind(subdomain).first();
            if (instanceRow && instanceRow.status === "active") {
              isActiveTenant = true;
            }
          } catch (dbErr) {
            console.warn("Error checking tenant instance:", dbErr);
          }
        }

        // If instance is not yet active/claimed and requesting web UI -> serve Claim Page
        if (!isActiveTenant && (path === "/" || path === "/index.html" || acceptHeader.includes("text/html"))) {
          return new Response(renderClaimPage(subdomain, url.origin), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }
      }

      // 3b. Root Landing & Status Page (Domain: actanex.app, open.actanex.app & Edge Origin)
      if ((path === "/" || path === "/index.html" || path === "/landing") && method === "GET") {
        const dashboardUrl = `https://actanex-open-web.pages.dev/?api=${encodeURIComponent(url.origin + "/api/v1")}`;

        if (acceptHeader.includes("text/html") || path === "/landing" || path === "/index.html") {
          return new Response(renderLandingPage(url.origin), {
            headers: { "Content-Type": "text/html; charset=utf-8" }
          });
        }

        return jsonResponse({
          status: "healthy",
          service: "ActaNex Open Worker REST API",
          version: BUILD_VERSION,
          dashboard: dashboardUrl,
          health: `${url.origin}/api/v1/health`
        });
      }

      // 3b. Health & Public Diagnostics Endpoints
      if ((path === "/health" || path === "/api/v1/health") && method === "GET") {
        return jsonResponse({
          status: "healthy",
          app: "Freelancer Evidence & Billing Hub",
          version: BUILD_VERSION,
          releaseId: BUILD_RELEASE_ID,
          architecture: "ADR-019 Modular Service Architecture",
          author: "ActaNex Open Contributors",
          copyright: "(c) 2026 ActaNex Open",
          timestamp: new Date().toISOString(),
        });
      }

      // 4. Auth Routes (Public login, logout, me, change credentials)
      const authRes = await handleAuthRoutes(request, env, path, method);
      if (authRes) return authRes;

      // 5. Central Auth- & Role-Middleware (Security Hardening / Finding A01 & B02)
      const isPublicRoute =
        path === "/health" ||
        path === "/api/v1/health" ||
        path.startsWith("/api/v1/installer/") ||
        path.startsWith("/api/v1/stripe/") ||
        path.startsWith("/api/v1/tenants/") ||
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
        error: `Interner Serverfehler: ${err.message}`,
        details: err?.message,
        ...(isDev ? { stack: err.stack } : {})
      }, 500);
    }
  },
};
