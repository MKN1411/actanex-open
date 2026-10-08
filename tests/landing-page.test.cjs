const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

test("Landing Page HTML template existence and structure", () => {
  const htmlPath = path.resolve(__dirname, "../src/Worker/src/templates/landing_page.html");
  assert.ok(fs.existsSync(htmlPath), "landing_page.html must exist");

  const html = fs.readFileSync(htmlPath, "utf8");
  assert.ok(html.includes("<!DOCTYPE html>"), "Must be valid HTML5");
  assert.ok(html.includes("ActaNex"), "Must mention ActaNex");
  assert.ok(html.includes("Freelancer Evidence &amp; Billing Hub") || html.includes("Evidence &amp; Billing Hub"), "Must contain tagline");
  assert.ok(html.includes("GoBD-Verfahrensdokumentation"), "Must contain GoBD trust badge");
  assert.ok(html.includes("Lexware Office Live-Sync"), "Must contain Lexware trust badge");
  assert.ok(html.includes("DATEV EXTF Format 700"), "Must contain DATEV trust badge");
  assert.ok(html.includes("Cloudflare Serverless EU"), "Must contain Cloudflare EU badge");
  assert.ok(html.includes("subdomain-check") || html.includes("check-slug"), "Must contain subdomain check feature");

  // Check 4 packages
  assert.ok(html.includes("ActaNex Free"), "Must contain Free tier");
  assert.ok(html.includes("0,00 €"), "Must contain Free tier price");
  assert.ok(html.includes("Speicherlimit-Hinweis"), "Must contain important Free tier storage limit notice");
  assert.ok(html.includes("SQL DB Blob"), "Must specify SQL DB Blob storage for Free tier");

  assert.ok(html.includes("ActaNex Pro") && html.includes("Self Service"), "Must contain Pro Self Service tier");
  assert.ok(html.includes("2,50 €"), "Must contain Pro Self Service price");
  assert.ok(html.includes("BYOL"), "Must mention BYOL model");

  assert.ok(html.includes("Pro (Managed)") || html.includes("Pro") && html.includes("Vollständig verwaltetes"), "Must contain Pro Managed tier");
  assert.ok(html.includes("5,00 €"), "Must contain Pro Managed price");
  assert.ok(html.includes("Bestseller / Beliebteste Wahl"), "Must contain Bestseller badge");

  assert.ok(html.includes("ActaNex Pro+"), "Must contain Pro+ Managed tier");
  assert.ok(html.includes("8,50 €"), "Must contain Pro+ Managed price");
  assert.ok(html.includes("High Performance"), "Must contain High Performance badge");

  // Comparison table
  assert.ok(html.includes("comparison-table"), "Must contain comparison table");

  // FAQ
  assert.ok(html.includes("Häufige Fragen"), "Must contain FAQ section");
  assert.ok(html.includes("GoBD-Sicherheit"), "Must address GoBD in FAQ");
  assert.ok(html.includes("Server-Standort"), "Must address Server-Standort in FAQ");
  assert.ok(html.includes("Kündbarkeit"), "Must address Kündbarkeit in FAQ");

  // Footer
  assert.ok(html.includes("site-footer"), "Must contain footer");
  assert.ok(html.includes("actanex.app"), "Must mention actanex.app");
});

test("Landing Page TypeScript template rendering", () => {
  const tsPath = path.resolve(__dirname, "../src/Worker/src/templates/landing_page.ts");
  assert.ok(fs.existsSync(tsPath), "landing_page.ts must exist");

  const tsContent = fs.readFileSync(tsPath, "utf8");
  assert.ok(tsContent.includes("export function renderLandingPage"), "Must export renderLandingPage");
});
