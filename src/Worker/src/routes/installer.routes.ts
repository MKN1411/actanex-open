import { Env } from "../types";
import { jsonResponse, errorResponse } from "../utils/http";
import { hashPassword } from "../utils/crypto";
import { CloudflareUpdate } from "../../../../installer/cloudflare-update";
import { installCloudflare } from '../../../../installer/cloudflare-install';

async function verifyCloudflareToken(
  token: string,
  accountId?: string
): Promise<{ valid: boolean; accountName?: string; error?: string; result?: any }> {
  const cfHeaders = {
    "Authorization": `Bearer ${token}`,
    "Content-Type": "application/json"
  };

  // 1. If Account-Owned token format (cfat_) and accountId provided, check account endpoint first
  if (token.startsWith("cfat_") && accountId) {
    try {
      const accVerify = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`, {
        headers: cfHeaders
      });
      const accData = await accVerify.json() as any;
      if (accVerify.ok && accData.success) {
        let accountName = "Verifiziert";
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json() as any;
          if (accRes.ok && aData.success && aData.result) accountName = aData.result.name;
        } catch {}
        return { valid: true, accountName, result: accData.result };
      }
    } catch {}
  }

  // 2. Try User token endpoint (standard user tokens & cfut_)
  try {
    const userVerify = await fetch("https://api.cloudflare.com/client/v4/user/tokens/verify", {
      headers: cfHeaders
    });
    const userData = await userVerify.json() as any;
    if (userVerify.ok && userData.success) {
      let accountName = "Verifiziert";
      if (accountId) {
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json() as any;
          if (accRes.ok && aData.success && aData.result) accountName = aData.result.name;
        } catch {}
      }
      return { valid: true, accountName, result: userData.result };
    }
  } catch {}

  // 3. Fallback: Try Account endpoint if accountId is provided
  if (accountId) {
    try {
      const accVerify = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/tokens/verify`, {
        headers: cfHeaders
      });
      const accData = await accVerify.json() as any;
      if (accVerify.ok && accData.success) {
        let accountName = "Verifiziert";
        try {
          const accRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}`, { headers: cfHeaders });
          const aData = await accRes.json() as any;
          if (accRes.ok && aData.success && aData.result) accountName = aData.result.name;
        } catch {}
        return { valid: true, accountName, result: accData.result };
      }
    } catch {}
  }

  return { valid: false, error: "Cloudflare API Token ungültig oder abgelaufen." };
}

export async function handleInstallerRoutes(
  request: Request,
  env: Env,
  path: string,
  method: string
): Promise<Response | null> {
  if(path==='/api/v1/installer/backup-capture' && method==='POST') {
    try {const body=await request.json() as any;return jsonResponse(await new CloudflareUpdate().backups().captureLocked(body,body.backupLockId));}
    catch(error:any) {return errorResponse(error.message,409);}
  }
  if(path==='/api/v1/installer/backup-sql' && method==='POST') {
    try {return await new CloudflareUpdate().backups().downloadSql(await request.json() as any);}
    catch(error:any) {return errorResponse(error.message,409);}
  }
  if(['/api/v1/installer/deploy','/api/v1/installer/provision'].includes(path) && method==='POST') {
    try {return jsonResponse(await installCloudflare(await request.json() as any));}
    catch(error: any) {return errorResponse(error.message,409);}
  }
  if (["discover", "update-plan", "update", "update-stream", "backup-list", "backup-create", "backup-download", "backup-worker", "restore-plan", "restore"].some(action => path === `/api/v1/installer/${action}`) && method === "POST") {
    try {
      const body = await request.json() as any;
      const updater = new CloudflareUpdate(undefined,undefined,async(config,lockId)=>{
        const response=await fetch(new URL('/api/v1/installer/backup-capture',request.url),{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({...config,backupLockId:lockId}),signal:AbortSignal.timeout(240000)});
        const result=await response.json() as any;
        if(!response.ok || !result.success) throw new Error(result.error || 'Cloudflare-Sicherung fehlgeschlagen.');
        return result;
      });
      if (path.endsWith('/update-stream')) return updater.stream(body);
      return jsonResponse(await updater.dispatch(path.split('/').pop()!, body), 200, {"Cache-Control":"no-store"});
    } catch (err: any) {
      return errorResponse(err.message, 409);
    }
  }
  // 1. Verify Cloudflare Token & Account
  if (path === "/api/v1/installer/verify-token" && method === "POST") {
    try {
      const body = await request.json() as any;
      const token = (body.token || "").trim();
      const accountId = (body.accountId || "").trim();

      if (!token) {
        return errorResponse("API-Token erforderlich.", 400);
      }

      const verification = await verifyCloudflareToken(token, accountId);
      if (!verification.valid) {
        return errorResponse(`Cloudflare Token-Fehler: ${verification.error || "Ungültiges Token."}`, 401);
      }

      return jsonResponse({
        success: true,
        status: "active",
        accountName: verification.accountName || "Verifiziert",
        details: verification.result
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
      const fileStorageMode=body.fileStorageMode || 'R2';
      if(!['D1','R2'].includes(fileStorageMode)) return errorResponse('Ungueltiger Dateispeichermodus.',400);
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
        if (wRes.status === 200) {
          workerExists = true;
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
      if(fileStorageMode==='R2') {
      try {
        const r2Res = await fetch(`https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, {
          headers: cfHeaders
        });
        if (r2Res.ok) {
          r2Exists = true;
        }
      } catch {}
      }
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


  return null;
}
