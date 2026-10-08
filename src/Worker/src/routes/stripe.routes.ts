import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { logAuditEvent } from "../utils/audit";

/**
 * Native Web Crypto implementation of Stripe Webhook Signature Verification (HMAC-SHA256).
 * No external Node.js stripe SDK required, fully compatible with Cloudflare Workers Edge runtime.
 */
async function verifyStripeSignature(
  rawBody: string,
  sigHeader: string,
  secret: string,
  toleranceSec = 300
): Promise<boolean> {
  try {
    const parts = sigHeader.split(",").reduce((acc: any, part) => {
      const [k, v] = part.trim().split("=");
      if (k && v) {
        if (k === "t") acc.t = v;
        if (k === "v1") {
          acc.v1 = acc.v1 || [];
          acc.v1.push(v);
        }
      }
      return acc;
    }, {});

    if (!parts.t || !parts.v1 || parts.v1.length === 0) {
      console.warn("Invalid stripe-signature header format");
      return false;
    }

    const timestamp = parseInt(parts.t, 10);
    const now = Math.floor(Date.now() / 1000);
    if (Math.abs(now - timestamp) > toleranceSec) {
      console.warn("Stripe signature timestamp expired or outside tolerance window");
      return false;
    }

    const payload = `${parts.t}.${rawBody}`;
    const enc = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      enc.encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    const signatureBytes = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
    const expectedSigHex = Array.from(new Uint8Array(signatureBytes))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");

    return parts.v1.some((sig: string) => sig === expectedSigHex);
  } catch (err: any) {
    console.error("Error verifying Stripe signature:", err?.message || err);
    return false;
  }
}

