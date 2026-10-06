/**
 * Build Script: Standalone Cloudflare Worker Bundle with Embedded Web Frontend
 * 
 * Bundles all static frontend assets (HTML, CSS, JS, Views, PWA) into the Worker bundle,
 * turning the Cloudflare Worker into a 100% self-hosted, standalone application.
 * 
 * When deployed, visiting the Worker root URL directly serves the ActaNex Web App
 * with Login, while all API requests hit /api/v1 on the exact same host.
 */

const fs = require('fs');
const path = require('path');

const ROOT_DIR = path.resolve(__dirname, '..');
const WEB_DIR = path.join(ROOT_DIR, 'src', 'Web');
const BUNDLE_PATH = path.join(ROOT_DIR, 'src', 'Worker', 'bundle', 'worker.bundle.js');

function getFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const full = path.join(dir, file);
    const stat = fs.statSync(full);
    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(full));
    } else {
      results.push(full);
    }
  });
  return results;
}

function getMime(filePath) {
  if (filePath.endsWith('.html')) return 'text/html; charset=utf-8';
  if (filePath.endsWith('.css')) return 'text/css; charset=utf-8';
  if (filePath.endsWith('.js')) return 'application/javascript; charset=utf-8';
  if (filePath.endsWith('.json')) return 'application/json; charset=utf-8';
  return 'text/plain; charset=utf-8';
}

