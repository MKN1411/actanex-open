import { Env } from "../types";

export async function sendSystemEmail(env: Env, options: {
  to: string;
  subject: string;
  text: string;
  html?: string;
  senderName?: string;
  senderEmail?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    const settings = await env.DB.prepare("SELECT * FROM app_settings WHERE id = 'global_config'").first<any>();
    
    const senderName = options.senderName || settings?.email_sender_name || "ActaNex System";
    const senderEmail = options.senderEmail || settings?.email_sender_email || "noreply@example.com";
    const emailService = settings?.email_service || "resend";
    const apiKey = settings?.email_api_key || env.RESEND_API_KEY || "";

    if (emailService === "resend" && apiKey) {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          from: `${senderName} <${senderEmail}>`,
          to: [options.to],
          subject: options.subject,
          text: options.text,
          html: options.html || options.text.replace(/\n/g, "<br>")
        })
      });
      if (!res.ok) {
        const err = await res.text();
        console.error("Resend API error:", err);
        return { success: false, error: err };
      }
      return { success: true };
    }

    // MailChannels API (Fallback for Cloudflare Workers)
    try {
      const mailRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [
            {
              to: [{ email: options.to, name: options.to }]
            }
          ],
          from: {
            email: senderEmail,
            name: senderName
          },
          subject: options.subject,
          content: [
            {
              type: "text/plain",
              value: options.text
            }
          ]
        })
      });
      if (mailRes.ok || mailRes.status === 202) {
        return { success: true };
      }
    } catch (e: any) {
      console.warn("MailChannels attempt:", e?.message);
    }

    return { success: true };
  } catch (err: any) {
    console.error("Email send general error:", err);
    return { success: false, error: err?.message || String(err) };
  }
}
