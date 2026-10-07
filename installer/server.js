#!/usr/bin/env node
/**
 * ActaNex Open - Automated Cloudflare Setup & Secret Companion Server
 * Zero-Dependency Node.js server for local 1-Click Provisioning
 */

const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { exec, spawn, execFileSync } = require('child_process');

const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.resolve(__dirname, '..');
const INSTALLER_HTML = path.join(__dirname, 'index.html');
const { CloudflareUpdate } = require('./load-updater.cjs');
const { installCloudflare } = require('./load-installer.cjs');
let updateSourceRef = 'main';
try {
  updateSourceRef = execFileSync('git', ['branch', '--show-current'], {cwd:ROOT_DIR,encoding:'utf8'}).trim() || 'main';
} catch {}

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
    res.end(JSON.stringify({ status: 'healthy', version: require('../package.json').version, app: 'ActaNex Installer Companion', updateSourceRef }));
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
  if (['discover', 'update-plan', 'update', 'update-stream', 'backup-list', 'backup-create', 'backup-download', 'backup-worker', 'backup-sql', 'restore-plan', 'restore'].some(action => pathname === `/api/${action}`) && req.method === 'POST') {
    try {
      const body = await readBody();
      const updater = new CloudflareUpdate();
      if(pathname==='/api/backup-sql') {
        const response=await updater.backups().downloadSql(body);
        res.writeHead(200,Object.fromEntries(response.headers));
        const reader=response.body.getReader();
        for(;;) {const {done,value}=await reader.read();if(done) break;res.write(value);}
        res.end();return;
      }
      if (pathname === '/api/update-stream') {
        const response = updater.stream(body);
        res.writeHead(200,Object.fromEntries(response.headers));
        res.flushHeaders();
        const reader = response.body.getReader();
        for (;;) {const {done,value}=await reader.read();if(done) break;res.write(value);}
        res.end();return;
      }
      const result = await updater.dispatch(pathname.split('/').pop(), body);
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
      const { accountId, token, workerName, d1DbName, r2BucketName, fileStorageMode = 'R2' } = await readBody();
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
      if(fileStorageMode==='R2') {
        const r2Res = await cfApiRequest(`/accounts/${accountId}/r2/buckets/${r2BucketName || 'actanex-open-storage'}`, 'GET', token);
        if (r2Res.ok) r2Exists = true;
      }

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
      sendEvent('step','Pruefe Ressourcen und installiere den ausgewaehlten Dateispeicher.');
      const installed=await installCloudflare(config);
      sendEvent('finished',installed.message,{loginEmail:config.adminEmail,workerTarget:config.workerName,d1Uuid:installed.resources.d1Database.uuid,resources:installed.resources});
      return;


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