function build() {
  console.log('--- Building Standalone Worker Bundle ---');
  
  const files = getFiles(WEB_DIR);
  const assetMap = {};

  files.forEach(f => {
    let rel = '/' + path.relative(WEB_DIR, f).split(path.sep).join('/');
    // Skip installer.html from the deployed production app bundle
    if (rel.includes('installer.html')) return;
    assetMap[rel] = {
      mime: getMime(rel),
      body: fs.readFileSync(f, 'utf8')
    };
  });

  // Alias root path '/' to '/index.html'
  assetMap['/'] = assetMap['/index.html'];

  const assetMapJson = JSON.stringify(assetMap);
  console.log(`Embedded ${Object.keys(assetMap).length} static assets (${(assetMapJson.length / (1024 * 1024)).toFixed(2)} MB raw JSON).`);

  const baseCode = fs.readFileSync(BUNDLE_PATH, 'utf8');

  // If already patched, strip previous asset prefix to avoid duplication
  let cleanBaseCode = baseCode;
  const existingPrefixIdx = cleanBaseCode.indexOf('// === STANDALONE EMBEDDED ASSETS START ===');
  const existingPrefixEnd = cleanBaseCode.indexOf('// === STANDALONE EMBEDDED ASSETS END ===');
  if (existingPrefixIdx !== -1 && existingPrefixEnd !== -1) {
    cleanBaseCode = cleanBaseCode.substring(0, existingPrefixIdx) + cleanBaseCode.substring(existingPrefixEnd + '// === STANDALONE EMBEDDED ASSETS END ==='.length);
    // Remove the hook inside fetch if present
    cleanBaseCode = cleanBaseCode.replace(/const __static = __serveStaticAsset\(request\);\s*if \(__static\) return __static;/g, '');
  }

  // Ensure admin user bootstrap in worker bundle uses ADMIN_INITIAL_EMAIL and ADMIN_INITIAL_PASSWORD secrets
  const oldBootstrapPattern = /const userCount = await env2\.DB\.prepare\("SELECT COUNT\(\*\) as count FROM users"\)\.first\(\);[\s\S]*?usr_init_admin[\s\S]*?}\s*}/;
  if (oldBootstrapPattern.test(cleanBaseCode)) {
    const newBootstrapCode = `const adminEmail = (env2.ADMIN_INITIAL_EMAIL || "").trim().toLowerCase();
      const adminPassword = env2.ADMIN_INITIAL_PASSWORD;
      const adminFullName = env2.ADMIN_INITIAL_NAME || "Administrator";

      if (adminEmail && adminPassword) {
        const existingAdmin = await env2.DB.prepare("SELECT id FROM users WHERE LOWER(email) = ?").bind(adminEmail).first();
        if (!existingAdmin) {
          const saltBytes = new Uint8Array(16);
          crypto.getRandomValues(saltBytes);
          const salt = Array.from(saltBytes).map(b => b.toString(16).padStart(2, "0")).join("");
          const passwordHash = await hashPassword(adminPassword, salt);
          await env2.DB.prepare(\`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES (?, ?, ?, ?, ?, 'Admin', 1, ?)
          \`).bind(\`usr_admin_\${crypto.randomUUID().slice(0, 8)}\`, adminEmail, passwordHash, salt, adminFullName, (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => {});
        }
      } else {
        const userCount = await env2.DB.prepare("SELECT COUNT(*) as count FROM users").first();
        if (!userCount || userCount.count === 0) {
          const defaultSalt = "f5de90270b9f7d2cb8efea3b9ff63eda";
          const defaultHash = "e6c33c123794cd954f17331d81efe78dd889af0f0dc346a6b18a21608d494c527371202d847ab9e7d4d1c6a5e6a2d097e04c48635719c5ff06165e567d89b7e9";
          await env2.DB.prepare(\`
            INSERT INTO users (id, email, password_hash, salt, full_name, role, is_active, created_at_utc)
            VALUES ('usr_init_admin', 'admin@example.com', ?, ?, 'Administrator', 'Admin', 1, ?)
          \`).bind(defaultHash, defaultSalt, (/* @__PURE__ */ new Date()).toISOString()).run().catch(() => {});
        }
      }
    }`;
    cleanBaseCode = cleanBaseCode.replace(oldBootstrapPattern, newBootstrapCode);
  }

  const assetHelper = `
// === STANDALONE EMBEDDED ASSETS START ===
const __EMBEDDED_ASSETS = ${assetMapJson};

function __serveStaticAsset(request) {
  const url = new URL(request.url);
  let pathname = url.pathname;
  if (pathname.endsWith('/') && pathname.length > 1) pathname = pathname.slice(0, -1);
  if (pathname === '') pathname = '/';
  
  // Do not intercept REST API routes
  if (pathname.startsWith('/api/')) return null;

  // Root always returns index.html (the ActaNex Web App & Login)
  if (pathname === '/') {
    return new Response(__EMBEDDED_ASSETS['/index.html'].body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache'
      }
    });
  }

  const asset = __EMBEDDED_ASSETS[pathname] || (pathname.endsWith('.html') ? null : __EMBEDDED_ASSETS[pathname + '.html']);
  if (asset) {
    return new Response(asset.body, {
      status: 200,
      headers: {
        'content-type': asset.mime,
        'cache-control': 'public, max-age=3600'
      }
    });
  }

  // SPA navigation fallback for browser requests
  const accept = request.headers.get('accept') || '';
  if (accept.includes('text/html') && __EMBEDDED_ASSETS['/index.html']) {
    return new Response(__EMBEDDED_ASSETS['/index.html'].body, {
      status: 200,
      headers: {
        'content-type': 'text/html; charset=utf-8',
        'cache-control': 'no-cache'
      }
    });
  }

  return null;
}
// === STANDALONE EMBEDDED ASSETS END ===
`;

  const targetRegex = /var src_default = \{\r?\n\s*async fetch\(request, env2\) \{/;
  if (!targetRegex.test(cleanBaseCode)) {
    throw new Error('Target fetch entrypoint not found in worker.bundle.js');
  }

  const patchedCode = assetHelper + '\n' + cleanBaseCode.replace(
    targetRegex,
    `var src_default = {\n  async fetch(request, env2) {\n    const __static = __serveStaticAsset(request);\n    if (__static) return __static;`
  );

  fs.writeFileSync(BUNDLE_PATH, patchedCode, 'utf8');
  console.log(`✓ Standalone bundle successfully written to ${BUNDLE_PATH}`);
  console.log(`Total bundle size: ${(patchedCode.length / (1024 * 1024)).toFixed(2)} MB`);
}

build();
