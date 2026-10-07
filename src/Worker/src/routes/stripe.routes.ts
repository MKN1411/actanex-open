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
      webhook_url: `${new URL(request.url).origin}/api/v1/stripe/webhook`,
      configured_at_utc: new Date().toISOString()
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
      const customerEmail = session.customer_details?.email || session.customer_email || "unbekannt@kunde.de";
      const customerName = session.customer_details?.name || "Neuer Mandant";
      const amountTotal = session.amount_total ? (session.amount_total / 100).toFixed(2) : "0.00";
      const currency = (session.currency || "eur").toUpperCase();
      const subscriptionId = session.subscription || null;
      const stripeCustomerId = session.customer || null;

      console.log(`[Stripe Webhook] Successful checkout for ${customerEmail} - ${amountTotal} ${currency}`);

      try {
        await logAuditEvent(env, {
          eventType: "STRIPE_CHECKOUT_COMPLETED",
          entityType: "payment",
          entityId: session.id,
          actor: customerEmail,
          description: `Zahlungseingang über Stripe Checkout: ${amountTotal} ${currency} von "${customerName}" (${customerEmail}). Abo-ID: ${subscriptionId || 'Einmalig'}, Kunde: ${stripeCustomerId || 'N/A'}`
        });
      } catch (logErr) {
        console.warn("Failed to log Stripe audit event:", logErr);
      }

      return jsonResponse({
        received: true,
        event_type: event.type,
        customer_email: customerEmail,
        status: "provisioning_logged"
      });
    }

    // Handle Event: customer.subscription.deleted
    if (event.type === "customer.subscription.deleted") {
      const sub = event.data?.object || {};
      console.log(`[Stripe Webhook] Subscription cancelled: ${sub.id}`);

      try {
        await logAuditEvent(env, {
          eventType: "STRIPE_SUBSCRIPTION_CANCELLED",
          entityType: "subscription",
          entityId: sub.id,
          actor: "stripe_system",
          description: `Stripe-Abonnement gekündigt: ${sub.id} für Kunde ${sub.customer}`
        });
      } catch {}

      return jsonResponse({ received: true, event_type: event.type });
    }

    // Default: Acknowledge unhandled event
    return jsonResponse({ received: true, event_type: event.type, handled: false });
  }

  return null;
}
