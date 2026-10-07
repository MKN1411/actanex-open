import { blake3 } from '@noble/hashes/blake3.js';
import { CloudflareBackups } from './cloudflare-backups';
type Column = {name: string; type: string; notnull: number; dflt_value: string | null; pk: number};
type Table = {name: string; sql: string; columns: Column[]};
type Release = {format: number; version: string; releaseId: string; bundleSha256: string; tables: Table[]; web: {path: string; body: string}[]; changes: string[]};
export type Config = {cfAccountId: string; cfApiToken: string; workerName: string; d1DbName: string; r2BucketName: string; pagesProjectName?: string; gitHubRepo?: string; gitHubBranch?: string; targetCommit?: string; deploymentMode?: string; planId?: string; backupId?: string; restorePlanId?: string; restoreDatabase?: boolean; confirmRestore?: boolean};
const API = 'https://api.cloudflare.com/client/v4';
const ident = (s: string) => { if (!/^\w+$/.test(s)) throw new Error('Ungueltiger SQL-Bezeichner.'); return `"${s}"`; };
const literal = (s: string) => `'${s.replaceAll("'", "''")}'`;
export async function sha256(value: string | ArrayBuffer) {
  return Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256', typeof value === 'string' ? new TextEncoder().encode(value) : value))).map(v => v.toString(16).padStart(2, '0')).join('');
}

export function planSchema(tables: Table[], existing: any[], history: any[] = []) {
  const operations: {id: string; sql: string}[] = [];
  for (const table of tables) {
    const columns = existing.filter(c => c.table_name === table.name);
    if (!columns.length) {
      operations.push({id: `table:${table.name}`, sql: table.sql});
      continue;
    }
    for (const column of table.columns) {
      const found = columns.find(c => c.name === column.name);
      if (found) {
        if (found.type.toUpperCase() !== column.type.toUpperCase() || Number(found.pk) !== column.pk) throw new Error(`Unbekanntes Schema: ${table.name}.${column.name}`);
      } else {
        if (column.pk || (column.notnull && column.dflt_value === null)) throw new Error(`Manuelle Migration erforderlich: ${table.name}.${column.name}`);
        const sql = `ALTER TABLE ${ident(table.name)} ADD COLUMN ${ident(column.name)} ${column.type}${column.notnull ? ' NOT NULL' : ''}${column.dflt_value === null ? '' : ` DEFAULT ${column.dflt_value}`}`;
        operations.push({id: `column:${table.name}.${column.name}`, sql});
      }
    }
  }
  for (const op of operations) if (history.some(h => h.id === op.id)) throw new Error(`Schema widerspricht Migrationshistorie: ${op.id}`);
  return operations;
}