export async function handleStripeRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  // 1. Stripe Status & Diagnostics Endpoint
  if (path === "/api/v1/stripe/status" && method === "GET") {
    return jsonResponse({
      status: "online",
      has_webhook_secret: !!env.STRIPE_WEBHOOK_SECRET,
      has_platform_db: !!env.PLATFORM_DB,
      webhook_url: `${new URL(request.url).origin}/api/v1/stripe/webhook`,
      configured_at_utc: new Date().toISOString()
    });
  }

  // 1b. Tenant Subdomain Availability Check Endpoint
  if (path === "/api/v1/tenants/check-slug" && method === "GET") {
    const url = new URL(request.url);
    const slug = (url.searchParams.get("slug") || "").trim().toLowerCase();
    
    if (!slug) {
      return errorResponse("Parameter 'slug' ist erforderlich.", 400);
    }

    if (!/^[a-z0-9][a-z0-9-]{1,28}[a-z0-9]$/.test(slug)) {
      return jsonResponse({
        available: false,
        slug,
        reason: "Ungültiges Format. Erlaubt sind 3-30 Kleinbuchstaben, Ziffern und Bindestriche."
      });
    }

    const reserved = new Set([
      "admin", "api", "open", "app", "auth", "login", "billing", "mail",
      "status", "fallback", "root", "www", "support", "dashboard", "help"
    ]);

    if (reserved.has(slug)) {
      return jsonResponse({
        available: false,
        slug,
        reason: "Dieser Name ist vom System reserviert."
      });
    }

    if (env.PLATFORM_DB) {
      try {
        const existing = await env.PLATFORM_DB.prepare(
          "SELECT id FROM instances WHERE tenant_slug = ? LIMIT 1"
        ).bind(slug).first();
        if (existing) {
          return jsonResponse({
            available: false,
            slug,
            reason: "Dieser Mandanten-Name ist bereits vergeben."
          });
        }
      } catch (err: any) {
        console.warn("Error querying instances table:", err?.message || err);
      }
    }

    return jsonResponse({
      available: true,
      slug,
      hostname: `${slug}.hub.actanex.app`
    });
  }

  // 2. Stripe Webhook Endpoint
  if (path === "/api/v1/stripe/webhook" && method === "POST") {
    const sigHeader = request.headers.get("stripe-signature");
    const rawBody = await request.text();

    const rawSecrets = [
      env.STRIPE_WEBHOOK_SECRET,
      env.STRIPE_TEST_WEBHOOK_SECRET,
      "whsec_eLyAgbNnXQkJVyzQpvE06M4d2O9lTYw3", // Live Secret
      "whsec_I5Tuc8iVRs05WyfTtYjL2JIT47lvLlmb"  // Test/Sandbox Secret
    ].filter(Boolean) as string[];

    const candidateSecrets: string[] = [];
    for (const s of rawSecrets) {
      for (const sub of s.split(',')) {
        const trimmed = sub.trim();
        if (trimmed && !candidateSecrets.includes(trimmed)) {
          candidateSecrets.push(trimmed);
        }
      }
    }

    if (!sigHeader) {
      console.warn("Stripe Webhook request missing stripe-signature header");
      return errorResponse("Missing stripe-signature header", 400);
    }

    let isValid = false;
    for (const secret of candidateSecrets) {
      if (await verifyStripeSignature(rawBody, sigHeader, secret)) {
        isValid = true;
        break;
      }
    }

    if (!isValid) {
      console.warn("Stripe Webhook signature verification failed for all candidate secrets");
      return errorResponse("Invalid signature", 400);
    }

    let event: any;
    try {
      event = JSON.parse(rawBody);
    } catch {
      return errorResponse("Invalid JSON payload", 400);
    }

    console.log(`[Stripe Webhook] Received verified event: ${event.type} (ID: ${event.id})`);

    // Handle Event: checkout.session.completed
    if (event.type === "checkout.session.completed") {
      const session = event.data?.object || {};

      // Multi-App / Multi-Product Isolation: Check metadata tag
      const appTag = (session.metadata?.app || "").trim().toLowerCase();
      if (appTag && appTag !== "actanex") {
        console.log(`[Stripe Webhook] Event gehört zu einer fremden App ("${session.metadata?.app}") - für ActaNex ignoriert.`);
        return jsonResponse({
          received: true,
          ignored: true,
          target_app: session.metadata?.app,
          message: "Ignoriert: Event gehört nicht zu ActaNex."
        });
      }

      const customerEmail = session.customer_details?.email || session.customer_email || "unbekannt@kunde.de";
      const customerName = session.customer_details?.name || "Neuer Mandant";
      const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";
      const currency = (session.currency || "eur").toUpperCase();
      const subscriptionId = session.subscription || null;
      const stripeCustomerId = session.customer || null;

      console.log(`[Stripe Webhook] Successful checkout for ActaNex: ${customerEmail} - ${amountTotal} ${currency}`);

      try {
        const platformDb = env.PLATFORM_DB;
        if (platformDb) {
          const now = new Date().toISOString();
          const customerId = crypto.randomUUID();
          const subId = crypto.randomUUID();

          // 1. Insert/Update customer in platform DB
          await platformDb.prepare(`
            INSERT INTO customers (id, stripe_customer_id, email, name, status, created_at_utc)
            VALUES (?, ?, ?, ?, 'active', ?)
            ON CONFLICT(email) DO UPDATE SET stripe_customer_id = excluded.stripe_customer_id, name = excluded.name
          `).bind(customerId, stripeCustomerId || null, customerEmail, customerName, now).run();

          // 2. Insert subscription if applicable
          if (subscriptionId) {
            await platformDb.prepare(`
              INSERT INTO subscriptions (id, stripe_subscription_id, customer_id, plan, amount, currency, status, created_at_utc)
              VALUES (?, ?, ?, 'standard_monthly', ?, ?, 'active', ?)
            `).bind(subId, subscriptionId, customerId, amountTotal, currency, now).run();
          }

          // 3. Log event into dedicated platform table
          await platformDb.prepare(`
            INSERT INTO stripe_events (id, event_type, actor, description, payload_json, processed_at_utc)
            VALUES (?, ?, ?, ?, ?, ?)
          `).bind(
            crypto.randomUUID(),
            event.type,
            customerEmail,
            `Zahlungseingang über Stripe Checkout: ${amountTotal} ${currency} von "${customerName}"`,
            rawBody,
            now
          ).run();
        }
      } catch (logErr) {
        console.warn("Failed to log to platform db:", logErr);
      }

      return jsonResponse({
        received: true,
        event_type: event.type,
        app: appTag || "actanex",
        customer_email: customerEmail,
        status: "platform_db_recorded"
      });
    }

    // Handle Event: customer.subscription.deleted
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data?.object || {};
      const appTag = (sub.metadata?.app || "").trim().toLowerCase();
      if (appTag && appTag !== "actanex") {
        console.log(`[Stripe Webhook] Kündigung gehört zu fremder App ("${sub.metadata?.app}") - ignoriert.`);
        return jsonResponse({ received: true, ignored: true });
      }

      console.log(`[Stripe Webhook] Subscription cancelled for ActaNex: ${sub.id}`);

      try {
        await logAuditEvent(env, {
          eventType: "STRIPE_SUBSCRIPTION_CANCELLED",
          entityType: "subscription",
          entityId: sub.id,
          actor: "stripe_system",
          description: `Stripe-Abonnement gekündigt: ${sub.id} für Kunde ${sub.customer}`
        });
      } catch {}

      return jsonResponse({ received: true, event_type: event.type, app: appTag || "actanex" });
    }

    // Default: Acknowledge unhandled event
    return jsonResponse({ received: true, event_type: event.type, handled: false });
  }

  return null;
}
