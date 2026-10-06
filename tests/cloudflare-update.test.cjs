const {test} = require('node:test');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {CloudflareUpdate,planSchema,sha256} = require('../installer/load-updater.cjs');
const {schema} = require('../scripts/build-update-release.cjs');
const config = {cfAccountId:'a'.repeat(32),cfApiToken:'test-only',workerName:'test-worker',d1DbName:'test-db',r2BucketName:'test-storage',deploymentMode:'standalone',gitHubRepo:'example/app',gitHubBranch:'main'};
const commit = 'b'.repeat(40);
const introspect = db => db.prepare("SELECT m.name AS table_name,p.* FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table'").all();
async function fixture(options={}) {
  const db = new DatabaseSync(':memory:');
  const tables = schema();
  for (const table of tables) db.exec(table.sql);
  db.exec("INSERT INTO users (id,email,password_hash,salt,full_name,role,is_active,created_at_utc) VALUES ('u','real@example.org','preserved-hash','preserved-salt','Existing Admin','Admin',1,'2026-01-01'); INSERT INTO app_settings(id,mileage_rate_business,commute_rate_tier1,commute_rate_tier2,vma_rate_8h,vma_rate_24h,pdf_storage_mode,updated_at_utc) VALUES ('default',0.42,0.3,0.38,14,28,'R2','2026-01-01')");
  db.exec("INSERT INTO customers(id,lexware_contact_id,name,created_at_utc) VALUES ('c','remote-c','Customer','2026-01-01'); INSERT INTO projects(id,customer_id,project_number,name,lexware_service_article_id,approver_email,created_at_utc) VALUES ('p','c','P-1','Project','article','approval@example.org','2026-01-01'); INSERT INTO operational_vouchers(id,voucher_number,voucher_type,voucher_date,supplier_name,description,business_purpose,created_at_utc,updated_at_utc) VALUES ('v','V-1','Expense','2026-01-01','Supplier','Receipt','Work','2026-01-01','2026-01-01')");
  db.exec('ALTER TABLE app_settings DROP COLUMN vehicle_planning_json');
  let settings = {compatibility_date:'2024-12-30',compatibility_flags:['nodejs_compat'],bindings:[{type:'d1',name:'DB',id:'db-uuid'},{type:'r2_bucket',name:'STORAGE',bucket_name:config.r2BucketName},{type:'secret_text',name:'JWT_SECRET'},{type:'secret_text',name:'LEXWARE_API_KEY'},{type:'ai',name:'AI'},{type:'plain_text',name:'CUSTOM_SETTING',text:'keep-me'}]};
  const release = {format:1,version:'3.1.0',releaseId:'c'.repeat(64),bundleSha256:await sha256('new-code'),tables,web:[{path:'/index.html',body:Buffer.from('<html><head></head></html>').toString('base64')},{path:'/actanex-release.json',body:Buffer.from(JSON.stringify({version:'3.1.0',releaseId:'c'.repeat(64)})).toString('base64')}],changes:['Update']};
  const calls=[]; let code='old-code'; let uploaded;
  const ok = result => Response.json({success:true,result});
  const fetcher = async (url,init={})=>{
    const u = new URL(url); const method = init.method || 'GET'; calls.push({path:u.pathname,method,body:init.body});
    if (u.hostname === 'api.github.com') return Response.json({sha:commit});
    if (u.hostname === 'raw.githubusercontent.com') return u.pathname.endsWith('.json') ? Response.json(release) : new Response(options.badBundle ? 'bad-code' : 'new-code');
    if (u.hostname.endsWith('.workers.dev') || u.hostname.endsWith('.pages.dev')) return u.pathname === '/' ? new Response('<div id="login-container"></div>') : Response.json({status:'healthy',version:release.version,releaseId:release.releaseId});
    const p=u.pathname;
    if (options.denied && p.endsWith('/settings')) return Response.json({success:false},{status:403});
    if (p.endsWith('/time_travel/bookmark')) return options.noBookmark ? ok({}) : ok({bookmark:'backup-123'});
    if (p.endsWith('/query')) {
      const {sql,params=[]}=JSON.parse(init.body);
      if(options.failMigration && sql.startsWith('ALTER')) return Response.json({success:true,result:[{success:false,error:'migration failed'}]});
      try {
        if (/^(SELECT|PRAGMA)/.test(sql)) return ok([{success:true,results:db.prepare(sql).all(...params)}]);
        if(params.length) db.prepare(sql).run(...params); else db.exec(sql);
        return ok([{success:true,results:[]}]);
      } catch(error) { return Response.json({success:false,errors:[{message:error.message}]},{status:400}); }
    }
    if (p.endsWith('/settings')) return ok(settings);
    if(p.endsWith('/d1/database/db-uuid')) return ok({name:options.wrongDb?'wrong-db':'test-db',uuid:'db-uuid'});
    if(p.includes('/r2/buckets/')) return options.missingBucket ? Response.json({success:false},{status:404}) : ok({name:'test-storage'});
    if(p.endsWith('/workers/subdomain')) return ok({subdomain:'test-account'});
    if(p.endsWith('/subdomain')) return ok({enabled:true});
    if(p.endsWith('/workers/scripts/test-worker') && method==='GET') return new Response(code);
    if(p.endsWith('/workers/scripts/test-worker') && method==='PUT') {
      uploaded=JSON.parse(await init.body.get('metadata').text());
      settings={...settings,bindings:[...uploaded.bindings,...settings.bindings.filter(b=>b.type==='secret_text')]};code='new-code';return ok({});
    }
    if(p.endsWith('/pages/projects/test-pages')) return ok({name:'test-pages',production_branch:'main',subdomain:'test-pages.pages.dev'});
    if(p.endsWith('/upload-token')) return ok({jwt:'pages-upload-only'});
    if(p.endsWith('/assets/upload')) return ok({});
    if(p.endsWith('/deployments') && method==='POST') return ok({id:'deployment-1'});
    if(p.endsWith('/deployments/deployment-1')) return ok({id:'deployment-1',latest_stage:{name:'deploy',status:options.pagesFailure?'failure':'success'}});
    throw new Error(`Unexpected request ${method} ${url}`);
  };
  const updater=new CloudflareUpdate(fetcher);
  return {db,release,calls,updater,uploaded:()=>uploaded,close:()=>db.close()};
}
test('populated legacy instance: additive migration, preserved users/settings/documents and secrets, repeat update',async t=>{
  const f=await fixture();t.after(f.close);
  const snapshots=['users','customers','projects','operational_vouchers'].map(table=>JSON.stringify(f.db.prepare(`SELECT * FROM ${table}`).all()));
  const p=await f.updater.preflight(config);
  assert.deepEqual(p.migrations,['column:app_settings.vehicle_planning_json']);
  assert.equal(f.calls.some(c=>c.method==='PUT'),false);
  const result=await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert.equal(result.success,true);assert.equal(result.bookmark,'backup-123');
  ['users','customers','projects','operational_vouchers'].forEach((table,i)=>assert.equal(JSON.stringify(f.db.prepare(`SELECT * FROM ${table}`).all()),snapshots[i]));
  assert.equal(f.db.prepare('SELECT mileage_rate_business FROM app_settings').get().mileage_rate_business,0.42);
  assert.deepEqual(f.uploaded().keep_bindings,['secret_text','secret_key']);
  assert(f.uploaded().bindings.some(b=>b.name==='CUSTOM_SETTING'&&b.text==='keep-me'));
  assert(f.uploaded().bindings.some(b=>b.name==='AI'));
  assert(!f.calls.some(c=>c.path.endsWith('/secrets')));
  const p2=await f.updater.preflight(config);assert.deepEqual(p2.migrations,[]);
  assert.equal((await f.updater.execute({...config,targetCommit:p2.targetCommit,planId:p2.planId})).success,true);
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM actanex_migrations').get().n,1);
});
for (const [label,options,pattern] of [
  ['permission error',{denied:true},/Cloudflare/], ['wrong database binding',{wrongDb:true},/D1-Name/], ['missing bucket',{missingBucket:true},/Cloudflare/]
]) test(label+' stops before mutation',async t=>{const f=await fixture(options);t.after(f.close);await assert.rejects(()=>f.updater.preflight(config),pattern);assert(!f.calls.some(c=>c.method==='PUT'));});
for(const [label,options,pattern] of [['checksum',{badBundle:true},/Pruefsumme/],['bookmark',{noBookmark:true},/Wiederherstellungspunkt/],['migration',{failMigration:true},/migration abgebrochen/]]) test(label+' failure stops deployment',async t=>{
  const f=await fixture(options);t.after(f.close);const p=await f.updater.preflight(config);
  await assert.rejects(()=>f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId}),pattern);
  assert.equal(f.uploaded(),undefined);
  assert.equal(f.db.prepare('SELECT password_hash FROM users').get().password_hash,'preserved-hash');
});
test('plan invalidation detects changed schema',async t=>{const f=await fixture();t.after(f.close);const p=await f.updater.preflight(config);f.db.exec('ALTER TABLE customers ADD COLUMN custom_field TEXT');await assert.rejects(()=>f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId}),/Plan hat sich geaendert/);});
test('unknown incompatible schema is rejected',()=>assert.throws(()=>planSchema([{name:'users',sql:'',columns:[{name:'id',type:'TEXT',pk:1}]}],[{table_name:'users',name:'id',type:'INTEGER',pk:1}]),/Unbekanntes Schema/));
test('Pages deployment uses same commit and target Worker API, preserves credentials',async t=>{
  const f=await fixture();t.after(f.close);const c={...config,deploymentMode:'pages',pagesProjectName:'test-pages'};const p=await f.updater.preflight(c);
  const result=await f.updater.execute({...c,targetCommit:p.targetCommit,planId:p.planId});assert.equal(result.pagesDeploymentId,'deployment-1');
  const upload=f.calls.find(c=>c.path.endsWith('/assets/upload'));const assets=JSON.parse(upload.body);
  assert(Buffer.from(assets[0].value,'base64').toString().includes('https://test-worker.test-account.workers.dev/api/v1'));
  assert.equal(f.calls.find(c=>c.path.endsWith('/deployments')&&c.method==='POST').body.get('commit_hash'),commit);
});
test('Pages failure is reported as partial update, releases lock and keeps recovery bookmark',async t=>{
  const f=await fixture({pagesFailure:true});t.after(f.close);const c={...config,deploymentMode:'pages',pagesProjectName:'test-pages'};const p=await f.updater.preflight(c);
  await assert.rejects(()=>f.updater.execute({...c,targetCommit:p.targetCommit,planId:p.planId}),/pages abgebrochen.*backup-123/);
  assert.equal(f.db.prepare('SELECT status FROM actanex_update_runs').get().status,'failed:pages');
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM actanex_update_lock').get().n,0);
});
test('missing optional table is created without touching existing business data',async t=>{
  const f=await fixture();t.after(f.close);f.db.exec('DROP TABLE project_approvers');
  const p=await f.updater.preflight(config);assert(p.migrations.includes('table:project_approvers'));
  await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert(f.db.prepare("SELECT name FROM sqlite_master WHERE name='project_approvers'").get());
});
test('migration checksum tampering prevents a new update',async t=>{
  const f=await fixture();t.after(f.close);const p=await f.updater.preflight(config);
  await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  f.db.exec("UPDATE actanex_migrations SET checksum='changed'");
  await assert.rejects(()=>f.updater.preflight(config),/Migrations-Pruefsumme/);
});
test('an existing update lock prevents deployment',async t=>{
  const f=await fixture();t.after(f.close);const p=await f.updater.preflight(config);
  f.db.exec("CREATE TABLE actanex_update_lock(id INTEGER PRIMARY KEY,run_id TEXT); INSERT INTO actanex_update_lock VALUES(1,'another-run')");
  await assert.rejects(()=>f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId}),/Updatesperre/);
  assert.equal(f.uploaded(),undefined);
});
test('3.1.1 source marker is missing before update and no longer offered afterwards',async t=>{
  const f=await fixture();t.after(f.close);
  f.db.exec("ALTER TABLE app_settings ADD COLUMN vehicle_planning_json TEXT DEFAULT '{}'; ALTER TABLE app_settings DROP COLUMN update_test_marker");
  f.release.version='3.1.1';
  const before=JSON.stringify(f.db.prepare('SELECT * FROM app_settings').all());
  const p=await f.updater.preflight(config);
  assert.equal(p.targetVersion,'3.1.1');
  assert.deepEqual(p.migrations,['column:app_settings.update_test_marker']);
  assert(!f.db.prepare('PRAGMA table_info(app_settings)').all().some(c=>c.name==='update_test_marker'));
  const result=await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert.equal(result.migrations,1);
  const after=f.db.prepare('SELECT * FROM app_settings').all();
  for(const row of after){assert.equal(row.update_test_marker,null);delete row.update_test_marker;}
  assert.equal(JSON.stringify(after),before);
  assert.equal(f.db.prepare("SELECT COUNT(*) AS n FROM actanex_migrations WHERE id='column:app_settings.update_test_marker'").get().n,1);
  const next=await f.updater.preflight(config);
  assert.deepEqual(next.migrations,[]);
});
