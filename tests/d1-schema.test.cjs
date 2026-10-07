const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Miniflare}=require('../src/Worker/node_modules/miniflare');
const {CloudflareUpdate}=require('../installer/load-updater.cjs');
test('schema discovery runs against the D1 runtime without table-valued PRAGMA functions',async()=>{
  const mf=new Miniflare({modules:true,script:'export default {fetch(){return new Response("ok")}}',d1Databases:{DB:'schema-test'}});
  try {
    const db=await mf.getD1Database('DB');
    await db.exec('CREATE TABLE users(id TEXT PRIMARY KEY,email TEXT); CREATE TABLE app_settings(id TEXT PRIMARY KEY,update_test_marker TEXT)');
    const updater=new CloudflareUpdate();
    updater.query=async(_config,_id,sql)=>{
      if(sql.startsWith('PRAGMA')) return db.batch([...sql.matchAll(/PRAGMA table_info\("((?:[^"]|"")*)"\)/g)].map(match=>db.prepare(match[0])));
      return [await db.prepare(sql).all()];
    };
    const columns=await updater.readSchema({},'schema-test');
    assert(columns.some(c=>c.table_name==='users'&&c.name==='email'&&c.type==='TEXT'));
    assert(columns.some(c=>c.table_name==='app_settings'&&c.name==='update_test_marker'));
    assert(!columns.some(c=>c.table_name.startsWith('_cf_')));
  } finally {await mf.dispose();}
});
test('Cloudflare errors retain the reason and redact credentials',async()=>{
  const updater=new CloudflareUpdate(async()=>Response.json({success:false,errors:[{code:7500,message:'not authorized; token test-token'}]},{status:400}));
  await assert.rejects(()=>updater.cf({cfApiToken:'test-token'},'/test'),error=>error.message.includes('[7500] not authorized')&&!error.message.includes('test-token'));
});
