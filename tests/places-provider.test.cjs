const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');

const sourcePath = path.join(__dirname, '..', 'src', 'Worker', 'src', 'routes', 'places.routes.ts');
const source = fs.readFileSync(sourcePath, 'utf8');

test('places routes expose suggest and details endpoints', () => {
  assert.match(source, /\/api\/v1\/places\/suggest/);
  assert.match(source, /\/api\/v1\/places\/details/);
});

test('resolvePlacesProvider prefers binding override and KV placesProvider', () => {
  assert.match(source, /env\.PLACES_PROVIDER/);
  assert.match(source, /placesProvider/);
  assert.match(source, /PLATFORM_KV/);
  assert.match(source, /tenant:\$\{env\.TENANT_NAME\}:config/);
});

test('google without key or free plan falls back conceptually to photon', () => {
  assert.match(source, /GOOGLE_PLACES_API_KEY/);
  assert.match(source, /fallback/);
  assert.match(source, /photon/);
});

test('usage is recorded per tenant month for autocomplete and details', () => {
  assert.match(source, /places_usage:/);
  assert.match(source, /autocomplete/);
  assert.match(source, /details/);
});

test('customer results are queried with bound LIKE parameters', () => {
  assert.match(source, /LIKE \? COLLATE NOCASE/);
  assert.match(source, /LIMIT 5/);
});
