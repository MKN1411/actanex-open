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

  // 2. Resource Collision / Conflict Check (Safe Overwrite Protection)
  if (path === "/api/v1/installer/check-conflicts" && method === "POST") {
    try {
      const body = await request.json() as any;
      const cfAccountId = (body.cfAccountId || "").trim();
      const cfApiToken = (body.cfApiToken || "").trim();
      const workerName = (body.workerName || "actanex-open-worker").trim();
      const d1DbName = (body.d1DbName || "actanex-open-db").trim();
      const r2BucketName = (body.r2BucketName || "actanex-open-storage").trim();

      if (!cfAccountId || !cfApiToken) {
        return errorResponse("Cloudflare Account-ID und API-Token sind erforderlich.", 400);
      }

      const cfHeaders = {
        "Authorization": `Bearer ${cfApiToken}`,
        "Content-Type": "application/json"
      };

      // A. Check Worker Script
      let workerExists = false;
      try {
        const wRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`, {
          headers: cfHeaders
        });
        if (wRes.ok) {
          const wData = await wRes.json() as any;
          workerExists = Boolean(wData.success && wData.result);
        }
      } catch {}

      // B. Check D1 Database
      let d1Exists = false;
      let d1Uuid: string | null = null;
      try {
        const d1Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
          headers: cfHeaders
        });
        if (d1Res.ok) {
          const d1Data = await d1Res.json() as any;
          const match = (d1Data.result || []).find((d: any) => d.name === d1DbName);
          if (match) {
            d1Exists = true;
            d1Uuid = match.uuid;
          }
        }
      } catch {}

      // C. Check R2 Bucket
      let r2Exists = false;
      try {
        const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
          headers: cfHeaders
        });
        if (r2Res.ok) {
          r2Exists = true;
        }
      } catch {}

      const hasAnyConflict = workerExists || d1Exists || r2Exists;

      return jsonResponse({
        success: true,
        conflicts: {
          worker: { exists: workerExists, name: workerName },
          d1: { exists: d1Exists, name: d1DbName, uuid: d1Uuid },
          r2: { exists: r2Exists, name: r2BucketName }
        },
        hasAnyConflict
      });
    } catch (err: any) {
      return errorResponse(`Fehler bei der Kollisionsprüfung: ${err.message}`, 500);
    }
  }

  // 3. Automated Cloudflare Provisioning (Zero-Local-Install)
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

      // Custom GitHub Repo Source & Overwrite Flag
      const gitHubRepo = (body.gitHubRepo || "MKN1411/actanex-open").trim();
      const gitHubBranch = (body.gitHubBranch || "main").trim();
      const allowOverwrite = Boolean(body.allowOverwrite);

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

      // B. Kollisionsschutz prüfen (falls allowOverwrite false ist)
      if (!allowOverwrite) {
        let workerExists = false;
        try {
          const wCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/workers/scripts/${workerName}`, {
            headers: cfHeaders
          });
          if (wCheck.ok) {
            const wData = await wCheck.json() as any;
            workerExists = Boolean(wData.success && wData.result);
          }
        } catch {}

        let d1Exists = false;
        try {
          const dCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/d1/database`, {
            headers: cfHeaders
          });
          if (dCheck.ok) {
            const dData = await dCheck.json() as any;
            d1Exists = Boolean((dData.result || []).some((d: any) => d.name === d1DbName));
          }
        } catch {}

        let r2Exists = false;
        try {
          const rCheck = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
            headers: cfHeaders
          });
          if (rCheck.ok) r2Exists = true;
        } catch {}

        const conflicts: string[] = [];
        if (workerExists) conflicts.push(`Worker Script '${workerName}'`);
        if (d1Exists) conflicts.push(`D1 Datenbank '${d1DbName}'`);
        if (r2Exists) conflicts.push(`R2 Bucket '${r2BucketName}'`);

        if (conflicts.length > 0) {
          return errorResponse(
            `Kollision erkannt: Folgende Ressourcen existieren bereits: ${conflicts.join(", ")}. Bitte aktivieren Sie 'Überschreiben erlauben' oder wählen Sie andere Namen.`,
            409
          );
        }
      }

      // C. D1 Database ermitteln oder erstellen
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

      // D. R2 Storage Bucket erstellen
      await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
        method: "PUT",
        headers: cfHeaders
      });

      // E. Schemamigrationen aus Custom GitHub Repository einspielen
      let schemaApplied = false;
      try {
        const schemaUrl = `https://raw.githubusercontent.com/${gitHubRepo}/${gitHubBranch}/src/Worker/db/full_schema_combined.sql`;
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
