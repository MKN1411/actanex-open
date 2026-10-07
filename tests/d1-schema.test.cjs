const {test}=require('node:test');
const assert=require('node:assert/strict');
const {Miniflare,createFetchMock}=require('../src/Worker/node_modules/miniflare');
const {CloudflareUpdate}=require('../installer/load-updater.cjs');
const {buildSync}=require('esbuild');

test('central document store roundtrips binary chunks on D1 and detects corruption',async()=>{
  const code=buildSync({stdin:{resolveDir:process.cwd(),contents:`import {documentStorage} from './src/Worker/src/services/document_storage.service';
export default {async fetch(request,env) {
 const store=documentStorage({...env,FILE_STORAGE_MODE:'D1'});
 const bytes=new Uint8Array(1100000);for(let i=0;i<bytes.length;i++)bytes[i]=i%256;
 const key=await store.put('original.pdf',bytes,{httpMetadata:{contentType:'application/pdf'}});
 const object=await store.get(key);const result=new Uint8Array(await object.arrayBuffer());
 const headers=new Headers();object.writeHttpMetadata(headers);
 await env.DB.prepare('UPDATE stored_document_parts SET body=? WHERE storage_key=? AND part=0').bind(new Uint8Array(512*1024).buffer,key).run();
 let rejected=false;try {await store.get(key);}catch {rejected=true;}
 let missingStorageRejected=false;try {await documentStorage({DB:env.DB}).put('r2.pdf',bytes);}catch {missingStorageRejected=true;}
 const legacy=await documentStorage({...env,FILE_STORAGE_MODE:'D1',STORAGE:{get:async()=>({legacy:true})}}).get('receipts/legacy.pdf');
 return Response.json({key,matches:result.every((v,i)=>v===bytes[i])&&result.length===bytes.length,type:headers.get('Content-Type'),rejected,missingStorageRejected,legacy:legacy.legacy});
}}`},bundle:true,format:'esm',platform:'neutral',target:'es2022',write:false}).outputFiles[0].text;
  const mf=new Miniflare({modules:true,compatibilityDate:'2024-12-30',script:code,d1Databases:{DB:'document-test'}});
  try {
    const response=await mf.dispatchFetch('https://test.example');
    const result=await response.json();
    assert.equal(response.status,200,JSON.stringify(result));assert(result.key.startsWith('d1/'));
    assert.equal(result.matches,true);assert.equal(result.type,'application/pdf');assert.equal(result.rejected,true);
    assert.equal(result.missingStorageRejected,true);assert.equal(result.legacy,true);
  } finally {await mf.dispose();}
});
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

test('default fetch keeps the Workers runtime receiver during live-style discovery',async()=>{
  const account='a'.repeat(32);
  const code=buildSync({stdin:{resolveDir:process.cwd(),contents:`import {CloudflareUpdate} from './installer/cloudflare-update';
export default {async fetch() {try {return Response.json(await new CloudflareUpdate().discover({cfAccountId:'${account}',cfApiToken:'runtime-test-token'}));} catch(e) {return Response.json({error:e.message},{status:500});}}}`},bundle:true,format:'esm',platform:'neutral',target:'es2022',write:false}).outputFiles[0].text;
  const mock=createFetchMock();mock.disableNetConnect();
  const mf=new Miniflare({fetchMock:mock,modules:true,compatibilityDate:'2024-12-30',script:code});
  try {
    mock.get('https://api.cloudflare.com').intercept({path:`/client/v4/accounts/${account}/workers/scripts`,method:'GET'}).reply(200,JSON.stringify({success:true,result:[]}),{headers:{'Content-Type':'application/json'}});
    const response=await mf.dispatchFetch('https://test.example/discover');
    const body=await response.json();assert.equal(response.status,200,JSON.stringify(body));assert.equal(body.success,true);assert.deepEqual(body.instances,[]);
    mock.assertNoPendingInterceptors();
  } finally {await mf.dispose();}
});
