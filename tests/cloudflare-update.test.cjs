const {test} = require('node:test');
const assert = require('node:assert/strict');
const {DatabaseSync} = require('node:sqlite');
const {CloudflareUpdate,planSchema,sha256} = require('../installer/load-updater.cjs');
const {schema} = require('../scripts/build-update-release.cjs');
const config = {cfAccountId:'a'.repeat(32),cfApiToken:'test-only',workerName:'test-worker',d1DbName:'test-db',r2BucketName:'test-storage',deploymentMode:'standalone',gitHubRepo:'example/app',gitHubBranch:'main'};
const commit = 'b'.repeat(40);
test('public Git refs resolve branches and annotated tags when the REST quota is exhausted',async()=>{
  const packet=line=>Buffer.byteLength(line+'0000').toString(16).padStart(4,'0')+line;
  const advertisement=packet('# service=git-upload-pack\n')+'0000'+packet(`${commit} refs/heads/main\0multi_ack\n`)+packet(`${'a'.repeat(40)} refs/tags/v1\n`)+packet(`${commit} refs/tags/v1^{}\n`)+'0000';
  const updater=new CloudflareUpdate(async url=>{
    if(url.startsWith('https://api.github.com/')) return Response.json({message:'rate limit exceeded'},{status:403});
    if(url.startsWith('https://github.com/')) return new Response(advertisement);
    assert(url.includes(`/${commit}/`));
    return Response.json({format:1,releaseId:'c'.repeat(64),tables:[{}],web:[{}]});
  });
  assert.equal((await updater.release({...config,gitHubBranch:'main'})).commit,commit);
  assert.equal((await updater.release({...config,gitHubBranch:'v1'})).commit,commit);
  await assert.rejects(()=>updater.release({...config,gitHubBranch:'missing'}),/nicht gefunden/);
});
test('malformed Git ref advertisements are rejected',async()=>{
  const updater=new CloudflareUpdate(async url=>url.startsWith('https://api.github.com/')?new Response('',{status:429}):new Response('<html>error</html>'));
  await assert.rejects(()=>updater.release(config),/Ungueltige GitHub-Referenzliste/);
});
const introspect = db => db.prepare("SELECT m.name AS table_name,p.* FROM sqlite_master m JOIN pragma_table_info(m.name) p WHERE m.type='table'").all();
async function fixture(options={}) {
  const db = new DatabaseSync(':memory:');
  const vault = new DatabaseSync(':memory:'); let vaultCreated=false; let vaultName='test-worker-backups'; let versions=[{version_id:'old-version',percentage:100}]; let pagesId='previous-pages';
  const snapshots = new Map(); let bookmarkCounter=0;
  const tables = schema();
  for (const table of tables) db.exec(table.sql);
  db.exec("INSERT INTO users (id,email,password_hash,salt,full_name,role,is_active,created_at_utc) VALUES ('u','real@example.org','preserved-hash','preserved-salt','Existing Admin','Admin',1,'2026-01-01'); INSERT INTO app_settings(id,mileage_rate_business,commute_rate_tier1,commute_rate_tier2,vma_rate_8h,vma_rate_24h,pdf_storage_mode,updated_at_utc) VALUES ('default',0.42,0.3,0.38,14,28,'R2','2026-01-01')");
  db.exec("INSERT INTO customers(id,lexware_contact_id,name,created_at_utc) VALUES ('c','remote-c','Customer','2026-01-01'); INSERT INTO projects(id,customer_id,project_number,name,lexware_service_article_id,approver_email,created_at_utc) VALUES ('p','c','P-1','Project','article','approval@example.org','2026-01-01'); INSERT INTO operational_vouchers(id,voucher_number,voucher_type,voucher_date,supplier_name,description,business_purpose,created_at_utc,updated_at_utc) VALUES ('v','V-1','Expense','2026-01-01','Supplier','Receipt','Work','2026-01-01','2026-01-01')");
  db.exec('ALTER TABLE app_settings DROP COLUMN vehicle_planning_json');
  let settings = {compatibility_date:'2024-12-30',compatibility_flags:['nodejs_compat'],bindings:[{type:'d1',name:'DB',id:'db-uuid'},{type:'r2_bucket',name:'STORAGE',bucket_name:config.r2BucketName},{type:'secret_text',name:'JWT_SECRET'},{type:'secret_text',name:'LEXWARE_API_KEY'},{type:'ai',name:'AI'},{type:'plain_text',name:'CUSTOM_SETTING',text:'keep-me'}]};
  if (options.noJwt) settings.bindings=settings.bindings.filter(b=>b.name!=='JWT_SECRET');
  if (options.plainJwt) settings.bindings=settings.bindings.map(b=>b.name==='JWT_SECRET'?{type:'plain_text',name:'JWT_SECRET',text:'test-key-preserved'}:b);
  const release = {format:1,version:'3.1.0',releaseId:'c'.repeat(64),bundleSha256:await sha256('new-code'),tables,web:[{path:'/index.html',body:Buffer.from('<html><head></head></html>').toString('base64')},{path:'/actanex-release.json',body:Buffer.from(JSON.stringify({version:'3.1.0',releaseId:'c'.repeat(64)})).toString('base64')}],changes:['Update']};
  const calls=[]; let code='old-code'; let uploaded;
  const ok = result => Response.json({success:true,result});
  const fetcher = async (url,init={})=>{
    assert.notEqual(init.redirect,'error','Workers do not support redirect:error');
    const u = new URL(url); const method = init.method || 'GET'; calls.push({path:u.pathname,method,body:init.body});
    if (u.hostname === 'api.github.com') return Response.json({sha:commit});
    if (u.hostname === 'raw.githubusercontent.com') return u.pathname.endsWith('.json') ? Response.json(release) : new Response(options.badBundle ? 'bad-code' : 'new-code');
    if (u.hostname === 'export.example.org') return options.exportRedirect ? new Response(null,{status:302,headers:{Location:'https://unexpected.example.org'}}) : new Response(snapshots.get(u.pathname.slice(1)).sql);
    if (u.hostname.endsWith('.workers.dev') || u.hostname.endsWith('.pages.dev')) return u.pathname === '/' ? new Response('<div id="login-container"></div>') : Response.json({status:'healthy',version:release.version,releaseId:release.releaseId});
    const p=u.pathname;
    if(p.endsWith('/workers/scripts')) return options.noWorkers?ok([]):ok([{id:'test-worker'}]);
    if (options.denied && p.endsWith('/settings')) return Response.json({success:false},{status:403});
    if (p.endsWith('/time_travel/bookmark')) return options.noBookmark ? ok({}) : ok({bookmark:'backup-123'});
    if (p.endsWith('/time_travel/restore')) {
      if(options.restoreFailure) return Response.json({success:false,errors:[{message:'restore denied'}]},{status:400});
      const snapshot=snapshots.get(u.searchParams.get('bookmark'));
      db.exec('PRAGMA foreign_keys=OFF');
      for(const table of db.prepare("SELECT name FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) db.exec(`DROP TABLE "${table.name}"`);
      db.exec(snapshot.sql);return ok({bookmark:u.searchParams.get('bookmark'),previous_bookmark:'undo-bookmark'});
    }
    if (p.endsWith('/export')) {
      if(options.exportFailure) return ok({status:'error'});
      const bookmark=`snapshot-${++bookmarkCounter}`;
      let sql='PRAGMA foreign_keys=OFF;\n';
      const value=v=>v===null?'NULL':typeof v==='number'?String(v):`'${String(v).replaceAll("'","''")}'`;
      for(const table of db.prepare("SELECT name,sql FROM sqlite_schema WHERE type='table' AND name NOT LIKE 'sqlite_%'").all()) {
        sql+=table.sql+';\n';
        for(const row of db.prepare(`SELECT * FROM "${table.name}"`).all()) sql+=`INSERT INTO "${table.name}" VALUES (${Object.values(row).map(value).join(',')});\n`;
      }
      if(options.largeDump) sql+='-- '+('Unicode-Test \u00e4'.repeat(20000))+'\n';
      snapshots.set(bookmark,{sql});return ok({status:'complete',at_bookmark:bookmark,result:{signed_url:`https://export.example.org/${bookmark}`}});
    }
    if(p.endsWith('/d1/database')) {
      if(method==='POST') {vaultCreated=true;return ok({name:vaultName,uuid:'vault-uuid',jurisdiction:options.jurisdiction});}
      return ok(vaultCreated?[{name:vaultName,uuid:'vault-uuid',jurisdiction:options.jurisdiction}]:[]);
    }
    if(p.endsWith('/workers/scripts/test-worker/deployments')) {
      if(method==='POST') {versions=JSON.parse(init.body).versions;return ok({id:'restored-worker'});}
      return ok({deployments:[{id:'active-worker',versions}]});
    }
    if(p.includes('/versions/')) return options.missingVersion ? Response.json({success:false},{status:404}) : ok({id:p.split('/').pop()});
    if (p.endsWith('/query')) {
      const target=p.includes('/vault-uuid/')?vault:db;
      const {sql,params=[]}=JSON.parse(init.body);
      if (/pragma_table_info\(/i.test(sql)) return Response.json({success:false,errors:[{code:7500,message:'not authorized'}]},{status:400});
      if(options.failMigration && sql.startsWith('ALTER')) return Response.json({success:true,result:[{success:false,error:'migration failed'}]});
      try {
        if (sql.startsWith('PRAGMA table_info')) return ok([...sql.matchAll(/PRAGMA table_info\("((?:[^"]|"")*)"\)/g)].map(match=>({success:true,results:target.prepare(`PRAGMA table_info("${match[1]}")`).all()})));
        if (/^(SELECT|PRAGMA)/.test(sql)) return ok([{success:true,results:target.prepare(sql).all(...params)}]);
        if(params.length) target.prepare(sql).run(...params); else target.exec(sql);
        return ok([{success:true,results:[]}]);
      } catch(error) { return Response.json({success:false,errors:[{message:error.message}]},{status:400}); }
    }
    if (p.endsWith('/settings')) return ok(settings);
    if(p.endsWith('/d1/database/db-uuid')) return ok({name:options.wrongDb?'wrong-db':'test-db',uuid:'db-uuid',jurisdiction:options.jurisdiction});
    if(p.includes('/r2/buckets/')) return options.missingBucket ? Response.json({success:false},{status:404}) : ok({name:'test-storage'});
    if(p.endsWith('/workers/subdomain')) return ok({subdomain:'test-account'});
    if(p.endsWith('/subdomain')) return ok({enabled:true});
    if(p.endsWith('/workers/scripts/test-worker') && method==='GET') return new Response(options.discoveryCode || code);
    if(p.endsWith('/workers/scripts/test-worker') && method==='PUT') {
      uploaded=JSON.parse(await init.body.get('metadata').text());
      settings={...settings,bindings:[...uploaded.bindings,...settings.bindings.filter(b=>b.type==='secret_text')]};code='new-code';versions=[{version_id:'new-version',percentage:100}];return ok({});
    }
    if(p.endsWith('/pages/projects/test-pages')) return ok({name:'test-pages',production_branch:'main',subdomain:'test-pages.pages.dev',canonical_deployment:{id:pagesId,environment:'production',latest_stage:{name:'deploy',status:'success'}}});
    if(p.endsWith('/upload-token')) return ok({jwt:'pages-upload-only'});
    if(p.endsWith('/assets/upload')) return ok({});
    if(p.endsWith('/deployments') && method==='POST') {pagesId='deployment-1';return ok({id:'deployment-1'});}
    if(p.endsWith('/deployments/previous-pages')) return ok({id:'previous-pages',environment:'production',latest_stage:{name:'deploy',status:'success'}});
    if(p.endsWith('/deployments/previous-pages/rollback')) {pagesId='previous-pages';return ok({id:pagesId});}
    if(p.endsWith('/deployments/deployment-1')) return ok({id:'deployment-1',latest_stage:{name:'deploy',status:options.pagesFailure?'failure':'success'}});
    throw new Error(`Unexpected request ${method} ${url}`);
  };
  const updater=new CloudflareUpdate(fetcher);
  return {db,vault,release,calls,updater,renameVault:name=>{vaultName=name;},uploaded:()=>uploaded,close:()=>{db.close();vault.close();}};
}
test('populated legacy instance: additive migration, preserved users/settings/documents and secrets, repeat update',async t=>{
  const f=await fixture();t.after(f.close);
  const snapshots=['users','customers','projects','operational_vouchers'].map(table=>JSON.stringify(f.db.prepare(`SELECT * FROM ${table}`).all()));
  const p=await f.updater.preflight(config);
  assert.deepEqual(p.migrations,['column:app_settings.vehicle_planning_json']);
  assert.equal(f.calls.some(c=>c.method==='PUT'),false);
  const result=await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert.equal(result.success,true);assert.match(result.bookmark,/snapshot-/);assert(result.backupId);
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
  await assert.rejects(()=>f.updater.execute({...c,targetCommit:p.targetCommit,planId:p.planId}),/pages abgebrochen.*snapshot-/);
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
test('instance without JWT_SECRET updates with existing login session preserved',async t=>{
  const f=await fixture({noJwt:true});t.after(f.close);
  f.db.prepare('INSERT INTO user_sessions(token,user_id,expires_at_utc,created_at_utc) VALUES (?,?,?,?)').run('existing-session','u','2030-01-01','2026-01-01');
  const before=JSON.stringify(f.db.prepare('SELECT * FROM user_sessions').all());
  const p=await f.updater.preflight(config);
  assert.equal((await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId})).success,true);
  assert.equal(JSON.stringify(f.db.prepare('SELECT * FROM user_sessions').all()),before);
  assert(!f.uploaded().bindings.some(b=>b.name==='JWT_SECRET'));
  assert(!f.calls.some(c=>c.path.endsWith('/secrets')));
});
test('JWT_SECRET stored as a plain-text binding is preserved without replacement',async t=>{
  const f=await fixture({plainJwt:true});t.after(f.close);const p=await f.updater.preflight(config);
  await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert(f.uploaded().bindings.some(b=>b.name==='JWT_SECRET'&&b.type==='plain_text'&&b.text==='test-key-preserved'));
});

test('full SQL and Worker snapshot is stored independently in Cloudflare and verified on download',async t=>{
  const f=await fixture();t.after(f.close);
  const result=await f.updater.dispatch('backup-create',config);
  const list=await f.updater.dispatch('backup-list',config);assert.equal(list.backups[0].id,result.backupId);
  assert.equal(list.backups[0].version,'Altinstallation');assert.deepEqual(list.backups[0].workerVersionIds,['old-version']);
  const backup=await f.updater.dispatch('backup-download',{...config,backupId:result.backupId});
  assert(backup.sql.includes('preserved-hash'));assert(backup.sql.includes('Customer'));
  assert.equal(backup.workerCode,'old-code');assert(!JSON.stringify(backup.manifest).includes(config.cfApiToken));
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM actanex_update_lock').get().n,0);
  const copy=new DatabaseSync(':memory:');t.after(()=>copy.close());copy.exec(backup.sql);
  assert.equal(copy.prepare('SELECT password_hash FROM users').get().password_hash,'preserved-hash');
});

test('post-update backup records installed version and exact release, without relabeling older backups',async t=>{
  const f=await fixture();t.after(f.close);const p=await f.updater.preflight(config);
  const updated=await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  const current=await f.updater.dispatch('backup-create',config);
  const listed=await f.updater.dispatch('backup-list',config);
  const old=listed.backups.find(b=>b.id===updated.backupId);const recent=listed.backups.find(b=>b.id===current.backupId);
  assert.equal(old.version,'Altinstallation');assert.equal(old.releaseId,null);
  assert.equal(recent.version,f.release.version);assert.equal(recent.releaseId,f.release.releaseId);
  assert.deepEqual(recent.workerVersionIds,['new-version']);
  const download=await f.updater.dispatch('backup-download',{...config,backupId:current.backupId});
  assert.equal(download.manifest.releaseId,f.release.releaseId);
});

test('SQL export redirects are rejected before deployment',async t=>{
  const f=await fixture({exportRedirect:true});t.after(f.close);
  const plan=await f.updater.preflight(config);
  await assert.rejects(()=>f.updater.execute({...config,targetCommit:plan.targetCommit,planId:plan.planId}),/SQL-Export nicht erreichbar/);
  assert.equal(f.uploaded(),undefined);
  assert(!f.calls.some(call=>call.path.includes('unexpected.example.org')));
});

test('failed SQL export blocks migration and deployment, leaves business data and releases lock',async t=>{
  const f=await fixture({exportFailure:true});t.after(f.close);const p=await f.updater.preflight(config);
  await assert.rejects(()=>f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId}),/backup abgebrochen/);
  assert(!f.db.prepare('PRAGMA table_info(app_settings)').all().some(c=>c.name==='vehicle_planning_json'));
  assert.equal(f.uploaded(),undefined);assert.equal(f.db.prepare('SELECT count(*) AS n FROM actanex_update_lock').get().n,0);
});

test('full rollback restores database, Worker and Pages and saves current state for undo',async t=>{
  const f=await fixture();t.after(f.close);const c={...config,deploymentMode:'pages',pagesProjectName:'test-pages'};
  const p=await f.updater.preflight(c);const update=await f.updater.execute({...c,targetCommit:p.targetCommit,planId:p.planId});
  f.db.exec("UPDATE customers SET name='Changed after update'");
  const restore={...c,backupId:update.backupId,restoreDatabase:true};
  const plan=await f.updater.dispatch('restore-plan',restore);
  assert(!f.calls.some(call=>call.path.endsWith('/time_travel/restore')));
  await assert.rejects(()=>f.updater.dispatch('restore',{...restore,restorePlanId:plan.restorePlanId}),/bestaetigen/);
  const result=await f.updater.dispatch('restore',{...restore,restorePlanId:plan.restorePlanId,confirmRestore:true});
  assert.equal(result.status,'restored');assert(result.safetyBackupId);
  assert.equal(f.db.prepare('SELECT name FROM customers').get().name,'Customer');
  assert(!f.db.prepare('PRAGMA table_info(app_settings)').all().some(c=>c.name==='vehicle_planning_json'));
  assert.equal(f.db.prepare('SELECT count(*) AS n FROM actanex_update_lock').get().n,0);
  assert(f.calls.some(call=>call.path.endsWith('/previous-pages/rollback')));
  const undo=await f.updater.dispatch('backup-download',{...c,backupId:result.safetyBackupId});
  assert(undo.sql.includes('Changed after update'));
});

test('tampered snapshot blocks rollback without changing target',async t=>{
  const f=await fixture();t.after(f.close);const backup=await f.updater.dispatch('backup-create',config);
  f.vault.exec("UPDATE snapshot_parts SET body='corrupted' WHERE kind='sql'");
  await assert.rejects(()=>f.updater.dispatch('restore-plan',{...config,backupId:backup.backupId,restoreDatabase:true}),/Pruefsumme/);
  assert(!f.calls.some(call=>call.path.endsWith('/time_travel/restore')));
});

test('code-only rollback preserves newer data',async t=>{
  const f=await fixture();t.after(f.close);const p=await f.updater.preflight(config);
  const update=await f.updater.execute({...config,targetCommit:p.targetCommit,planId:p.planId});
  f.db.exec("UPDATE customers SET name='Keep newer data'");
  const c={...config,backupId:update.backupId,restoreDatabase:false};const plan=await f.updater.dispatch('restore-plan',c);
  await f.updater.dispatch('restore',{...c,restorePlanId:plan.restorePlanId,confirmRestore:true});
  assert.equal(f.db.prepare('SELECT name FROM customers').get().name,'Keep newer data');
  assert(!f.calls.some(call=>call.path.endsWith('/time_travel/restore')));
});

test('missing native version and mismatched resources prevent restoration',async t=>{
  const f=await fixture({missingVersion:true});t.after(f.close);const backup=await f.updater.dispatch('backup-create',config);
  await assert.rejects(()=>f.updater.dispatch('restore-plan',{...config,backupId:backup.backupId}),/Cloudflare/);
  await assert.rejects(()=>f.updater.dispatch('backup-download',{...config,d1DbName:'other-db',backupId:backup.backupId}),/Ressourcen/);
});

test('partial restore failure retains safety snapshot and records failed stage',async t=>{
  const f=await fixture({restoreFailure:true});t.after(f.close);const backup=await f.updater.dispatch('backup-create',config);
  const c={...config,backupId:backup.backupId,restoreDatabase:true};const plan=await f.updater.dispatch('restore-plan',c);
  await assert.rejects(()=>f.updater.dispatch('restore',{...c,restorePlanId:plan.restorePlanId,confirmRestore:true}),/database gestoppt.*Sicherheitskopie/);
  const run=f.vault.prepare('SELECT * FROM recovery_runs').get();assert.equal(run.status,'failed:database');assert(run.safety_id);
  assert.equal(f.vault.prepare('SELECT count(*) AS n FROM recovery_lock').get().n,0);
});

test('chunked Unicode SQL dump roundtrips and backup database preserves EU jurisdiction',async t=>{
  const f=await fixture({largeDump:true,jurisdiction:'eu'});t.after(f.close);
  const result=await f.updater.dispatch('backup-create',config);
  const backup=await f.updater.dispatch('backup-download',{...config,backupId:result.backupId});
  assert(backup.sql.endsWith(('Unicode-Test \u00e4'.repeat(20000))+'\n'));
  assert(backup.manifest.sql.parts>8);
  const creation=f.calls.find(c=>c.path.endsWith('/d1/database')&&c.method==='POST');
  assert.equal(JSON.parse(creation.body).jurisdiction,'eu');
});

for(const options of [{},{exportFailure:true},{failMigration:true}]) test(`update stream reports verified backup independently of deployment: ${JSON.stringify(options)}`,async t=>{
  const f=await fixture(options);t.after(f.close);const p=await f.updater.preflight(config);
  const response=f.updater.stream({...config,targetCommit:p.targetCommit,planId:p.planId});
  assert(response.headers.get('content-type').includes('application/x-ndjson'));
  const events=(await response.text()).trim().split('\n').map(JSON.parse);
  assert(!JSON.stringify(events).includes(config.cfApiToken));
  const verified=events.find(e=>e.backupStatus==='verified');
  const result=events.at(-1);
  if(options.exportFailure) {assert(!verified);assert.equal(result.type,'error');assert.equal(result.backupStatus,'failed');assert.equal(f.uploaded(),undefined);}
  else {assert(verified.backupId);assert.equal(result.type,options.failMigration?'error':'result');if(options.failMigration) assert.equal(result.backupStatus,'verified');}
});

test('discovery recognizes legacy ActaNex from embedded frontend, schema and real bindings without writes',async t=>{
  const f=await fixture({discoveryCode:'/* ActaNex */ const __EMBEDDED_ASSETS = {index:"login-container"}'});t.after(f.close);
  const result=await f.updater.dispatch('discover',{cfAccountId:config.cfAccountId,cfApiToken:config.cfApiToken});
  assert.equal(result.instances.length,1);assert.equal(result.instances[0].workerName,'test-worker');
  assert.equal(result.instances[0].d1DbName,'test-db');assert.equal(result.instances[0].r2BucketName,'test-storage');
  assert.equal(result.instances[0].version,null);assert.deepEqual(result.warnings,[]);
  assert(!f.calls.some(c=>c.method==='PUT' || c.path.endsWith('/export')));
  for(const call of f.calls.filter(c=>c.path.endsWith('/query'))) assert.match(JSON.parse(call.body).sql,/^(SELECT|PRAGMA)/);
});

test('discovery ignores foreign code and rejects incomplete resources rather than offering update',async t=>{
  const foreign=await fixture();t.after(foreign.close);assert.equal((await foreign.updater.discover(config)).instances.length,0);
  const incomplete=await fixture({discoveryCode:'/* ActaNex */ const __EMBEDDED_ASSETS = {index:"login-container"}',missingBucket:true});t.after(incomplete.close);
  const result=await incomplete.updater.discover(config);assert.equal(result.instances.length,0);assert(result.warnings.length);
  const apiOnly=await fixture({discoveryCode:'ActaNex __EMBEDDED_ASSETS login-container'});t.after(apiOnly.close);
  assert.equal((await apiOnly.updater.discover(config)).instances.length,0);
  const wrongSchema=await fixture({discoveryCode:'/* ActaNex */ const __EMBEDDED_ASSETS = {index:"login-container"}'});t.after(wrongSchema.close);
  wrongSchema.db.exec('DROP TABLE user_sessions');assert.equal((await wrongSchema.updater.discover(config)).instances.length,0);
});

test('discovery handles empty accounts and reports permission failure',async t=>{
  const empty=await fixture({noWorkers:true});t.after(empty.close);assert.deepEqual((await empty.updater.discover(config)).instances,[]);
  const denied=await fixture({denied:true});t.after(denied.close);const result=await denied.updater.discover(config);
  assert.equal(result.instances.length,0);assert(result.warnings.length);
  assert(!JSON.stringify(result).includes(config.cfApiToken));
});

test('validated existing backup database can be shared without creating another database',async t=>{
  const f=await fixture();t.after(f.close);const first=await f.updater.dispatch('backup-create',config);
  f.renameVault('actanex-existing-worker-backups');
  const creates=f.calls.filter(c=>c.path.endsWith('/d1/database') && c.method==='POST').length;
  const result=await f.updater.dispatch('backup-create',config);
  assert.equal(result.backupDatabase,'actanex-existing-worker-backups');
  assert.equal(f.calls.filter(c=>c.path.endsWith('/d1/database') && c.method==='POST').length,creates);
  assert.equal((await f.updater.dispatch('backup-list',config)).backups.length,2);
  assert.equal((await f.updater.dispatch('backup-download',{...config,backupId:first.backupId})).workerCode,'old-code');
});
