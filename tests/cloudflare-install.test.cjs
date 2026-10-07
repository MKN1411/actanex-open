const {test}=require('node:test');
const assert=require('node:assert/strict');
const {DatabaseSync}=require('node:sqlite');
const {installCloudflare}=require('../installer/load-installer.cjs');
const {CloudflareUpdate,sha256}=require('../installer/load-updater.cjs');
const {schema}=require('../scripts/build-update-release.cjs');
const config={cfAccountId:'a'.repeat(32),cfApiToken:'test-token',workerName:'test-worker',d1DbName:'test-db',r2BucketName:'test-bucket',fileStorageMode:'D1',adminEmail:'new@example.org',adminPassword:'test-password',adminFullName:"O'Reilly",gitHubRepo:'example/app',gitHubBranch:'main'};
async function fixture(options={}) {
  const db=new DatabaseSync(':memory:');const calls=[];let metadata;
  const bundle='install-code';const release={format:1,version:'3.3.0',releaseId:'c'.repeat(64),bundleSha256:await sha256(bundle),tables:schema(),web:[{}]};
  const ok=result=>Response.json({success:true,result});
  const api=new CloudflareUpdate(async(url,init={})=>{
    const u=new URL(url);const method=init.method || 'GET';calls.push({path:u.pathname,method});
    if(u.hostname==='api.github.com') return Response.json({sha:'b'.repeat(40)});
    if(u.hostname==='raw.githubusercontent.com') return u.pathname.endsWith('.json')?Response.json(release):new Response(options.badBundle?'corrupt':bundle);
    if(u.hostname.endsWith('.workers.dev')) return Response.json({status:'healthy',version:release.version,releaseId:release.releaseId});
    if(u.pathname.endsWith('/workers/scripts')) return ok(options.existing?[{id:config.workerName}]:[]);
    if(u.pathname.endsWith('/d1/database')) return ok(method==='POST'?{uuid:'new-db'}:[]);
    if(u.pathname.endsWith('/r2/buckets')) return options.noR2?Response.json({success:false},{status:403}):ok({buckets:[]});
    if(u.pathname.endsWith('/query')) {
      const body=JSON.parse(init.body);if(body.params.length) db.prepare(body.sql).run(...body.params);else db.exec(body.sql);
      return ok([{success:true,results:[]}]);
    }
    if(u.pathname.endsWith('/workers/subdomain')) return ok({subdomain:'test-account'});
    if(u.pathname.endsWith('/workers/scripts/test-worker') && method==='PUT') {metadata=JSON.parse(await init.body.get('metadata').text());return ok({});}
    if(u.pathname.endsWith('/subdomain') || u.pathname.includes('/r2/buckets/')) return ok({});
    throw new Error(`Unexpected request ${method} ${u.pathname}`);
  });
  return {api,db,calls,metadata:()=>metadata,close:()=>db.close()};
}
for(const mode of ['D1','R2']) test(`shared installer provisions ${mode} and verifies an immutable release`,async t=>{
  const f=await fixture();t.after(f.close);
  const result=await installCloudflare({...config,fileStorageMode:mode},f.api);
  assert(result.success);assert.equal(result.fileStorageMode,mode);
  assert.equal(f.db.prepare('SELECT full_name FROM users').get().full_name,"O'Reilly");
  assert(f.db.prepare("SELECT name FROM sqlite_schema WHERE name='stored_document_parts'").get());
  assert(f.metadata().bindings.some(b=>b.name==='FILE_STORAGE_MODE' && b.text===mode));
  assert(f.metadata().compatibility_flags.includes('global_fetch_strictly_public'));
  assert.equal(f.metadata().bindings.some(b=>b.type==='r2_bucket'),mode==='R2');
  assert.equal(f.calls.some(c=>c.path.includes('/r2/')),mode==='R2');
  assert(f.calls.length<50);
});
for(const option of ['noR2','badBundle','existing']) test(`installer ${option} blocks before resource mutation`,async t=>{
  const f=await fixture({[option]:true});t.after(f.close);
  await assert.rejects(()=>installCloudflare({...config,fileStorageMode:'R2'},f.api));
  assert(!f.calls.some(c=>c.method==='POST' || c.method==='PUT'));
});
