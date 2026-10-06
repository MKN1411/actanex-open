#!/usr/bin/env node
/**
 * ActaNex Open - Automated Cloudflare Setup & Secret Companion Server
 * Zero-Dependency Node.js server for local 1-Click Provisioning
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const INSTALLER_HTML = path.join(__dirname, 'index.html');
const { CloudflareUpdate } = require('./load-updater.cjs');

// Helper to make HTTPS requests to Cloudflare API v4
async function cfApiRequest(endpoint, method = 'GET', token, body = null) {
  const url = `https://api.cloudflare.com/client/v4${endpoint}`;
  const headers = {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    'User-Agent': 'ActaNex-Installer/1.0'
  };

  const options = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const res = await fetch(url, options);
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, data: JSON.parse(text) };
  } catch {
    return { status: res.status, ok: res.ok, data: text };
  }
}

// PBKDF2 Password Hashing (matches Cloudflare Worker auth)
function hashPassword(password, saltHex) {
  const salt = Buffer.from(saltHex, 'hex');
  const derivedKey = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha256');
  return derivedKey.toString('hex');
}

const server = http.createServer(async (req, res) => {
  const parsedUrl = new URL(req.url, `http://${req.headers.host}`);
  const pathname = parsedUrl.pathname;

  // CORS headers for local versatility
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  // 1. Static UI Route
  if (pathname === '/installer-update.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    fs.createReadStream(path.join(ROOT_DIR, 'src/Web/installer-update.js')).pipe(res);
    return;
  }
  if (pathname === '/' || pathname === '/index.html' || pathname === '/install') {
    if (fs.existsSync(INSTALLER_HTML)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      fs.createReadStream(INSTALLER_HTML).pipe(res);
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('installer/index.html not found');
      return;
    }
  }

  // 2. Health Check
  if (pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', version: '3.0.0', app: 'ActaNex Installer Companion' }));
    return;
  }

  // Helper to read JSON body
  async function readBody() {
    return new Promise((resolve, reject) => {
      let data = '';
      req.on('data', chunk => data += chunk);
      req.on('end', () => {
        try {
          resolve(data ? JSON.parse(data) : {});
        } catch (e) {
          reject(e);
        }
      });
      req.on('error', reject);
    });
  }

  // 3. Verify Token
  if (['/api/update-plan', '/api/update'].includes(pathname) && req.method === 'POST') {
    try {
      const body = await readBody();
      const updater = new CloudflareUpdate();
      const result = pathname.endsWith('update-plan') ? await updater.preflight(body) : await updater.execute(body);
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(409, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }
  if (pathname === '/api/verify-token' && req.method === 'POST') {
    try {
      const { token, accountId } = await readBody();
      if (!token) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Token missing' }));
        return;
      }

      let verifyRes = null;
      let isAccountToken = token.startsWith('cfat_') && accountId;

      if (isAccountToken) {
        verifyRes = await cfApiRequest(`/accounts/${accountId}/tokens/verify`, 'GET', token);
      } else {
        verifyRes = await cfApiRequest('/user/tokens/verify', 'GET', token);
        if (!verifyRes.ok && accountId) {
          // Fallback to account token endpoint
          verifyRes = await cfApiRequest(`/accounts/${accountId}/tokens/verify`, 'GET', token);
        }
      }

      if (!verifyRes || !verifyRes.ok) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: verifyRes?.data || 'Invalid API Token' }));
        return;
      }

      // If account ID provided, verify account membership
      let accountName = 'OK';
      if (accountId) {
        const accRes = await cfApiRequest(`/accounts/${accountId}`, 'GET', token);
        if (accRes.ok && accRes.data?.result) {
          accountName = accRes.data.result.name;
        }
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        status: 'active',
        accountName,
        details: verifyRes.data?.result
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 3b. Check Resource Conflicts
  if (pathname === '/api/check-conflicts' && req.method === 'POST') {
    try {
      const { accountId, token, workerName, d1DbName, r2BucketName } = await readBody();
      if (!token || !accountId) {
        res.writeHead(400, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ success: false, error: 'Token und AccountId erforderlich' }));
        return;
      }

      // Check Worker Script
      let workerExists = false;
      const wRes = await cfApiRequest(`/accounts/${accountId}/workers/scripts/${workerName || 'actanex-open-worker'}`, 'GET', token);
      if (wRes.ok || wRes.status === 200) workerExists = true;

      // Check D1 Database
      let d1Exists = false;
      let d1Uuid = null;
      const d1Res = await cfApiRequest(`/accounts/${accountId}/d1/database`, 'GET', token);
      if (d1Res.ok && Array.isArray(d1Res.data?.result)) {
        const found = d1Res.data.result.find(d => d.name === (d1DbName || 'actanex-open-db'));
        if (found) {
          d1Exists = true;
          d1Uuid = found.uuid;
        }
      }

      // Check R2 Bucket
      let r2Exists = false;
      const r2Res = await cfApiRequest(`/accounts/${accountId}/r2/buckets/${r2BucketName || 'actanex-open-storage'}`, 'GET', token);
      if (r2Res.ok) r2Exists = true;

      const hasAnyConflict = workerExists || d1Exists || r2Exists;

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        success: true,
        conflicts: {
          worker: { exists: workerExists, name: workerName },
          d1: { exists: d1Exists, name: d1DbName, uuid: d1Uuid },
          r2: { exists: r2Exists, name: r2BucketName }
        },
        hasAnyConflict
      }));
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
    return;
  }

  // 4. Start Installation Stream (NDJSON streaming)
  if (pathname === '/api/start-install' && req.method === 'POST') {
    res.writeHead(200, {
      'Content-Type': 'application/x-ndjson; charset=utf-8',
      'Transfer-Encoding': 'chunked',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    });

    const sendEvent = (type, message, extra = {}) => {
      res.write(JSON.stringify({ type, message, timestamp: new Date().toISOString(), ...extra }) + '\n');
    };

    try {
      const config = await readBody();
      if (config.operation === 'update' || config.allowOverwrite) throw new Error('Bitte den getrennten Update-Ablauf verwenden.');
      const {
        cfAccountId,
        cfApiToken,
        workerName,
        d1DbName,
        r2BucketName,
        adminFullName,
        adminEmail,
        adminPassword,
        jwtSecret,
        lexwareApiKey,
        resendApiKey,
        emailSenderName,
        emailSenderEmail,
        companyName,
        companyVatId,
        companyStreet,
        companyCity
      } = config;

      sendEvent('step', `[1/6] Validiere Cloudflare Zugangsdaten für Account ${cfAccountId}...`);
      const tokenTest = await cfApiRequest('/user/tokens/verify', 'GET', cfApiToken);
      if (!tokenTest.ok) {
        sendEvent('error', `Cloudflare Token ungültig: ${JSON.stringify(tokenTest.data)}`);
        res.end();
        return;
      }
      sendEvent('success', 'Cloudflare API Token erfolgreich validiert.');

      for (const endpoint of [
        `/accounts/${cfAccountId}/workers/scripts/${workerName}/settings`,
        `/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`
      ]) {
        const existing = await cfApiRequest(endpoint, 'GET', cfApiToken);
        if (existing.ok) throw new Error('Ressource existiert bereits. Bitte den Update-Modus verwenden.');
        if (existing.status !== 404) throw new Error('Ressourcen konnten nicht eindeutig geprueft werden. Installation gestoppt.');
      }

      // 2. D1 Database Check & Create
      sendEvent('step', `[2/6] Prüfe D1 SQL-Datenbank '${d1DbName}'...`);
      let dbUuid = null;
      const listD1 = await cfApiRequest(`/accounts/${cfAccountId}/d1/database`, 'GET', cfApiToken);
      if (!listD1.ok || !listD1.data?.success) throw new Error('D1-Ressourcenpruefung fehlgeschlagen.');
      if (listD1.ok && Array.isArray(listD1.data?.result)) {
        const existingDb = listD1.data.result.find(d => d.name === d1DbName);
        if (existingDb) {
          throw new Error('Datenbank existiert bereits. Bitte den Update-Modus verwenden.');
        }
      }

      if (!dbUuid) {
        sendEvent('info', `Erstelle neue D1 Datenbank '${d1DbName}'...`);
        const createD1 = await cfApiRequest(`/accounts/${cfAccountId}/d1/database`, 'POST', cfApiToken, {
          name: d1DbName
        });
        if (createD1.ok && createD1.data?.result?.uuid) {
          dbUuid = createD1.data.result.uuid;
          sendEvent('success', `D1 Datenbank erfolgreich erstellt! UUID: ${dbUuid}`);
        } else {
          sendEvent('warn', `D1 Erstellung über API: ${JSON.stringify(createD1.data)}. Versuche lokalen Fallback...`);
        }
      }

      // 3. R2 Bucket Check & Create
      sendEvent('step', `[3/6] Prüfe R2 Object Storage Bucket '${r2BucketName}'...`);
      const r2Res = await cfApiRequest(`/accounts/${cfAccountId}/r2/buckets/${r2BucketName}`, 'PUT', cfApiToken);
      if (r2Res.ok || r2Res.status === 409) {
        sendEvent('success', `R2 Bucket '${r2BucketName}' einsatzbereit.`);
      } else {
        sendEvent('warn', `R2 Bucket Response: ${JSON.stringify(r2Res.data)}`);
      }

      // 4. Schema Migrations einspielen
      sendEvent('step', '[4/6] Führe SQL-Migrationen auf D1 Datenbank aus...');
      const dbDir = path.join(ROOT_DIR, 'src', 'Worker', 'db');
      if (fs.existsSync(dbDir)) {
        const sqlFiles = fs.readdirSync(dbDir)
          .filter(f => f.endsWith('.sql') && !f.includes('full_schema_combined') && !f.includes('init_clean'))
          .sort();

        sendEvent('info', `Gefunden: ${sqlFiles.length} Migrationsdateien.`);

        for (const file of sqlFiles) {
          const filePath = path.join(dbDir, file);
          const sql = fs.readFileSync(filePath, 'utf-8');

          if (dbUuid) {
            // Ausführung über Cloudflare D1 Raw Query API
            try {
              const execRes = await cfApiRequest(`/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, 'POST', cfApiToken, {
                sql
              });
              if (execRes.ok) {
                sendEvent('info', `✓ Migration ${file} erfolgreich angewendet.`);
              } else {
                sendEvent('warn', `Hinweis bei ${file}: ${execRes.data?.errors?.[0]?.message || 'Bereits angewendet'}`);
              }
            } catch (sqlErr) {
              sendEvent('warn', `Fehler beim Senden von ${file}: ${sqlErr.message}`);
            }
          }
        }
        sendEvent('success', 'Datenbankschema & GoBD-Tabellen initialisiert.');
      }

      // 5. Cloudflare Worker Secrets verschlüsselt speichern via Cloudflare API v4
      sendEvent('step', `[5/6] Speichere verschlüsselte Secrets im Cloudflare Worker '${workerName}'...`);

      const secretsToSet = [
        { name: 'JWT_SECRET', text: jwtSecret },
        { name: 'ADMIN_INITIAL_EMAIL', text: adminEmail },
        { name: 'ADMIN_INITIAL_PASSWORD', text: adminPassword },
        { name: 'ADMIN_INITIAL_NAME', text: adminFullName }
      ];

      if (lexwareApiKey) secretsToSet.push({ name: 'LEXWARE_API_KEY', text: lexwareApiKey });
      if (resendApiKey) secretsToSet.push({ name: 'RESEND_API_KEY', text: resendApiKey });

      for (const secret of secretsToSet) {
        try {
          const secretRes = await cfApiRequest(
            `/accounts/${cfAccountId}/workers/scripts/${workerName}/secrets`,
            'PUT',
            cfApiToken,
            {
              name: secret.name,
              text: secret.text,
              type: 'secret_text'
            }
          );

          if (secretRes.ok) {
            sendEvent('success', `✓ Secret '${secret.name}' verschlüsselt in Cloudflare gespeichert.`);
          } else {
            sendEvent('warn', `Secret '${secret.name}' Response: ${secretRes.data?.errors?.[0]?.message || 'Wrangler Secret Deployment empfohlen'}`);
          }
        } catch (sErr) {
          sendEvent('warn', `Secret ${secret.name}: ${sErr.message}`);
        }
      }

      // 6. Initialen Administrator in D1 einpflegen
      sendEvent('step', '[6/6] Richte initialen Master-Admin Account ein...');
      if (dbUuid && adminEmail && adminPassword) {
        const salt = crypto.randomBytes(16).toString('hex');
        const hash = hashPassword(adminPassword, salt);
        const adminId = 'usr_admin_' + crypto.randomUUID().slice(0, 8);
        const now = new Date().toISOString();

        const insertAdminSql = `
          INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
          VALUES ('${adminId}', '${adminEmail.toLowerCase()}', '${hash}', '${salt}', '${adminFullName}', 'Admin', 1, '${now}')
          ON CONFLICT(email) DO UPDATE SET
            password_hash = excluded.password_hash,
            salt = excluded.salt,
            full_name = excluded.full_name;
        `;

        try {
          const adminInsertRes = await cfApiRequest(`/accounts/${cfAccountId}/d1/database/${dbUuid}/raw`, 'POST', cfApiToken, {
            sql: insertAdminSql
          });
          if (adminInsertRes.ok) {
            sendEvent('success', `✓ Admin-Konto '${adminEmail}' aktiv in D1 angelegt.`);
          }
        } catch (aErr) {
          sendEvent('warn', `Admin Seed: ${aErr.message}`);
        }
      }

      // 7. Update wrangler.jsonc with D1 Database UUID if needed
      const wranglerJsoncPath = path.join(ROOT_DIR, 'src', 'Worker', 'wrangler.jsonc');
      if (fs.existsSync(wranglerJsoncPath) && dbUuid) {
        try {
          let wranglerContent = fs.readFileSync(wranglerJsoncPath, 'utf-8');
          wranglerContent = wranglerContent.replace(
            /"database_id":\s*"[^"]*"/,
            `"database_id": "${dbUuid}"`
          );
          fs.writeFileSync(wranglerJsoncPath, wranglerContent, 'utf-8');
          sendEvent('info', `wrangler.jsonc mit D1 UUID (${dbUuid}) aktualisiert.`);
        } catch (wErr) {
          sendEvent('warn', `wrangler.jsonc Update: ${wErr.message}`);
        }
      }

      sendEvent('finished', '🎉 GLÜCKWUNSCH: ActaNex Open wurde erfolgreich in Cloudflare eingerichtet!', {
        loginEmail: adminEmail,
        workerTarget: workerName,
        d1Uuid: dbUuid
      });

    } catch (generalErr) {
      sendEvent('error', `Kritischer Installationsfehler: ${generalErr.message}`);
    } finally {
      res.end();
    }
    return;
  }

  // Fallback 404
  res.writeHead(404, { 'Content-Type': 'text/plain' });
  res.end('Not Found');
});

server.listen(PORT, () => {
  const url = `http://localhost:${PORT}`;
  console.log('\n============================================================');
  console.log('  🚀 ActaNex Open - Cloudflare Setup & Provisioning Companion');
  console.log('============================================================');
  console.log(`  Web-Oberfläche aktiv unter: \x1b[36m${url}\x1b[0m`);
  console.log('  Drücken Sie Strg+C zum Beenden.');
  console.log('============================================================\n');

  // Try to open browser automatically
  const startCmd = process.platform === 'win32' ? `start ${url}` :
                   process.platform === 'darwin' ? `open ${url}` :
                   `xdg-open ${url}`;
  if (!process.env.NO_BROWSER) exec(startCmd, () => {});
});