export class CloudflareUpdate {
  private releases = new Map<string, {release: Release; commit: string; base: string}>();
  constructor(readonly fetcher: typeof fetch = fetch, private progress: (event: any)=>void = ()=>{}) {}
  report(event: any) { this.progress(event); }
  stream(c: Config) {
    const fetcher = this.fetcher;
    const stream = new ReadableStream<Uint8Array>({start(controller) {
      let closed = false; let backupStatus = 'not-started'; let backupId = '';
      const send = (event: any) => {if (!closed) {try {controller.enqueue(new TextEncoder().encode(JSON.stringify(event)+'\n'));} catch {closed=true;}}};
      const updater = new CloudflareUpdate(fetcher,event=>{
        if (event.backupStatus) backupStatus=event.backupStatus;
        if (event.backupId) backupId=event.backupId;
        send({type:'progress',...event});
      });
      void updater.execute(c).then(result=>send({type:'result',result})).catch(err=>send({type:'error',error:err.message,backupStatus:backupStatus==='running'?'failed':backupStatus,backupId})).finally(()=>{if (!closed) {closed=true;controller.close();}});
    },cancel() {}});
    return new Response(stream,{headers:{'Content-Type':'application/x-ndjson; charset=utf-8','Cache-Control':'no-store'}});
  }
  backups() { return new CloudflareBackups(this); }
  async dispatch(action: string, c: Config) {
    if (action === 'update-plan') return this.preflight(c);
    if (action === 'update') return this.execute(c);
    const backup = this.backups();
    if (action === 'backup-list') return backup.list(c);
    if (action === 'backup-create') return backup.create(c);
    if (action === 'backup-download') return backup.download(c);
    if (action === 'restore-plan') return backup.plan(c);
    if (action === 'restore') return backup.restore(c);
    throw new Error('Unbekannter Vorgang.');
  }
  async cf(c: Config, endpoint: string, method = 'GET', body?: any, token = c.cfApiToken): Promise<any> {
    const multipart = body instanceof FormData;
    const res = await this.fetcher(API + endpoint, {method, signal:AbortSignal.timeout(30000), headers: {Authorization: `Bearer ${token}`, ...(multipart ? {} : {'Content-Type':'application/json'})}, body: body === undefined ? undefined : multipart ? body : JSON.stringify(body)});
    const data = await res.json() as any;
    if (!res.ok || data.success !== true || (Array.isArray(data.result) && data.result.some((r: any) => r.success === false))) {
      const errors = [...(data.errors || []), ...(Array.isArray(data.result) ? data.result.filter((r: any)=>r.success === false).map((r: any)=>({message:r.error})) : [])];
      const detail = errors.map((e: any)=>`${e.code === undefined ? '' : `[${e.code}] `}${e.message || 'Unbekannter Fehler'}`).join('; ').split(c.cfApiToken).join('[redacted]').slice(0,600);
      throw new Error(`Cloudflare ${res.status}: ${endpoint} fehlgeschlagen.${detail ? ` ${detail}` : ''}`);
    }
    return data.result;
  }
  async query(c: Config, db: string, sql: string, params: any[] = []) {
    return this.cf(c, `/accounts/${c.cfAccountId}/d1/database/${db}/query`, 'POST', {sql, params});
  }
  async readSchema(c: Config, db: string) {
    const tables = (await this.query(c,db,"SELECT name FROM sqlite_schema WHERE type='table' AND name NOT GLOB 'sqlite_*' AND name NOT GLOB '_cf_*' ORDER BY name"))[0].results;
    if (!tables.length) return [];
    // Use documented standalone PRAGMA statements instead of relying on table-valued functions.
    const names = tables.map((t: any)=>t.name as string);
    const sql = names.map((name: string)=>`PRAGMA table_info("${name.replaceAll('"','""')}")`).join(';\n');
    const results = await this.query(c,db,sql);
    if (results.length !== names.length || results.some((r: any)=>!Array.isArray(r.results))) throw new Error('D1-Schemaantwort ist unvollstaendig. Update gestoppt.');
    return results.flatMap((r: any,i: number)=>r.results.map((column: any)=>({...column,table_name:names[i]})));
  }
  validate(c: Config) {
    if (!/^[a-f0-9]{32}$/i.test(c.cfAccountId) || !c.cfApiToken) throw new Error('Account-ID und API-Token erforderlich.');
    for (const name of [c.workerName, c.d1DbName, c.r2BucketName, ...(c.deploymentMode === 'pages' ? [c.pagesProjectName || ''] : [])]) if (!/^[a-z0-9][a-z0-9_-]{0,62}$/.test(name)) throw new Error('Ungueltiger Ressourcenname.');
    if (!['standalone', 'pages'].includes(c.deploymentMode || '')) throw new Error('Betriebsmodus auswaehlen.');
  }
  async release(c: Config) {
    const repo = c.gitHubRepo || 'MKN1411/actanex-open';
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo)) throw new Error('Ungueltiges GitHub-Repository.');
    let commit = c.targetCommit;
    if (!commit) {
      const res = await this.fetcher(`https://api.github.com/repos/${repo}/commits/${encodeURIComponent(c.gitHubBranch || 'main')}`, {headers:{'User-Agent':'ActaNex-Updater'}});
      if (!res.ok) throw new Error('GitHub-Quellstand nicht erreichbar.');
      commit = ((await res.json()) as any).sha;
    }
    if (!commit || !/^[a-f0-9]{40}$/.test(commit)) throw new Error('Vollstaendige Ziel-Commit-ID erforderlich.');
    const cached = this.releases.get(`${repo}/${commit}`);
    if (cached) return cached;
    const base = `https://raw.githubusercontent.com/${repo}/${commit}/src/Worker/bundle`;
    const res = await this.fetcher(`${base}/update-release.json`);
    if (!res.ok) throw new Error('Dieser Quellstand enthaelt noch kein Update-Release.');
    const release = await res.json() as Release;
    if (release.format !== 1 || !/^[a-f0-9]{64}$/.test(release.releaseId) || !release.tables?.length || !release.web?.length) throw new Error('Ungueltiges Update-Release.');
    const result = {release, commit, base};
    this.releases.set(`${repo}/${commit}`, result);
    return result;
  }
  async inspect(c: Config) {
    this.validate(c);
    const {release, commit, base} = await this.release(c);
    const account = `/accounts/${c.cfAccountId}`;
    const worker = `${account}/workers/scripts/${c.workerName}`;
    const settings = await this.cf(c, `${worker}/settings`);
    const bindings = settings.bindings || [];
    const db = bindings.filter((b: any) => b.type === 'd1' && b.name === 'DB');
    const bucket = bindings.filter((b: any) => b.type === 'r2_bucket' && b.name === 'STORAGE');
    if (db.length !== 1 || bucket.length !== 1 || bucket[0].bucket_name !== c.r2BucketName) throw new Error('Worker-Bindings stimmen nicht eindeutig mit den ausgewaehlten Ressourcen ueberein.');
    const database = await this.cf(c, `${account}/d1/database/${db[0].id}`);
    if (database.name !== c.d1DbName) throw new Error('D1-Name stimmt nicht mit dem Worker-Binding ueberein.');
    await this.cf(c, `${account}/r2/buckets/${c.r2BucketName}`);
    let pages: any = null;
    if (c.deploymentMode === 'pages') pages = await this.cf(c, `${account}/pages/projects/${c.pagesProjectName}`);
    const allColumns = await this.readSchema(c, db[0].id);
    const columns = allColumns.filter((v: any) => !v.table_name.startsWith('actanex_'));
    for (const table of ['users','customers','projects','app_settings']) if (!columns.some((v: any) => v.table_name === table)) throw new Error(`Keine unterstuetzte Altinstallation: ${table} fehlt.`);
    const users = (await this.query(c, db[0].id, "SELECT COUNT(*) AS count FROM users WHERE is_active=1 AND role='Admin'"))[0].results[0];
    if (!users.count) throw new Error('Kein aktiver Administrator vorhanden.');
    const history = allColumns.some((v: any) => v.table_name === 'actanex_migrations') ? (await this.query(c, db[0].id, 'SELECT id, checksum, sql_text FROM actanex_migrations ORDER BY id'))[0].results : [];
    for (const entry of history) if (await sha256(entry.sql_text) !== entry.checksum) throw new Error(`Migrations-Pruefsumme ungueltig: ${entry.id}`);
    const operations = planSchema(release.tables, columns, history);
    const codeRes = await this.fetcher(API + worker, {headers:{Authorization:`Bearer ${c.cfApiToken}`}});
    if (!codeRes.ok) throw new Error('Bestehender Worker konnte nicht gesichert werden.');
    const previousCode = await codeRes.text();
    const previousCodeType = codeRes.headers.get('content-type') || 'application/javascript';
    let canonicalCode = previousCode;
    if (previousCodeType.includes('multipart/form-data')) {
      const parts = await new Response(previousCode,{headers:{'Content-Type':previousCodeType}}).formData();
      const entries: string[] = [];
      for (const [name, value] of parts.entries()) entries.push(name + ':' + (typeof value === 'string' ? value : await sha256(await (value as Blob).arrayBuffer())));
      canonicalCode = entries.sort().join('\n');
    }
    const scriptHash = await sha256(canonicalCode);
    const subdomain = await this.cf(c, `${account}/workers/subdomain`);
    const route = await this.cf(c, `${worker}/subdomain`);
    let workerUrl: string;
    if (route.enabled && /^[a-z0-9-]+$/.test(subdomain.subdomain)) workerUrl = `https://${c.workerName}.${subdomain.subdomain}.workers.dev`;
    else {
      const domains = await this.cf(c, `${account}/workers/domains`);
      const domain = domains.find((d: any) => d.service === c.workerName && /^[a-z0-9.-]+$/.test(d.hostname));
      if (!domain) throw new Error('Keine pruefbare Worker-Adresse vorhanden.');
      workerUrl = `https://${domain.hostname}`;
    }
    const planId = await sha256(JSON.stringify({commit, release:release.releaseId, account:c.cfAccountId, worker:c.workerName, settings, columns, history, scriptHash, pages}));
    const version = bindings.find((b: any) => b.name === 'APP_VERSION')?.text || 'Unbekannt (Altinstallation)';
    const installedRelease = bindings.find((b: any) => b.name === 'ACTANEX_RELEASE_ID')?.text || null;
    return {release, commit, base, settings, database, pages, columns, history, operations, planId, version, installedRelease, previousCode, previousCodeType, workerUrl};
  }
  async preflight(c: Config) {
    const p = await this.inspect(c);
    return {success:true, planId:p.planId, targetCommit:p.commit, installedVersion:p.version, installedRelease:p.installedRelease,
      targetVersion:p.release.version, releaseId:p.release.releaseId, changes:p.release.changes, migrations:p.operations.map(o=>o.id),
      resources:{worker:c.workerName, database:p.database.name, databaseId:p.database.uuid || p.database.id, bucket:c.r2BucketName, pages:c.deploymentMode === 'pages' ? c.pagesProjectName : null},
      recovery:{workerCode:p.previousCode, contentType:p.previousCodeType, settings:p.settings},
      warnings:['Eigene Codeanpassungen werden durch die ausgewaehlte Version ersetzt.', 'Vor dem Update wird eine Cloudflare-Sicherung mit SQL-Export erstellt. Ohne erfolgreiche Sicherung wird das Update gestoppt.']};
  }
  async execute(c: Config) {
    this.report({phase:'preflight',message:'Update wird erneut geprueft.'});
    if (!c.targetCommit || !c.planId) throw new Error('Zuerst Update pruefen und bestaetigen.');
    const p = await this.inspect(c);
    if (p.planId !== c.planId) throw new Error('Instanz oder Update-Plan hat sich geaendert. Bitte erneut pruefen.');
    const account = `/accounts/${c.cfAccountId}`;
    const db = p.settings.bindings.find((b: any) => b.type === 'd1' && b.name === 'DB').id;
    const bundleRes = await this.fetcher(`${p.base}/worker.bundle.js`);
    if (!bundleRes.ok) throw new Error('Worker-Artefakt fehlt.');
    const bundle = await bundleRes.arrayBuffer();
    if (await sha256(bundle) !== p.release.bundleSha256) throw new Error('Worker-Pruefsumme stimmt nicht mit dem Release ueberein.');
    const bookmark = await this.cf(c, `${account}/d1/database/${db}/time_travel/bookmark`);
    if (!bookmark.bookmark) throw new Error('D1-Wiederherstellungspunkt konnte nicht erfasst werden.');
    const runId = crypto.randomUUID();
    await this.query(c, db, 'CREATE TABLE IF NOT EXISTS actanex_update_lock (id INTEGER PRIMARY KEY CHECK(id=1), run_id TEXT NOT NULL); CREATE TABLE IF NOT EXISTS actanex_update_runs (id TEXT PRIMARY KEY, release_id TEXT, commit_sha TEXT, bookmark TEXT, status TEXT, created_at TEXT); CREATE TABLE IF NOT EXISTS actanex_migrations (id TEXT PRIMARY KEY, checksum TEXT NOT NULL, applied_at TEXT NOT NULL, release_id TEXT NOT NULL, sql_text TEXT NOT NULL)');
    await this.query(c, db, 'INSERT INTO actanex_update_lock (id,run_id) VALUES (1,?)', [runId]).catch(()=>{throw new Error('Updatesperre konnte nicht erworben werden. Laufenden oder abgebrochenen Update-Lauf pruefen.');});
    let stage = 'backup';
    let backupId = '';
    try {
      const locked = await this.inspect(c);
      if (locked.planId !== c.planId) throw new Error('Instanz wurde zwischenzeitlich geaendert. Bitte erneut pruefen.');
      this.report({phase:'backup',backupStatus:'running',message:'Neue Cloudflare-Sicherung wird erstellt und geprueft.'});
      const backup = await this.backups().capture(c, runId);
      backupId = backup.backupId;
      this.report({phase:'backup',backupStatus:'verified',backupId,message:'Cloudflare-Sicherung erfolgreich gespeichert und geprueft.'});
      bookmark.bookmark = backup.bookmark;
      if ((await this.inspect(c)).planId !== c.planId) throw new Error('Instanz waehrend der Sicherung geaendert. Bitte erneut pruefen.');
      stage = 'migration';
      this.report({phase:stage,message:'Datenbankschema wird aktualisiert.'});
      await this.query(c, db, 'INSERT INTO actanex_update_runs VALUES (?,?,?,?,?,?)', [runId,p.release.releaseId,p.commit,bookmark.bookmark,'running',new Date().toISOString()]);
      // Only additive schema changes are supported; no business rows or secrets are rewritten.
      const statements: string[] = [];
      for (const op of p.operations) {
        statements.push(op.sql, `INSERT INTO actanex_migrations VALUES (${literal(op.id)},${literal(await sha256(op.sql))},${literal(new Date().toISOString())},${literal(p.release.releaseId)},${literal(op.sql)})`);
      }
      if (statements.length) await this.query(c, db, statements.join(';\n'));
      stage = 'worker';
      this.report({phase:stage,message:'Worker und integrierte App werden bereitgestellt.'});
      const bindings = p.settings.bindings.filter((b: any) => !['secret_text','secret_key'].includes(b.type) && !['APP_VERSION','ACTANEX_RELEASE_ID','ACTANEX_MANAGED_SCHEMA'].includes(b.name));
      bindings.push({type:'plain_text',name:'APP_VERSION',text:p.release.version}, {type:'plain_text',name:'ACTANEX_RELEASE_ID',text:p.release.releaseId}, {type:'plain_text',name:'ACTANEX_MANAGED_SCHEMA',text:'1'});
      const form = new FormData();
      const preserved = Object.fromEntries(['logpush','placement','tail_consumers','limits','observability','tags'].filter(key=>p.settings[key] !== undefined).map(key=>[key,p.settings[key]]));
      form.append('metadata', new Blob([JSON.stringify({...preserved, main_module:'index.js', compatibility_date:p.settings.compatibility_date || '2024-12-30', compatibility_flags:p.settings.compatibility_flags || ['nodejs_compat'], bindings, keep_bindings:['secret_text','secret_key']})],{type:'application/json'}));
      form.append('index.js',new Blob([bundle],{type:'application/javascript+module'}),'index.js');
      await this.cf(c, `${account}/workers/scripts/${c.workerName}`, 'PUT', form);
      let deployment: any = null;
      if (p.pages) {
        stage = 'pages';
        this.report({phase:stage,message:'Pages-Weboberflaeche wird bereitgestellt.'});
        deployment = await this.deployPages(c, p.release, p.pages.production_branch, p.commit, p.workerUrl);
      }
      stage = 'verification';
      this.report({phase:stage,message:'Bereitstellung wird ueberprueft.'});
      const settings = await this.cf(c, `${account}/workers/scripts/${c.workerName}/settings`);
      if (!settings.bindings.some((b: any) => b.name === 'ACTANEX_RELEASE_ID' && b.text === p.release.releaseId)) throw new Error('Worker-Version konnte nicht bestaetigt werden.');
      await this.verifyRelease(`${p.workerUrl}/api/v1/health`, p.release, true);
      await this.verifyRelease(deployment ? `https://${p.pages.subdomain}/actanex-release.json` : `${p.workerUrl}/actanex-release.json`, p.release);
      const login = await this.fetcher(`${deployment ? `https://${p.pages.subdomain}` : p.workerUrl}/?release=${p.release.releaseId}`, {redirect:'error'});
      if (!login.ok || !(await login.text()).includes('id="login-container"')) throw new Error('Anmeldeseite konnte nicht bestaetigt werden.');
      const columns = await this.readSchema(c, db);
      if (planSchema(p.release.tables,columns).length) throw new Error('Zielschema nach dem Update unvollstaendig.');
      const result = {success:true, runId, backupId, bookmark:bookmark.bookmark, version:p.release.version, releaseId:p.release.releaseId, targetCommit:p.commit,
        migrations:p.operations.length, pagesDeploymentId:deployment?.id || null, status:'deployed', loginCheck:'Anmeldung mit bestehendem Konto nach dem Update pruefen.'};
      await this.query(c, db, 'UPDATE actanex_update_runs SET status=? WHERE id=?', ['deployed',runId]);
      return result;
    } catch (err) {
      await this.query(c, db, 'UPDATE actanex_update_runs SET status=? WHERE id=?', [`failed:${stage}`,runId]).catch(()=>{});
      throw new Error(`Update bei ${stage} abgebrochen. Lauf ${runId}; Cloudflare-Sicherung ${backupId || 'nicht abgeschlossen'}; D1-Bookmark ${bookmark.bookmark}. Bereits erfolgte Aenderungen bleiben bestehen. ${(err as Error).message}`);
    } finally {
      await this.query(c, db, 'DELETE FROM actanex_update_lock WHERE id=1 AND run_id=?',[runId]);
    }
  }
  async verifyRelease(url: string, release: Release, health = false) {
    for (let i=0;i<5;i++) {
      try {
        const response = await this.fetcher(`${url}?release=${release.releaseId}`, {headers:{'Cache-Control':'no-cache'},redirect:'error'});
        const data = await response.json() as any;
        if (response.ok && data.releaseId === release.releaseId && data.version === release.version && (!health || data.status === 'healthy')) return;
      } catch {}
      if (i<4) await new Promise(resolve=>setTimeout(resolve,1000));
    }
    throw new Error(`Versionspruefung fehlgeschlagen: ${url}`);
  }
  async deployPages(c: Config, release: Release, branch: string, commit: string, workerUrl: string) {
    const endpoint = `/accounts/${c.cfAccountId}/pages/projects/${c.pagesProjectName}`;
    const {jwt} = await this.cf(c, `${endpoint}/upload-token`);
    const manifest: Record<string,string> = {};
    const form = new FormData();
    const assets: any[] = [];
    for (const file of release.web) {
      if (['/_headers','/_redirects'].includes(file.path)) {form.append(file.path.slice(1), new Blob([Uint8Array.from(atob(file.body), ch=>ch.charCodeAt(0))]), file.path.slice(1)); continue;}
      let body = file.body;
      if (file.path === '/index.html') {
        const html = new TextDecoder().decode(Uint8Array.from(atob(body), ch=>ch.charCodeAt(0)));
        const configured = html.replace('<head>', `<head><script>window.ACTANEX_API_BASE=${JSON.stringify(workerUrl + '/api/v1')};</script>`);
        body = btoa(Array.from(new TextEncoder().encode(configured), n=>String.fromCharCode(n)).join(''));
      }
      const key = Array.from(blake3(new TextEncoder().encode(body + file.path.split('.').pop())),b=>b.toString(16).padStart(2,'0')).join('').slice(0,32);
      manifest[file.path] = key;
      const ext = file.path.split('.').pop();
      const mime = ({html:'text/html',js:'application/javascript',css:'text/css',json:'application/json',svg:'image/svg+xml',png:'image/png',ico:'image/x-icon',woff2:'font/woff2'} as any)[ext || ''] || 'application/octet-stream';
      assets.push({key,value:body,base64:true,metadata:{contentType:mime}});
    }
    for (let i=0;i<assets.length;i+=20) await this.cf(c,'/pages/assets/upload','POST',assets.slice(i,i+20),jwt);
    form.append('manifest',JSON.stringify(manifest)); form.append('branch',branch); form.append('commit_hash',commit);
    const deployment = await this.cf(c,`${endpoint}/deployments`,'POST',form);
    // Poll only a bounded interval; an unfinished deployment is never reported as success.
    for (let i=0;i<5;i++) {
      const state = await this.cf(c,`${endpoint}/deployments/${deployment.id}`);
      if (state.latest_stage?.name === 'deploy' && state.latest_stage?.status === 'success') return state;
      if (['failure','canceled'].includes(state.latest_stage?.status)) throw new Error(`Pages-Deployment ${deployment.id} fehlgeschlagen.`);
      await new Promise(resolve=>setTimeout(resolve,1500));
    }
    throw new Error(`Pages-Deployment ${deployment.id} noch nicht bestaetigt. Im Cloudflare-Dashboard pruefen.`);
  }
}
