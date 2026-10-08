const fs = require('fs');
const path = require('path');

const token = process.env.CLOUDFLARE_API_TOKEN;
const accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '7e5fc7b4c7b59bde7441ded4d6238d28';
const scriptName = 'actanex-open-worker';
const bundlePath = path.resolve(__dirname, '../src/Worker/bundle/worker.bundle.js');

if (!token) {
  console.error("CLOUDFLARE_API_TOKEN environment variable required.");
  process.exit(1);
}

async function deploy() {
  console.log(`Fetching existing settings for ${scriptName}...`);
  const settingsRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}/settings`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const settingsData = await settingsRes.json();
  if (!settingsData.success) {
    throw new Error(`Failed to get settings: ${JSON.stringify(settingsData)}`);
  }

  const existingBindings = settingsData.result.bindings || [];
  const compatibilityDate = settingsData.result.compatibility_date || '2024-09-23';
  const compatibilityFlags = settingsData.result.compatibility_flags || ['nodejs_compat'];

  // Cloudflare preserves secret_text bindings if omitted from PUT script metadata (secrets are write-only)
  const uploadBindings = existingBindings.filter(b => b.type !== 'secret_text');

  console.log(`Sending ${uploadBindings.length} non-secret bindings (secrets are preserved automatically):`, uploadBindings.map(b => `${b.name} (${b.type})`));

  const metadata = {
    main_module: 'worker.bundle.js',
    compatibility_date: compatibilityDate,
    compatibility_flags: compatibilityFlags,
    bindings: uploadBindings
  };

  const scriptContent = fs.readFileSync(bundlePath, 'utf8');
  console.log(`Read bundle: ${(scriptContent.length / (1024 * 1024)).toFixed(2)} MB`);

  const boundary = '----CloudflareWorkerBoundary' + Date.now();
  let body = '';
  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="metadata"\r\n`;
  body += `Content-Type: application/json\r\n\r\n`;
  body += JSON.stringify(metadata) + '\r\n';

  body += `--${boundary}\r\n`;
  body += `Content-Disposition: form-data; name="worker.bundle.js"; filename="worker.bundle.js"\r\n`;
  body += `Content-Type: application/javascript+module\r\n\r\n`;
  body += scriptContent + '\r\n';
  body += `--${boundary}--\r\n`;

  console.log(`Uploading ${scriptName} to Cloudflare...`);
  const uploadRes = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/workers/scripts/${scriptName}`, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': `multipart/form-data; boundary=${boundary}`
    },
    body: body
  });

  const uploadData = await uploadRes.json();
  if (!uploadData.success) {
    throw new Error(`Upload failed: ${JSON.stringify(uploadData)}`);
  }

  console.log(`✓ Worker ${scriptName} successfully deployed!`);
}

deploy().catch(err => {
  console.error(err);
  process.exit(1);
});
