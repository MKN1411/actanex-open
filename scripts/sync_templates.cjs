const fs = require('fs');
const path = require('path');

// 1. Sync landing_page.html -> landing_page.ts
const landingHtmlPath = path.resolve(__dirname, '../src/Worker/src/templates/landing_page.html');
const landingTsPath = path.resolve(__dirname, '../src/Worker/src/templates/landing_page.ts');

const landingHtml = fs.readFileSync(landingHtmlPath, 'utf8');
const escapedLanding = landingHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${');
const landingTs = `/**
 * FREELANCER EVIDENCE & BILLING HUB - LANDING PAGE TEMPLATE
 * Domain: actanex.app (or custom edge origin)
 * (c) 2026 ActaNex Open Contributors
 */

export function renderLandingPage(origin = 'https://actanex.app'): string {
  return \`${escapedLanding}\`;
}
`;
fs.writeFileSync(landingTsPath, landingTs, 'utf8');
console.log('✓ landing_page.ts successfully synced with landing_page.html');

// 2. Sync claim_page.html -> claim_page.ts
const claimHtmlPath = path.resolve(__dirname, '../src/Worker/src/templates/claim_page.html');
const claimTsPath = path.resolve(__dirname, '../src/Worker/src/templates/claim_page.ts');

const claimHtml = fs.readFileSync(claimHtmlPath, 'utf8');
// Escape backticks and ${}
let claimTemplate = claimHtml.replace(/`/g, '\\`').replace(/\${/g, '\\${');
// Replace {{SUBDOMAIN}} and {{ORIGIN}} with template expressions
claimTemplate = claimTemplate.replace(/\{\{SUBDOMAIN\}\}/g, '${safeSubdomain}');
claimTemplate = claimTemplate.replace(/\{\{ORIGIN\}\}/g, '${safeOrigin}');

const claimTs = `/**
 * ActaNex Open - Claim & Welcome Page Template Renderer
 * For unprovisioned tenant subdomains (*.open.actanex.app)
 * (c) 2026 ActaNex Open Contributors
 */

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function renderClaimPage(subdomain: string, origin = "https://open.actanex.app"): string {
  const cleanSubdomain = (subdomain || "ihre-firma").trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
  const safeSubdomain = escapeHtml(cleanSubdomain || "ihre-firma");
  const safeOrigin = escapeHtml((origin || \`https://\${safeSubdomain}.open.actanex.app\`).trim());

  return \`${claimTemplate}\`;
}
`;
fs.writeFileSync(claimTsPath, claimTs, 'utf8');
console.log('✓ claim_page.ts successfully synced with claim_page.html');
