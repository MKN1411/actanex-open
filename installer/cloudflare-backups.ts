import { CloudflareUpdate, Config, sha256 } from './cloudflare-update';
import { sha256 as incrementalSha256 } from '@noble/hashes/sha2.js';

const CHUNK = 262144;
const MAX_BYTES = 16 * 1024 * 1024;
const MAX_SQL_BYTES = 64 * 1024 * 1024;
const hex = (bytes:Uint8Array)=>Array.from(bytes,n=>n.toString(16).padStart(2,'0')).join('');
const SETUP = `CREATE TABLE IF NOT EXISTS snapshots(id TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL, manifest TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS snapshot_parts(snapshot_id TEXT NOT NULL, kind TEXT NOT NULL, part INTEGER NOT NULL, body TEXT NOT NULL, PRIMARY KEY(snapshot_id,kind,part));
CREATE TABLE IF NOT EXISTS recovery_lock(id INTEGER PRIMARY KEY CHECK(id=1), run_id TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS recovery_runs(id TEXT PRIMARY KEY, snapshot_id TEXT NOT NULL, safety_id TEXT, status TEXT NOT NULL, created_at TEXT NOT NULL)`;

export class CloudflareBackups {
  private vaultNames = new Map<string,string>();
  constructor(private api: CloudflareUpdate) {}
  private account(c: Config) { this.api.validate(c); return `/accounts/${c.cfAccountId}`; }
  private name(c: Config) { return `${c.workerName.slice(0,48)}-backups`; }
  private async vault(c: Config, create = false, jurisdiction?: string) {
    const endpoint = `${this.account(c)}/d1/database`;
    const databases = await this.api.cf(c, `${endpoint}?per_page=10000`);
    const found = databases.filter((d: any)=>d.name === this.name(c));
    if (found.length > 1) throw new Error('Sicherungsdatenbank ist nicht eindeutig.');
    let db = found[0];
    if (!db) {
      const candidates=databases.filter((d: any)=>/^actanex[a-z0-9_-]*-backups$/.test(d.name || '') || d.name==='actanex-update-backups').sort((a: any,b: any)=>a.name.localeCompare(b.name));
      for (const candidate of candidates) {
        if (jurisdiction && candidate.jurisdiction!==jurisdiction) continue;
        const id=candidate.uuid || candidate.id;
        const columns=await this.api.readSchema(c,id);
        const required: Record<string,string[]>={snapshots:['id','created_at','status','manifest'],snapshot_parts:['snapshot_id','kind','part','body'],recovery_lock:['id','run_id'],recovery_runs:['id','snapshot_id','safety_id','status','created_at']};
        if (Object.entries(required).every(([table,names])=>names.every(name=>columns.some((col: any)=>col.table_name===table && col.name===name)))) {db=candidate;break;}
      }
    }
    if (!db && create) db = await this.api.cf(c, endpoint, 'POST', {name:this.name(c),...(jurisdiction ? {jurisdiction} : {})});
    if (!db) return null;
    if (jurisdiction && db.jurisdiction!==jurisdiction) throw new Error('Sicherungsdatenbank hat eine andere Datenresidenz als die Anwendung.');
    const id = db.uuid || db.id;
    if (!id) throw new Error('Sicherungsdatenbank ohne ID.');
    if (create) await this.api.query(c, id, SETUP);
    this.vaultNames.set(id,db.name);
    return id as string;
  }
  private async current(c: Config) {
    const account = this.account(c);
    const endpoint = `${account}/workers/scripts/${c.workerName}`;
    const settings = await this.api.cf(c, `${endpoint}/settings`);
    const dbs = (settings.bindings || []).filter((b: any)=>b.type === 'd1' && b.name === 'DB');
    if (dbs.length !== 1) throw new Error('Kein eindeutiges DB-Binding.');
    const buckets = (settings.bindings || []).filter((b: any)=>b.type === 'r2_bucket' && b.name === 'STORAGE');
    const actualStorageMode=settings.bindings.find((b: any)=>b.name==='FILE_STORAGE_MODE')?.text || 'R2';
    if(actualStorageMode!==(c.fileStorageMode || 'R2') || buckets.length>1 || (buckets[0]?.bucket_name || '')!==c.r2BucketName || (actualStorageMode==='R2' && buckets.length!==1)) throw new Error('Speicher-Binding stimmt nicht mit der ausgewaehlten Instanz ueberein.');
    const database = await this.api.cf(c, `${account}/d1/database/${dbs[0].id}`);
    if (database.name !== c.d1DbName) throw new Error('D1-Name stimmt nicht mit dem Worker-Binding ueberein.');
    const deployments = await this.api.cf(c, `${endpoint}/deployments`);
    const active = deployments.deployments?.[0];
    if (!active?.versions?.length || active.versions.reduce((n: number,v: any)=>n+v.percentage,0) !== 100) throw new Error('Aktiver Worker-Versionsstand konnte nicht gesichert werden.');
    let pages: any = null;
    if (c.deploymentMode === 'pages') {
      const project = await this.api.cf(c, `${account}/pages/projects/${c.pagesProjectName}`);
      pages = project.canonical_deployment;
      if (!pages?.id || pages.environment !== 'production' || pages.latest_stage?.status !== 'success') throw new Error('Kein erfolgreicher Pages-Produktionsstand fuer ein Rollback vorhanden.');
    }
    return {databaseId:dbs[0].id, jurisdiction:database.jurisdiction, settings, versions:active.versions, pagesId:pages?.id || null};
  }
  private async exported(c: Config, db: string) {
    let bookmark: string | undefined;
    for (let attempt=0;attempt<5;attempt++) {
      const result = await this.api.cf(c, `${this.account(c)}/d1/database/${db}/export`, 'POST', {output_format:'polling',...(bookmark ? {current_bookmark:bookmark} : {})});
      if (result.status === 'error') throw new Error('D1-Export fehlgeschlagen.');
      if (result.status === 'complete') {
        if (!result.at_bookmark || !result.result?.signed_url || !result.result.signed_url.startsWith('https://')) throw new Error('D1-Exportantwort unvollstaendig.');
        const response = await this.api.fetcher(result.result.signed_url,{signal:AbortSignal.timeout(60000),redirect:'manual'});
        if (!response.ok || Number(response.headers.get('content-length') || 0)>MAX_SQL_BYTES || !response.body) throw new Error('SQL-Export nicht erreichbar oder groesser als 64 MiB.');
        return {response,bookmark:result.at_bookmark};
      }
      bookmark = result.at_bookmark;
      if (!bookmark) throw new Error('D1-Export ohne Fortsetzungsmarke.');
      await new Promise(resolve=>setTimeout(resolve,1000));
    }
    throw new Error('D1-Export noch nicht abgeschlossen. Spaeter erneut versuchen; kein Update ausgefuehrt.');
  }
  private async writeExport(c:Config,vault:string,id:string,response:Response) {
    const reader=response.body!.pipeThrough(new TextDecoderStream('utf-8',{fatal:true})).getReader();
    const hash=incrementalSha256.create();const encoder=new TextEncoder();
    let pending='';let parts=0;let bytes=0;let schema=false;let batch:string[]=[];
    const flush=async()=>{
      if(!batch.length) return;
      await this.api.query(c,vault,`INSERT INTO snapshot_parts VALUES ${batch.map(()=>'(?,?,?,?)').join(',')}`,batch.flatMap((text,j)=>[id,'sql',parts+j,text]));
      parts+=batch.length;batch=[];
    };
    const append=async(text:string)=>{
      const data=encoder.encode(text);bytes+=data.length;
      if(bytes>MAX_SQL_BYTES) throw new Error('SQL-Export groesser als 64 MiB. Update gestoppt.');
      hash.update(data);schema ||= /CREATE TABLE/i.test(text);batch.push(text);
      if(batch.length===16) await flush();
    };
    try {
      for(;;) {
        const {done,value}=await reader.read();if(done) break;
        pending+=value;
        while(pending.length>=CHUNK) {
          let end=CHUNK;
          const last=pending.charCodeAt(end-1);if(last>=0xd800 && last<=0xdbff) end--;
          await append(pending.slice(0,end));pending=pending.slice(end);
        }
      }
      if(pending) await append(pending);await flush();
      if(!bytes || !schema) throw new Error('SQL-Export ist leer oder ohne Schema.');
      return {parts,bytes,sha256:hex(hash.digest())};
    } catch(error) {await reader.cancel().catch(()=>{});throw error;}
  }
  private async writeParts(c: Config, vault: string, id: string, kind: string, body: string) {
    const chunks = Array.from({length:Math.ceil(body.length/CHUNK)},(_,i)=>body.slice(i*CHUNK,(i+1)*CHUNK));
    for (let i=0;i<chunks.length;i+=16) {
      const batch=chunks.slice(i,i+16);
      await this.api.query(c,vault,`INSERT INTO snapshot_parts VALUES ${batch.map(()=>'(?,?,?,?)').join(',')}`,batch.flatMap((text,j)=>[id,kind,i+j,text]));
    }
    return {parts:chunks.length,sha256:await sha256(body),bytes:new TextEncoder().encode(body).length};
  }
  private async readParts(c: Config, vault: string, id: string, kind: string, info: any, collect=true) {
    if (!Number.isInteger(info?.parts) || info.parts<1 || info.parts>2048) throw new Error('Ungueltige Sicherungsteile.');
    const parts: string[] = [];let count=0;let bytes=0;const hash=incrementalSha256.create();
    for (let i=0;i<info.parts;i+=32) {
      const rows = (await this.api.query(c,vault,'SELECT part,body FROM snapshot_parts WHERE snapshot_id=? AND kind=? AND part>=? AND part<? ORDER BY part',[id,kind,i,Math.min(i+32,info.parts)]))[0].results;
      for (const row of rows) {
        if(row.part!==count++) throw new Error('Sicherung ist unvollstaendig.');
        const data=new TextEncoder().encode(row.body);bytes+=data.length;
        if(bytes>(kind==='sql'?MAX_SQL_BYTES:MAX_BYTES)) throw new Error('Sicherung ueberschreitet die Groessengrenze.');
        hash.update(data);if(collect) parts.push(row.body);
      }
    }
    const body=parts.join('');
    if (count!==info.parts || bytes!==info.bytes || hex(hash.digest())!==info.sha256) throw new Error('Sicherungs-Pruefsumme stimmt nicht. Wiederherstellung gestoppt.');
    return body;
  }
  async capture(c: Config, lockRunId: string | null = null) {
    const before = await this.current(c);
    const vault = await this.vault(c,true,before.jurisdiction);
    if (!vault) throw new Error('Sicherungsdatenbank konnte nicht angelegt werden.');
    if (before.databaseId === vault) throw new Error('Zieldatenbank darf nicht die Sicherungsdatenbank sein.');
    const codeResponse = await this.api.fetcher(`https://api.cloudflare.com/client/v4${this.account(c)}/workers/scripts/${c.workerName}`, {headers:{Authorization:`Bearer ${c.cfApiToken}`},signal:AbortSignal.timeout(30000)});
    if (!codeResponse.ok) throw new Error('Worker-Code konnte nicht gesichert werden.');
    const code = await codeResponse.text();
    if (!code || new TextEncoder().encode(code).length>MAX_BYTES) throw new Error('Worker-Sicherung leer oder groesser als 16 MiB.');
    const exported = await this.exported(c,before.databaseId);
    const after = await this.current(c);
    if (await sha256(JSON.stringify(before))!==await sha256(JSON.stringify(after))) throw new Error('Bereitstellung waehrend der Sicherung geaendert. Erneut sichern.');
    const id = crypto.randomUUID(); const createdAt=new Date().toISOString();
    const manifest: any = {format:1,id,createdAt,account:c.cfAccountId,worker:c.workerName,database:c.d1DbName,...before,
      pagesProject:c.deploymentMode==='pages'?c.pagesProjectName:null,bucket:c.r2BucketName,fileStorageMode:c.fileStorageMode || 'R2',mode:c.deploymentMode,bookmark:exported.bookmark,lockRunId,
      version:before.settings.bindings.find((b: any)=>b.name==='APP_VERSION')?.text || 'Altinstallation',
      releaseId:before.settings.bindings.find((b: any)=>b.name==='ACTANEX_RELEASE_ID')?.text || null,
      contentType:codeResponse.headers.get('content-type') || 'application/javascript'};
    await this.api.query(c,vault,'INSERT INTO snapshots VALUES (?,?,?,?)',[id,createdAt,'writing',JSON.stringify(manifest)]);
    manifest.sql = await this.writeExport(c,vault!,id,exported.response);
    manifest.code = await this.writeParts(c,vault!,id,'worker',code);
    await this.readParts(c,vault!,id,'sql',manifest.sql,false);
    await this.readParts(c,vault!,id,'worker',manifest.code,false);
    await this.api.query(c,vault!,'UPDATE snapshots SET status=?,manifest=? WHERE id=?',['complete',JSON.stringify(manifest),id]);
    return {success:true,backupId:id,createdAt,version:manifest.version,backupDatabase:this.vaultNames.get(vault),sqlBytes:manifest.sql.bytes,bookmark:manifest.bookmark};
  }
  private async load(c: Config) {
    if (!c.backupId || !/^[a-f0-9-]{36}$/.test(c.backupId)) throw new Error('Sicherungsstand auswaehlen.');
    const vault = await this.vault(c);
    if (!vault) throw new Error('Keine Cloudflare-Sicherung vorhanden.');
    const row = (await this.api.query(c,vault,'SELECT status,manifest FROM snapshots WHERE id=?',[c.backupId]))[0].results[0];
    if (row?.status !== 'complete') throw new Error('Sicherung fehlt oder ist unvollstaendig.');
    const m = JSON.parse(row.manifest);
    const storageMode=m.fileStorageMode || m.settings?.bindings?.find((binding:any)=>binding.name==='FILE_STORAGE_MODE')?.text || 'R2';
    if(storageMode!==(c.fileStorageMode || 'R2')) throw new Error('Sicherung hat einen anderen Dateispeichermodus. Keine automatische Speichermigration.');
    if (m.format!==1 || m.id!==c.backupId || m.account!==c.cfAccountId || m.worker!==c.workerName || m.database!==c.d1DbName || m.bucket!==c.r2BucketName || m.mode!==c.deploymentMode || m.pagesProject!==(c.deploymentMode==='pages'?c.pagesProjectName:null)) throw new Error('Sicherung gehoert nicht zu diesen Ressourcen.');
    return {vault,m};
  }
  async list(c: Config) {
    const vault=await this.vault(c);
    if (!vault) return {success:true,backups:[],backupDatabase:this.name(c)};
    const rows=(await this.api.query(c,vault,"SELECT id,created_at,manifest FROM snapshots WHERE status=? AND json_extract(manifest,'$.worker')=? AND json_extract(manifest,'$.database')=? ORDER BY created_at DESC LIMIT 100",['complete',c.workerName,c.d1DbName]))[0].results;
    return {success:true,backupDatabase:this.vaultNames.get(vault),backups:rows.map((r: any)=>{const m=JSON.parse(r.manifest);return {id:r.id,createdAt:r.created_at,worker:m.worker,version:m.version,
      releaseId:m.releaseId || m.settings?.bindings?.find((b: any)=>b.name==='ACTANEX_RELEASE_ID')?.text || null,
      workerVersionIds:(m.versions || []).map((v: any)=>v.version_id),pagesDeploymentId:m.pagesId || null,
      database:m.database,pagesProject:m.pagesProject,sqlBytes:m.sql.bytes};}).filter((m: any)=>m.worker===c.workerName && m.database===c.d1DbName && m.pagesProject===(c.deploymentMode==='pages'?c.pagesProjectName:null))};
  }
  async create(c: Config) {
    const current=await this.current(c); const runId=crypto.randomUUID();
    await this.api.query(c,current.databaseId,'CREATE TABLE IF NOT EXISTS actanex_update_lock (id INTEGER PRIMARY KEY CHECK(id=1), run_id TEXT NOT NULL)');
    await this.api.query(c,current.databaseId,'INSERT INTO actanex_update_lock VALUES (1,?)',[runId]).catch(()=>{throw new Error('Update oder Wiederherstellung laeuft bereits.');});
    try {return await this.capture(c,runId);}
    finally {await this.api.query(c,current.databaseId,'DELETE FROM actanex_update_lock WHERE id=1 AND run_id=?',[runId]);}
  }
  async captureLocked(c:Config,lockId:string) {
    if(!/^[a-f0-9-]{36}$/.test(lockId || '')) throw new Error('Gueltige Updatesperre erforderlich.');
    const current=await this.current(c);
    const locks=(await this.api.query(c,current.databaseId,'SELECT run_id FROM actanex_update_lock WHERE id=1 AND run_id=?',[lockId]))[0].results;
    if(locks.length!==1) throw new Error('Sicherungsauftrag gehoert zu keiner aktiven Instanzsperre.');
    return this.capture(c,lockId);
  }
  async download(c: Config) {
    const {vault,m}=await this.load(c);
    if(m.sql.bytes>MAX_BYTES) throw new Error('Grosse Sicherung als SQL-Stream herunterladen.');
    return {success:true,manifest:m,sql:await this.readParts(c,vault,m.id,'sql',m.sql),workerCode:await this.readParts(c,vault,m.id,'worker',m.code)};
  }
  async downloadSql(c:Config) {
    const {vault,m}=await this.load(c);
    await this.readParts(c,vault,m.id,'sql',m.sql,false);
    const api=this.api;let part=0;
    return new Response(new ReadableStream({async pull(controller) {
      try {
        if(part>=m.sql.parts) {controller.close();return;}
        const rows=(await api.query(c,vault,'SELECT part,body FROM snapshot_parts WHERE snapshot_id=? AND kind=? AND part>=? AND part<? ORDER BY part',[m.id,'sql',part,Math.min(part+32,m.sql.parts)]))[0].results;
        if(!rows.length) throw new Error('Sicherung unvollstaendig.');
        for(const row of rows) {if(row.part!==part++) throw new Error('Sicherung unvollstaendig.');controller.enqueue(new TextEncoder().encode(row.body));}
      } catch(error) {controller.error(error);}
    }}),{headers:{'Content-Type':'application/sql','Content-Disposition':`attachment; filename="actanex-${m.id}.sql"`,'Cache-Control':'no-store'}});
  }
  async downloadWorker(c:Config) {
    const {vault,m}=await this.load(c);
    return {success:true,manifest:m,workerCode:await this.readParts(c,vault,m.id,'worker',m.code)};
  }
  async plan(c: Config) {
    const {vault,m}=await this.load(c);
    await this.readParts(c,vault,m.id,'sql',m.sql,false);
    await this.readParts(c,vault,m.id,'worker',m.code);
    const current=await this.current(c);
    if (current.databaseId!==m.databaseId) throw new Error('Datenbank-Binding seit Sicherung geaendert.');
    const endpoint=`${this.account(c)}/workers/scripts/${c.workerName}`;
    for (const version of m.versions) await this.api.cf(c,`${endpoint}/versions/${encodeURIComponent(version.version_id)}`);
    if (m.pagesId) {
      const pages=await this.api.cf(c,`${this.account(c)}/pages/projects/${c.pagesProjectName}/deployments/${encodeURIComponent(m.pagesId)}`);
      if (pages.environment!=='production' || pages.latest_stage?.status!=='success') throw new Error('Gesicherter Pages-Stand nicht mehr verfuegbar.');
    }
    const bookmark=await this.api.cf(c,`${this.account(c)}/d1/database/${m.databaseId}/time_travel/bookmark`);
    const restoreDatabase=c.restoreDatabase===true;
    // Seven days is the common safe window; older exports remain downloadable on every plan.
    if (restoreDatabase && Date.now()-Date.parse(m.createdAt)>7*86400000) throw new Error('Sicherung aelter als 7 Tage. SQL-Export herunterladen und manuell importieren, oder nur Code zuruecksetzen.');
    const restorePlanId=await sha256(JSON.stringify({manifest:m,current,bookmark:bookmark.bookmark,restoreDatabase}));
    return {success:true,restorePlanId,backupId:m.id,version:m.version,createdAt:m.createdAt,restoreDatabase,
      warnings:[restoreDatabase?'Datenbank wird vollstaendig ersetzt. Alle spaeteren Datenaenderungen gehen verloren.':'Nur Worker und Weboberflaeche werden zurueckgesetzt. Die aktuelle Datenbank bleibt bestehen; Schemakompatibilitaet muss gegeben sein.',
        'R2-Dateien bleiben unveraendert. Waehrend der Wiederherstellung keine App benutzen. Vorher wird der aktuelle Stand erneut gesichert.']};
  }
  async restore(c: Config) {
    if (c.confirmRestore!==true || !c.restorePlanId) throw new Error('Wiederherstellung zuerst pruefen und ausdruecklich bestaetigen.');
    const {vault,m}=await this.load(c); const runId=crypto.randomUUID();
    await this.api.query(c,vault,'INSERT INTO recovery_lock VALUES (1,?)',[runId]).catch(()=>{throw new Error('Eine Wiederherstellung laeuft bereits.');});
    let stage='preflight'; let safetyId=''; let targetLock=false;
    try {
      const plan=await this.plan(c);
      if (plan.restorePlanId!==c.restorePlanId) throw new Error('Wiederherstellungsplan geaendert. Erneut pruefen.');
      await this.api.query(c,m.databaseId,'CREATE TABLE IF NOT EXISTS actanex_update_lock (id INTEGER PRIMARY KEY CHECK(id=1), run_id TEXT NOT NULL)');
      await this.api.query(c,m.databaseId,'INSERT INTO actanex_update_lock VALUES (1,?)',[runId]);targetLock=true;
      stage='safety-backup';safetyId=(await this.api.captureBackup(c,runId)).backupId;
      await this.api.query(c,vault,'INSERT INTO recovery_runs VALUES (?,?,?,?,?)',[runId,m.id,safetyId,'running',new Date().toISOString()]);
      if (c.restoreDatabase===true) {
        stage='database';
        await this.api.cf(c,`${this.account(c)}/d1/database/${m.databaseId}/time_travel/restore?bookmark=${encodeURIComponent(m.bookmark)}`,'POST');
        const tables=(await this.api.query(c,m.databaseId,"SELECT name FROM sqlite_schema WHERE type='table' AND name='actanex_update_lock'"))[0].results;
        if (tables.length && m.lockRunId) await this.api.query(c,m.databaseId,'DELETE FROM actanex_update_lock WHERE id=1 AND run_id=?',[m.lockRunId]);
        await this.api.query(c,m.databaseId,'CREATE TABLE IF NOT EXISTS actanex_update_lock (id INTEGER PRIMARY KEY CHECK(id=1), run_id TEXT NOT NULL)');
        await this.api.query(c,m.databaseId,'INSERT INTO actanex_update_lock VALUES (1,?)',[runId]);
      }
      stage='worker';
      await this.api.cf(c,`${this.account(c)}/workers/scripts/${c.workerName}/deployments`,'POST',{strategy:'percentage',versions:m.versions});
      stage='pages';
      if (m.pagesId && (await this.current(c)).pagesId!==m.pagesId) await this.api.cf(c,`${this.account(c)}/pages/projects/${c.pagesProjectName}/deployments/${encodeURIComponent(m.pagesId)}/rollback`,'POST');
      stage='verification';
      const current=await this.current(c);
      const normalized=(v: any[])=>v.map(x=>`${x.version_id}:${x.percentage}`).sort().join(',');
      if (normalized(current.versions)!==normalized(m.versions) || current.pagesId!==m.pagesId) throw new Error('Zurueckgesetzter Versionsstand konnte nicht bestaetigt werden.');
      await this.api.query(c,vault,'UPDATE recovery_runs SET status=? WHERE id=?',['restored',runId]);
      return {success:true,runId,backupId:m.id,safetyBackupId:safetyId,restoreDatabase:c.restoreDatabase===true,status:'restored'};
    } catch (err) {
      await this.api.query(c,vault,'UPDATE recovery_runs SET status=? WHERE id=?',[`failed:${stage}`,runId]).catch(()=>{});
      throw new Error(`Wiederherstellung bei ${stage} gestoppt. Sicherheitskopie ${safetyId || 'nicht abgeschlossen'}. Teilweise erfolgte Aenderungen bleiben bestehen. ${(err as Error).message}`);
    } finally {
      if (targetLock) await this.api.query(c,m.databaseId,'DELETE FROM actanex_update_lock WHERE id=1 AND run_id=?',[runId]).catch(()=>{});
      await this.api.query(c,vault,'DELETE FROM recovery_lock WHERE id=1 AND run_id=?',[runId]);
    }
  }
}
