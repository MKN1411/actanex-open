const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { DatabaseSync } = require('node:sqlite');
const ts = require('typescript');
const root = path.resolve(__dirname, '..');
const hash = value => crypto.createHash('sha256').update(value).digest('hex');

function schema() {
  const source = fs.readFileSync(path.join(root, 'src/Worker/src/services/db_bootstrap.service.ts'), 'utf8');
  const ast = ts.createSourceFile('bootstrap.ts', source, ts.ScriptTarget.Latest, true);
  const statements = [];
  function visit(node) {
    if ((ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) &&
        /^\s*(CREATE TABLE|ALTER TABLE)/i.test(node.text)) statements.push(node.text.trim());
    ts.forEachChild(node, visit);
  }
  visit(ast);
  const db = new DatabaseSync(':memory:');
  for (const sql of statements.filter(s => /^CREATE/i.test(s))) db.exec(sql);
  for (const sql of statements.filter(s => /^ALTER/i.test(s))) {
    const match = /^ALTER TABLE (\w+) ADD COLUMN (\w+) /i.exec(sql);
    if (!match) throw new Error(`Unsupported bootstrap DDL: ${sql}`);
    if (!db.prepare(`PRAGMA table_info("${match[1]}")`).all().some(c => c.name === match[2])) db.exec(sql);
  }
  const tables = db.prepare("SELECT name, sql FROM sqlite_master WHERE type='table' ORDER BY name").all().map(table => ({
    ...table, columns: db.prepare(`PRAGMA table_info("${table.name}")`).all()
  }));
  db.close();
  return tables;
}

function files(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? files(path.join(dir, e.name)) : [path.join(dir, e.name)]).sort();
}

function buildRelease() {
  const version = require('../package.json').version;
  const inputs = [...files(path.join(root, 'src/Worker/src')), ...files(path.join(root, 'src/Web')), path.join(root, 'installer/cloudflare-update.ts'), path.join(root,'package.json'), path.join(root,'package-lock.json'), path.join(root,'scripts/build_standalone_bundle.cjs'), path.join(root,'scripts/build-update-release.cjs')];
  const releaseId = hash(inputs.map(p => path.relative(root, p).replaceAll('\\', '/') + '\n' + fs.readFileSync(p, 'utf8').replaceAll('\r\n', '\n')).join('\n'));
  process.env.ACTANEX_RELEASE_ID = releaseId;
  require('./build_standalone_bundle.cjs');
  const bundle = fs.readFileSync(path.join(root, 'src/Worker/bundle/worker.bundle.js'));
  const web = files(path.join(root, 'src/Web')).map(p => ({
    path: '/' + path.relative(path.join(root, 'src/Web'), p).replaceAll('\\', '/'),
    body: Buffer.from(fs.readFileSync(p,'utf8').replaceAll('\r\n','\n').replace(/<span data-app-version>[^<]+<\/span>/g, `<span data-app-version>${version}</span>`)).toString('base64')
  }));
  web.push({path: '/actanex-release.json', body: Buffer.from(JSON.stringify({version, releaseId})).toString('base64')});
  const release = { format: 1, version, releaseId, bundleSha256: hash(bundle), tables: schema(), web,
    changes: ['Update-Test 3.1.1: leere Testspalte app_settings.update_test_marker ergaenzen', 'Bestehende Benutzer, Einstellungen und Secrets bleiben erhalten', 'Worker und Weboberflaeche aus demselben Release'] };
  fs.writeFileSync(path.join(root, 'src/Worker/bundle/update-release.json'), JSON.stringify(release));
  console.log(`Update release ${version}: ${releaseId.slice(0, 12)}, ${release.tables.length} tables`);
  return release;
}
module.exports = { schema, buildRelease };
if (require.main === module) buildRelease();
