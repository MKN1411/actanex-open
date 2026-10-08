const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { buildSync } = require('esbuild');

// 1. Verify claim_page.html exists and contains valid template placeholders
test('claim_page.html exists and contains all required structure and tokens', () => {
  const htmlPath = path.resolve(__dirname, '../src/Worker/src/templates/claim_page.html');
  assert.ok(fs.existsSync(htmlPath), 'claim_page.html file must exist');

  const content = fs.readFileSync(htmlPath, 'utf8');
  assert.ok(content.includes('{{SUBDOMAIN}}'), 'Must contain {{SUBDOMAIN}} placeholder');
  assert.ok(content.includes('{{ORIGIN}}'), 'Must contain {{ORIGIN}} placeholder');
  assert.ok(content.includes('Status: Subdomain verfügbar'), 'Must contain status badge text');
  assert.ok(content.includes('Zeiterfassung & Tätigkeitsnachweise'), 'Must contain time tracking feature');
  assert.ok(content.includes('Reisekosten & Kfz-Vollkosten'), 'Must contain travel expenses feature');
  assert.ok(content.includes('KI-Belegerkennung (Gemini Vision)'), 'Must contain AI vision feature');
  assert.ok(content.includes('Lexware Office & DATEV Export'), 'Must contain Lexware/DATEV feature');
  assert.ok(content.includes('GoBD-Verfahrensdokumentation'), 'Must contain GoBD feature');
  assert.ok(content.includes('ActaNex Free'), 'Must contain ActaNex Free plan');
  assert.ok(content.includes('ActaNex Pro'), 'Must contain ActaNex Pro plan');
  assert.ok(content.includes('ActaNex Pro+'), 'Must contain ActaNex Pro+ plan');
  assert.ok(content.includes('5,00 €'), 'Must contain 5,00 € price for Pro Managed');
  assert.ok(content.includes('2,50 €'), 'Must contain 2,50 € price for Pro Self Service');
  assert.ok(content.includes('8,50 €'), 'Must contain 8,50 € price for Pro+ Managed');
  assert.ok(content.includes('0 €'), 'Must contain 0 € price for Free Community');
});

// 2. Build and execute renderClaimPage from claim_page.ts
test('renderClaimPage returns valid rendered HTML with dynamic subdomain and sanitized inputs', () => {
  const tsPath = path.resolve(__dirname, '../src/Worker/src/templates/claim_page.ts');
  assert.ok(fs.existsSync(tsPath), 'claim_page.ts must exist');

  // Bundle ts to commonjs in-memory using esbuild
  const buildResult = buildSync({
    entryPoints: [tsPath],
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'es2022',
    write: false
  });

  const bundledCode = buildResult.outputFiles[0].text;
  const moduleExports = {};
  const runner = new Function('exports', 'module', bundledCode);
  const moduleObj = { exports: moduleExports };
  runner(moduleExports, moduleObj);

  const { renderClaimPage } = moduleObj.exports;
  assert.equal(typeof renderClaimPage, 'function', 'renderClaimPage must be an exported function');

  // Test standard subdomain
  const htmlOutput = renderClaimPage('kirst-it', 'https://kirst-it.open.actanex.app');
  assert.ok(htmlOutput.includes('kirst-it.open.actanex.app'), 'Subdomain must be rendered into title and headline');
  assert.ok(htmlOutput.includes('🎉 Herzlichen Glückwunsch!'), 'Headline must congratulate user');
  assert.ok(htmlOutput.includes('Status: Subdomain verfügbar'), 'Availability badge must be present');
  assert.ok(htmlOutput.includes('5,00 €'), 'Managed Pro price must be present');
  assert.ok(htmlOutput.includes('Empfohlen'), 'Managed Pro must be highlighted as recommended');
  assert.ok(htmlOutput.includes('Sie sind bereits Kunde von ActaNex'), 'Help section for existing customers must be present');
  assert.ok(htmlOutput.includes('Aktivierungsstatus prüfen'), 'Check status button must be present');
  assert.ok(htmlOutput.includes('Zum Login'), 'Login button must be present');

  // Test XSS prevention
  const maliciousSubdomain = '<script>alert("xss")</script>test-firm';
  const safeOutput = renderClaimPage(maliciousSubdomain);
  assert.ok(!safeOutput.includes('<script>alert("xss")</script>'), 'XSS tags must be removed or escaped');
  assert.ok(safeOutput.includes('test-firm.open.actanex.app'), 'Sanitized alphanumeric slug preserved');
});
