import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { hashPassword } from "../utils/crypto";

export async function handleInstallerRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  // 1. Verify Cloudflare Token & Account
  if (path === "/api/v1/installer/verify-token" && method === "POST") {
    try {
      const body = await request.json() as any;
      const token = (body.token || "").trim();
      const accountId = (body.accountId || "").trim();

      if (!token) {
        return errorResponse("API-Token erforderlich.", 400);
      }

      const verifyRes = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      const verifyData = await verifyRes.json() as any;
      if (!verifyRes.ok || !verifyData.success) {
        const msg = verifyData.errors?.[0]?.message || "Ungültiges Cloudflare API Token.";
        return errorResponse(`Cloudflare Token-Fehler: ${msg}`, 401);
      }

      let accountName = "Verifiziert";
      if (accountId) {
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, {
            headers: { "Authorization": `Bearer ${token}` }
          });
          const accData = await accRes.json() as any;
          if (accRes.ok && accData.success && accData.result) {
            accountName = accData.result.name;
          }
        } catch {}
      }

      return jsonResponse({
        success: true,
        status: "active",
        accountName,
        details: verifyData.result
      });
    } catch (err: any) {
      return errorResponse(`Fehler bei Token-Verifikation: ${err.message}`, 500);
    }
  }

  // 2. Automated Cloudflare Provisioning (Zero-Local-Install)
  if (path === "/api/v1/installer/provision" && method === "POST") {
    try {
      const body = await request.json() as any;
      const cfAccountId = (body.cfAccountId || "").trim();
      const cfApiToken = (body.cfApiToken || "").trim();
      const workerName = (body.workerName || "actanex-open-worker").trim();
      const d1DbName = (body.d1DbName || "actanex-open-db").trim();
      const r2BucketName = (body.r2BucketName || "actanex-open-storage").trim();
      const adminFullName = (body.adminFullName || "Administrator").trim();
      const adminEmail = (body.adminEmail || "").trim().toLowerCase();
      const adminPassword = (body.adminPassword || "").trim();
      const jwtSecret = (body.jwtSecret || "").trim();
      const lexwareApiKey = (body.lexwareApiKey || "").trim();
      const resendApiKey = (body.resendApiKey || "").trim();

      if (!cfAccountId || !cfApiToken) {
        return errorResponse("Cloudflare Account-ID und API-Token sind erforderlich.", 400);
      }
      if (!adminEmail || !adminPassword) {
        return errorResponse("Admin E-Mail und Passwort sind erforderlich.", 400);
      }

      const cfHeaders = {
        "Authorization": `Bearer ${cfApiToken}`,
        "Content-Type": "application/json"
      };

      // A. Token validieren
      const testToken = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
        headers: cfHeaders
      });
      if (!testToken.ok) {
        return errorResponse("Cloudflare API Token ungültig oder abgelaufen.", 401);
      }

      // B. D1 Database ermitteln oder erstellen
      let dbUuid = "";
      const listD1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
        headers: cfHeaders
      });
      if (listD1.ok) {
        const d1Data = await listD1.json() as any;
        const found = (d1Data.result || []).find((d: any) => d.name === d1DbName);
        if (found) {
          dbUuid = found.uuid;
        }
      }

      if (!dbUuid) {
        const createD1 = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ name: d1DbName })
        });
        const d1Created = await createD1.json() as any;
        if (createD1.ok && d1Created.success && d1Created.result) {
          dbUuid = d1Created.result.uuid;
        } else {
          const errMsg = d1Created.errors?.[0]?.message || "D1-Erstellung fehlgeschlagen.";
          return errorResponse(`D1 Datenbank Fehler: ${errMsg}`, 500);
        }
      }

      // C. R2 Storage Bucket erstellen
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
        method: "PUT",
        headers: cfHeaders
      });

      // D. Schemamigrationen einspielen
      let schemaApplied = false;
      try {
        const schemaUrl = "https://raw.githubusercontent.com/MKN1411/actanex-open/main/src/Worker/db/full_schema_combined.sql";
        const schemaRes = await fetch(schemaUrl);
        if (schemaRes.ok) {
          const sql = await schemaRes.text();
          const d1Exec = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, {
            method: "POST",
            headers: cfHeaders,
            body: JSON.stringify({ sql })
          });
          schemaApplied = d1Exec.ok;
        }
      } catch (err) {
        console.warn("Schema execution warning:", err);
      }

      // E. Secrets im Cloudflare Worker speichern
      const secretsToPut: { name: string; text: string }[] = [
        { name: "JWT_SECRET", text: jwtSecret || crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "") },
        { name: "ADMIN_INITIAL_EMAIL", text: adminEmail },
        { name: "ADMIN_INITIAL_PASSWORD", text: adminPassword },
        { name: "ADMIN_INITIAL_NAME", text: adminFullName }
      ];

      if (lexwareApiKey) secretsToPut.push({ name: "LEXWARE_API_KEY", text: lexwareApiKey });
      if (resendApiKey) secretsToPut.push({ name: "RESEND_API_KEY", text: resendApiKey });

      const secretsStatus: Record<string, boolean> = {};
      for (const s of secretsToPut) {
        try {
          const putSec = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}/secrets`, {
            method: "PUT",
            headers: cfHeaders,
            body: JSON.stringify({
              name: s.name,
              text: s.text,
              type: "secret_text"
            })
          });
          secretsStatus[s.name] = putSec.ok;
        } catch {
          secretsStatus[s.name] = false;
        }
      }

      // F. Master Admin Account in D1 registrieren
      let adminCreated = false;
      try {
        const saltBytes = new Uint8Array(16);
        crypto.getRandomValues(saltBytes);
        const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, "0")).join("");
        const passwordHash = await hashPassword(adminPassword, salt);
        const adminId = "usr_admin_" + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        const insertAdminSql = `
          INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
          VALUES ('${adminId}', '${adminEmail}', '${passwordHash}', '${salt}', '${adminFullName}', 'Admin', 1, '${now}')
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            full_name = excluded.full_name;
        `;

        const adminInsertRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, {
          method: "POST",
          headers: cfHeaders,
          body: JSON.stringify({ sql: insertAdminSql })
        });
        adminCreated = adminInsertRes.ok;
      } catch (err) {
        console.warn("Admin insert warning:", err);
      }

      return jsonResponse({
        success: true,
        message: "ActaNex Open wurde erfolgreich in Ihrem Cloudflare-Account bereitgestellt!",
        resources: {
          d1Database: { name: d1DbName, uuid: dbUuid, schemaApplied },
          r2Bucket: { name: r2BucketName },
          workerScript: { name: workerName },
          secretsSaved: secretsStatus,
          adminUser: { email: adminEmail, created: adminCreated }
        }
      });
    } catch (err: any) {
      return errorResponse(`Kritischer Installationsfehler: ${err.message}`, 500);
    }
  }

  return null;
}
