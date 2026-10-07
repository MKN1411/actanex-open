import { CloudflareUpdate, Config, sha256 } from './cloudflare-update';
import { hashPassword } from '../src/Worker/src/utils/crypto';

export type InstallConfig = Config & {adminEmail:string;adminPassword:string;adminFullName?:string;jwtSecret?:string;lexwareApiKey?:string;resendApiKey?:string;operation?:string;allowOverwrite?:boolean};

export async function installCloudflare(c: InstallConfig, api = new CloudflareUpdate()) {
  if(c.operation==='update' || c.allowOverwrite) throw new Error('Bestehende Instanzen ausschliesslich ueber den Update-Ablauf aktualisieren.');
  const mode=c.fileStorageMode || 'R2';
  const config={...c,fileStorageMode:mode,r2BucketName:mode==='D1'?'':c.r2BucketName,deploymentMode:'standalone'};
  api.validate(config);
  if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(c.adminEmail || '') || (c.adminPassword || '').length<8) throw new Error('Gueltige Admin-E-Mail und mindestens 8 Zeichen Passwort erforderlich.');
  const root=`/accounts/${c.cfAccountId}`;
  const workers=await api.cf(c,`${root}/workers/scripts`);
  const databases=await api.cf(c,`${root}/d1/database?per_page=10000`);
  if(!Array.isArray(workers) || !Array.isArray(databases)) throw new Error('Ressourcenpruefung unvollstaendig.');
  if(workers.some((w: any)=>(w.id || w.name)===c.workerName) || databases.some((d: any)=>d.name===c.d1DbName)) throw new Error('Instanz existiert bereits. Bitte Update verwenden oder neue Namen waehlen.');
  if(mode==='R2') {
    let buckets;
    try {buckets=await api.cf(c,`${root}/r2/buckets`);} catch {throw new Error('R2 erfordert eine aktive Cloudflare-R2-Subscription mit Zahlungsmethode und R2-Berechtigung. Alternativ D1-Dateispeicher waehlen.');}
    if(!Array.isArray(buckets.buckets)) throw new Error('R2-Ressourcenpruefung unvollstaendig.');
    if(buckets.buckets.some((b: any)=>b.name===c.r2BucketName)) throw new Error('R2-Bucket existiert bereits. Update verwenden oder neuen Namen waehlen.');
  }
  const target=await api.release(c);
  const bundleResponse=await api.fetcher(`${target.base}/worker.bundle.js`,{signal:AbortSignal.timeout(60000)});
  if(!bundleResponse.ok) throw new Error('Installationspaket nicht erreichbar.');
  const bundle=await bundleResponse.text();
  if(await sha256(bundle)!==target.release.bundleSha256) throw new Error('Installationspaket-Pruefsumme stimmt nicht.');
  const subdomain=await api.cf(c,`${root}/workers/subdomain`);
  if(!subdomain.subdomain) throw new Error('Cloudflare workers.dev Subdomain zuerst einrichten.');
  const database=await api.cf(c,`${root}/d1/database`,'POST',{name:c.d1DbName});
  const id=database.uuid || database.id;
  if(!id) throw new Error('Neue D1-Datenbank ohne ID.');
  if(mode==='R2') await api.cf(c,`${root}/r2/buckets/${c.r2BucketName}`,'PUT');
  await api.query(c,id,target.release.tables.map(table=>table.sql).join(';\n'));
  const salt=Array.from(crypto.getRandomValues(new Uint8Array(16)),n=>n.toString(16).padStart(2,'0')).join('');
  const hash=await hashPassword(c.adminPassword,salt);
  await api.query(c,id,'INSERT INTO users(id,email,password_hash,salt,full_name,role,is_active,created_at_utc) VALUES (?,?,?,?,?,?,?,?)',
    [crypto.randomUUID(),c.adminEmail.trim().toLowerCase(),hash,salt,c.adminFullName || 'Administrator','Admin',1,new Date().toISOString()]);
  const bindings:any[]=[{type:'d1',name:'DB',id},{type:'plain_text',name:'FILE_STORAGE_MODE',text:mode},
    {type:'plain_text',name:'APP_VERSION',text:target.release.version},{type:'plain_text',name:'ACTANEX_RELEASE_ID',text:target.release.releaseId},
    {type:'plain_text',name:'ACTANEX_MANAGED_SCHEMA',text:'1'},
    {type:'secret_text',name:'JWT_SECRET',text:c.jwtSecret || crypto.randomUUID()+crypto.randomUUID()}];
  if(mode==='R2') bindings.push({type:'r2_bucket',name:'STORAGE',bucket_name:c.r2BucketName});
  if(c.lexwareApiKey) bindings.push({type:'secret_text',name:'LEXWARE_API_KEY',text:c.lexwareApiKey});
  if(c.resendApiKey) bindings.push({type:'secret_text',name:'RESEND_API_KEY',text:c.resendApiKey});
  const form=new FormData();
  form.append('metadata',new Blob([JSON.stringify({main_module:'index.js',compatibility_date:'2024-12-30',compatibility_flags:['nodejs_compat','global_fetch_strictly_public'],bindings})],{type:'application/json'}));
  form.append('index.js',new Blob([bundle],{type:'application/javascript+module'}),'index.js');
  await api.cf(c,`${root}/workers/scripts/${c.workerName}`,'PUT',form);
  await api.cf(c,`${root}/workers/scripts/${c.workerName}/subdomain`,'POST',{enabled:true});
  const url=`https://${c.workerName}.${subdomain.subdomain}.workers.dev`;
  await api.verifyRelease(`${url}/api/v1/health`,target.release,true);
  return {success:true,message:'Installation erfolgreich geprueft.',version:target.release.version,fileStorageMode:mode,resources:{
    d1Database:{name:c.d1DbName,uuid:id,schemaApplied:true},r2Bucket:mode==='R2'?{name:c.r2BucketName}:null,
    workerScript:{name:c.workerName,deployed:true,liveUrl:url,subdomain:subdomain.subdomain,subdomainActive:true,error:null},
    secretsSaved:{JWT_SECRET:true},adminUser:{email:c.adminEmail,created:true}}};
}
