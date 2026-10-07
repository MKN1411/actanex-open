(() => {
  const main = document.querySelector('main');
  const install = document.createElement('div');
  install.id = 'new-installation';
  while (main.firstChild) install.append(main.firstChild);
  main.append(install);
  const overwrite = document.getElementById('allowOverwrite');
  if (overwrite) {
    overwrite.disabled = true;
    overwrite.hidden = true;
    document.querySelector('label[for="allowOverwrite"]').textContent = 'Bestehende Instanzen oben mit dem Vorgang "Bestehende Instanz aktualisieren" aktualisieren.';
  }
  const chooser = document.createElement('fieldset');
  chooser.className = 'mb-6 flex flex-wrap gap-4 border-b border-slate-700 pb-4';
  chooser.innerHTML = `<legend class="text-sm text-slate-300 mb-3">Vorgang</legend>
    <label><input type="radio" name="operation" value="install" checked> Neuinstallation</label>
    <label><input type="radio" name="operation" value="update"> Bestehende Instanz aktualisieren</label>`;
  main.prepend(chooser);
  const section = document.createElement('section');
  section.id = 'instance-update';
  section.hidden = true;
  section.innerHTML = `<style>
    #instance-update {color:#e2e8f0;letter-spacing:0}
    #instance-update [hidden] {display:none!important}
    .update-fields {display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px;margin:20px 0}
    .update-fields label {display:flex;flex-direction:column;gap:6px;font-size:14px;min-width:0}
    .update-fields input,.update-fields select {width:100%;min-width:0;background:#111827;border:1px solid #475569;color:white;border-radius:6px;padding:10px;font-size:14px}
    .update-actions {display:flex;flex-wrap:wrap;gap:12px;margin:20px 0}
    #instance-update button {padding:10px 16px;border-radius:6px;border:1px solid #475569;font-size:14px}
    #instance-update button:disabled {opacity:.45;cursor:not-allowed}
    #update-apply {background:#047857;color:white}
    #update-plan {padding:18px 0;border-top:1px solid #475569;overflow-wrap:anywhere}
    #update-log {white-space:pre-wrap;overflow-wrap:anywhere;font-size:14px;padding:16px 0}
    #operation-status {padding:14px 0;overflow-wrap:anywhere}
    #operation-status p {margin:6px 0}
    #operation-status [data-state=success] {color:#6ee7b7}
    #operation-status [data-state=error] {color:#fca5a5}
    #operation-status [data-state=running] {color:#fcd34d}
    @media(max-width:640px){.update-fields{grid-template-columns:1fr}}
  </style>
  <h2 class="text-xl font-semibold">Cloudflare-Update</h2>
  <form id="update-form">
    <input type="hidden" name="deploymentMode" value="standalone">
    <div class="update-fields">
      <label>Cloudflare Account-ID<input name="cfAccountId" required pattern="[a-fA-F0-9]{32}" autocomplete="off"></label>
      <label>Cloudflare API-Token<input name="cfApiToken" type="password" required autocomplete="off"></label>
      <label>Worker<input name="workerName" value="actanex-open-worker" required></label>
      <label>D1-Datenbank<input name="d1DbName" value="actanex-open-db" required></label>
      <label>R2-Bucket<input name="r2BucketName" value="actanex-open-storage" required></label>
      <label>Quell-Repository<input name="gitHubRepo" value="MKN1411/actanex-open" required></label>
      <label>Zielversion (Branch, Tag oder Commit)<input name="gitHubBranch" value="main" required></label>
    </div>
    <div class="update-actions"><button id="update-check" type="submit">Update pr&uuml;fen</button></div>
  </form>
  <div id="operation-status" role="status" aria-live="polite">
    <p id="backup-status">Sicherung: Noch nicht erstellt.</p>
    <p id="deployment-status">Update: Noch nicht gestartet.</p>
  </div>
  <div id="update-plan" hidden>
    <h3 class="font-semibold mb-3">Geplantes Update</h3>
    <pre id="update-summary" style="white-space:pre-wrap;font-family:inherit"></pre>
    <div class="update-actions"><button id="update-backup" type="button">Worker-Sicherung herunterladen</button></div>
    <div class="update-actions"><button id="update-backup-create" type="button">Vor Update jetzt sichern</button></div>
    <label style="display:flex;gap:10px;align-items:flex-start"><input id="update-confirm" type="checkbox" style="margin-top:4px">
      <span>Die Zielversion darf eigene Codeanpassungen ersetzen. Vor dem Update wird eine vollst&auml;ndige Datenbanksicherung in Cloudflare erstellt.</span></label>
    <div class="update-actions"><button id="update-apply" type="button" disabled>Update ausf&uuml;hren</button></div>
  </div>
  <div id="update-log" role="status" aria-live="polite"></div>
  <section style="border-top:1px solid #475569;padding-top:18px;margin-top:20px">
    <h3 class="font-semibold">Cloudflare-Sicherungen</h3>
    <div class="update-actions"><button id="backup-create" type="button">Jetzt sichern</button><button id="backup-list" type="button">Sicherungen laden</button></div>
    <div class="update-fields"><label>Sicherungsstand<select id="backup-select"><option value="">Keine Sicherung geladen</option></select></label></div>
    <pre id="backup-details" hidden style="white-space:pre-wrap;font-family:inherit;overflow-wrap:anywhere;margin:12px 0"></pre>
    <label style="display:flex;gap:10px;align-items:flex-start"><input id="restore-db" type="checkbox" checked><span>Datenbank ebenfalls zur&uuml;cksetzen</span></label>
    <div class="update-actions"><button id="backup-download" type="button" disabled>SQL und Worker herunterladen</button><button id="restore-check" type="button" disabled>Wiederherstellung pr&uuml;fen</button></div>
    <div id="restore-panel" hidden>
      <pre id="restore-summary" style="white-space:pre-wrap;font-family:inherit;overflow-wrap:anywhere"></pre>
      <label style="display:flex;gap:10px;align-items:flex-start"><input id="restore-confirm" type="checkbox"><span>Ich best&auml;tige das Zur&uuml;cksetzen. Bei Datenbank-Wiederherstellung gehen alle Daten&auml;nderungen seit der Sicherung verloren. Die App wird w&auml;hrenddessen nicht benutzt.</span></label>
    </div>
    <div class="update-actions"><button id="restore-apply" type="button" title="Sicherungsstand auswaehlen, Wiederherstellung pruefen und bestaetigen" disabled>Umgebung aus Sicherung wiederherstellen</button></div>
    <div id="backup-log" role="status" aria-live="polite" style="white-space:pre-wrap;overflow-wrap:anywhere"></div>
  </section>`;
  main.append(section);
  const form = section.querySelector('form');
  const output = section.querySelector('#update-log');
  const panel = section.querySelector('#update-plan');
  const apply = section.querySelector('#update-apply');
  const confirm = section.querySelector('#update-confirm');
  let plan = null;
  let config = null;
  let busy = false;
  let restorePlan = null;
  let loadedBackups = [];
  const backupSelect = section.querySelector('#backup-select');
  const backupLog = section.querySelector('#backup-log');
  const restoreConfirm = section.querySelector('#restore-confirm');
  const backupStatus = section.querySelector('#backup-status');
  const deploymentStatus = section.querySelector('#deployment-status');
  function status(element, state, message) {element.dataset.state=state;element.textContent=message;}
  function invalidateRestore() {
    restorePlan = null; restoreConfirm.checked = false;
    section.querySelector('#restore-panel').hidden = true;
    section.querySelector('#restore-apply').disabled = true;
  }
  const local = ['localhost','127.0.0.1'].includes(location.hostname);
  if (local) {
    fetch('/api/health', {signal:AbortSignal.timeout(3000)})
      .then(response => response.ok ? response.json() : null)
      .then(health => {
        if (health?.updateSourceRef && form.elements.gitHubBranch.value === 'main' && !busy && !plan) {
          form.elements.gitHubBranch.value = health.updateSourceRef;
        }
      }).catch(() => {});
  }
  chooser.addEventListener('change', () => {
    const updating = chooser.querySelector(':checked').value === 'update';
    install.hidden = updating; section.hidden = !updating;
  });
  function invalidate(resetStatus = false) {
    plan = null; config = null; confirm.checked = false; apply.disabled = true; panel.hidden = true;
    invalidateRestore(); backupSelect.replaceChildren(new Option('Keine Sicherung geladen',''));
    loadedBackups=[];section.querySelector('#backup-details').hidden=true;
    section.querySelector('#backup-download').disabled = true; section.querySelector('#restore-check').disabled = true;
    if(resetStatus) {
      status(backupStatus,'idle','Sicherung: Noch nicht erstellt.');
      status(deploymentStatus,'idle','Update: Noch nicht gestartet.');
    }
  }
  form.addEventListener('input', ()=>invalidate(true));
  form.addEventListener('change', ()=>invalidate(true));
  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input,select,button').forEach(el => el.disabled = value);
    chooser.querySelectorAll('input').forEach(el => el.disabled = value);
    confirm.disabled = value;
    apply.disabled = value || !plan || !confirm.checked;
    ['backup-create','backup-list','backup-select','restore-db','restore-confirm','update-backup','update-backup-create'].forEach(id=>section.querySelector(`#${id}`).disabled=value);
    ['backup-download','restore-check'].forEach(id=>section.querySelector(`#${id}`).disabled=value || !backupSelect.value);
    section.querySelector('#restore-apply').disabled=value || !restorePlan || !restoreConfirm.checked;
  }
  async function call(endpoint, body, onProgress) {
    const base = local ? '/api' : location.hostname.endsWith('.pages.dev') ? 'https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer' : `${location.origin}/api/v1/installer`;
    let response;
    try {
      response = await fetch(`${base}/${endpoint}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    } catch {
      throw new Error(local ? `Der lokale Setup-Dienst unter ${location.origin} ist nicht erreichbar. Dienst neu starten und erneut pruefen. Ihre Eingaben bleiben in diesem Fenster erhalten.` : 'Der Update-Dienst ist nicht erreichbar. Verbindung und Dienstadresse pruefen.');
    }
    if(response.ok && response.headers.get('content-type')?.includes('application/x-ndjson')) {
      const reader=response.body.getReader();const decoder=new TextDecoder();let buffer='';let result=null;
      function accept(line) {
        if(!line.trim()) return;
        const event=JSON.parse(line);
        if(event.type==='progress') onProgress?.(event);
        if(event.type==='result') result=event.result;
        if(event.type==='error') throw Object.assign(new Error(event.error),{backupStatus:event.backupStatus,backupId:event.backupId});
      }
      try {
        for(;;) {
          const {done,value}=await reader.read();
          buffer+=done?decoder.decode():decoder.decode(value,{stream:true});
          let newline;
          while((newline=buffer.indexOf('\n'))>=0) {const line=buffer.slice(0,newline);buffer=buffer.slice(newline+1);accept(line);}
          if(done) {accept(buffer);break;}
        }
      } finally {reader.releaseLock();}
      if(!result?.success) throw new Error('Verbindung beendet. Ergebnis unbekannt; Instanz und Sicherungen vor einem erneuten Versuch pruefen.');
      return result;
    }
    if (!response.headers.get('content-type')?.includes('application/json')) throw new Error('Die Adresse liefert keinen Update-Dienst. Dienstadresse und laufenden Setup-Server pruefen.');
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Update-Dienst nicht erreichbar.');
    return result;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    invalidate(true);
    config = Object.fromEntries(new FormData(form));
    setBusy(true); output.textContent = 'Instanz, Ressourcen und Zielversion werden geprueft ...';
    try {
      plan = await call('update-plan', config);
      const resource = plan.resources;
      section.querySelector('#update-summary').textContent = [
        `Installiert: ${plan.installedVersion}`, `Zielversion: ${plan.targetVersion}`, `Quellstand: ${plan.targetCommit}`,
        `Worker: ${resource.worker}`, `Datenbank: ${resource.database}`, `Speicher: ${resource.bucket}`,
        `Weboberflaeche: ${resource.pages || 'Im Worker integriert'}`, '', ...plan.changes, '',
        `Ausstehende Schemaaenderungen: ${plan.migrations.length}`, ...plan.migrations, '', ...plan.warnings
      ].join('\n');
      panel.hidden = false; output.textContent = 'Pruefung abgeschlossen. Benutzer, Passwoerter, Einstellungen und Dokumente bleiben erhalten.';
    } catch (err) {invalidate(); output.textContent = err.message;}
    finally {setBusy(false);}
  });
  section.querySelector('#update-backup').addEventListener('click', () => {
    if (!plan) return;
    const blob = new Blob([JSON.stringify({targetCommit:plan.targetCommit,resources:plan.resources,recovery:plan.recovery},null,2)], {type:'application/json'});
    const url = URL.createObjectURL(blob); const link = document.createElement('a');
    link.href = url; link.download = `actanex-worker-backup-${config.workerName}.json`; link.click();
    setTimeout(()=>URL.revokeObjectURL(url),1000);
  });
  confirm.addEventListener('change',()=>apply.disabled = busy || !plan || !confirm.checked);
  apply.addEventListener('click',async()=>{
    if (busy || !plan || !confirm.checked) return;
    const updateConfig={...config,targetCommit:plan.targetCommit,planId:plan.planId};
    setBusy(true); output.textContent = 'Update laeuft. Dieses Fenster geoeffnet lassen ...';
    status(backupStatus,'idle','Sicherung: Neue Pflichtsicherung vor dem Update ausstehend.');
    status(deploymentStatus,'running','Update: Erneute Vorpruefung laeuft.');
    try {
      const result = await call('update-stream',updateConfig,event=>{
        if(event.backupStatus==='running') status(backupStatus,'running','Sicherung: Wird erstellt und geprueft ...');
        if(event.backupStatus==='verified') status(backupStatus,'success',`Sicherung: Erfolgreich gespeichert und geprueft. ID: ${event.backupId}`);
        status(deploymentStatus,'running',`Update: ${event.phase==='backup'?'Wartet auf erfolgreiche Sicherung.':event.message}`);
      });
      status(backupStatus,'success',`Sicherung: Erfolgreich gespeichert und geprueft. ID: ${result.backupId}`);
      status(deploymentStatus,'success',`Update: Version ${result.version} erfolgreich bereitgestellt und geprueft.`);
      output.textContent = `Version ${result.version} bereitgestellt.\nSchemaaenderungen: ${result.migrations}\nCloudflare-Sicherung: ${result.backupId}\nD1-Wiederherstellungspunkt: ${result.bookmark}\nProtokoll: ${result.runId}\n${result.loginCheck}`;
      invalidate();
      try {await refreshBackups(updateConfig,result.backupId);} catch {backupLog.textContent='Update erfolgreich. Sicherungsliste konnte nicht geladen werden; Sicherungen erneut laden.';}
    } catch(err) {
      output.textContent = err.message;
      if(err.backupStatus==='failed') status(backupStatus,'error','Sicherung: Fehlgeschlagen. Kein Update bereitgestellt.');
      else if(err.backupStatus==='not-started') status(backupStatus,'idle','Sicherung: Nicht gestartet.');
      else if(backupStatus.dataset.state==='running') status(backupStatus,'error','Sicherung: Ergebnis unbekannt. Sicherungen und Laufstatus pruefen.');
      status(deploymentStatus,'error',`Update: Nicht erfolgreich abgeschlossen. ${err.message}`);
      invalidate();
    }
    finally {setBusy(false);}
  });
  function backupConfig() {
    if (!form.reportValidity()) throw new Error('Account, Token und Ressourcen ausfuellen.');
    return {...Object.fromEntries(new FormData(form)),backupId:backupSelect.value,restoreDatabase:section.querySelector('#restore-db').checked};
  }
  function saveDownload(body,type,name) {
    const url=URL.createObjectURL(new Blob([body],{type})); const link=document.createElement('a');
    link.href=url;link.download=name;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  }
  async function refreshBackups(c, selected='') {
    const result=await call('backup-list',c);
    loadedBackups=result.backups;
    backupSelect.replaceChildren(new Option(result.backups.length?'Sicherungsstand auswaehlen':'Keine Sicherung vorhanden',''));
    for(const backup of result.backups) backupSelect.add(new Option(`${new Date(backup.createdAt).toLocaleString('de-DE')} | ${versionLabel(backup.version)} | ${(backup.sqlBytes/1024).toFixed(0)} KiB SQL`,backup.id));
    if(selected) backupSelect.value=selected;
    showBackupDetails();
    return result;
  }
  function versionLabel(version) {
    return !version || version==='Altinstallation'?'Version unbekannt (Altinstallation)':`Version ${version}`;
  }
  function showBackupDetails() {
    const backup=loadedBackups.find(b=>b.id===backupSelect.value);
    const details=section.querySelector('#backup-details');details.hidden=!backup;
    if(backup) details.textContent=[versionLabel(backup.version),`Gesichert: ${new Date(backup.createdAt).toLocaleString('de-DE')}`,
      `Release: ${backup.releaseId || 'Nicht hinterlegt'}`,`Worker-Version: ${(backup.workerVersionIds || []).join(', ') || 'Nicht hinterlegt'}`,
      ...(backup.pagesDeploymentId?[`Pages-Deployment: ${backup.pagesDeploymentId}`]:[]),`Sicherungs-ID: ${backup.id}`].join('\n');
  }
  async function backupAction(action) {
    if(busy) return;
    let c;
    try {c=backupConfig();} catch(err) {backupLog.textContent=err.message;return;}
    invalidateRestore();setBusy(true);backupLog.textContent='Cloudflare-Sicherung wird bearbeitet ...';
    let created=false;
    if(action==='backup-create') status(backupStatus,'running','Sicherung: Wird erstellt und geprueft ...');
    try {
      if(action==='backup-create') {
        const result=await call(action,c);created=true;
        status(backupStatus,'success',`Sicherung: Erfolgreich gespeichert und geprueft. ID: ${result.backupId}`);
        await refreshBackups(c,result.backupId);
        backupLog.textContent=`Sicherung in ${result.backupDatabase} gespeichert.\nDatenbank: ${(result.sqlBytes/1024).toFixed(0)} KiB SQL\nWorker und Weboberflaeche: gesicherter Deployment-Stand\nR2-Dateien bleiben unveraendert.`;
      } else if(action==='backup-list') {
        const result=await refreshBackups(c);backupLog.textContent=`${result.backups.length} Sicherungen in ${result.backupDatabase}.`;
      } else if(action==='backup-download') {
        const result=await call(action,c);
        saveDownload(result.sql,'application/sql',`actanex-${c.backupId}.sql`);
        saveDownload(JSON.stringify({manifest:result.manifest,workerCode:result.workerCode},null,2),'application/json',`actanex-${c.backupId}-worker.json`);
        backupLog.textContent='SQL-Export und Worker-Sicherung heruntergeladen.';
      } else if(action==='restore-plan') {
        restorePlan=await call(action,c);
        section.querySelector('#restore-summary').textContent=[`Stand: ${new Date(restorePlan.createdAt).toLocaleString('de-DE')}`,versionLabel(restorePlan.version),...restorePlan.warnings].join('\n');
        section.querySelector('#restore-panel').hidden=false;backupLog.textContent='Wiederherstellungsstand geprueft. Noch nichts zurueckgesetzt.';
      }
    } catch(err) {
      backupLog.textContent=created?`Sicherung erfolgreich. Liste konnte nicht geladen werden: ${err.message}`:err.message;
      if(action==='backup-create' && !created) status(backupStatus,'error',`Sicherung: Nicht erfolgreich abgeschlossen. ${err.message}`);
    } finally {setBusy(false);}
  }
  section.querySelector('#update-backup-create').addEventListener('click',()=>backupAction('backup-create'));
  ['backup-create','backup-list','backup-download'].forEach(id=>section.querySelector(`#${id}`).addEventListener('click',()=>backupAction(id)));
  section.querySelector('#restore-check').addEventListener('click',()=>backupAction('restore-plan'));
  backupSelect.addEventListener('change',()=>{invalidateRestore();showBackupDetails();setBusy(false);});
  section.querySelector('#restore-db').addEventListener('change',invalidateRestore);
  restoreConfirm.addEventListener('change',()=>setBusy(busy));
  section.querySelector('#restore-apply').addEventListener('click',async()=>{
    if(busy || !restorePlan || !restoreConfirm.checked) return;
    const c=backupConfig(); const restorePlanId=restorePlan.restorePlanId;
    setBusy(true);backupLog.textContent='Aktueller Stand wird gesichert, anschliessend wird wiederhergestellt ...';
    try {
      const result=await call('restore',{...c,restorePlanId,confirmRestore:true});
      invalidate();await refreshBackups(c,result.safetyBackupId);
      backupLog.textContent=`Wiederhergestellt. Sicherheitskopie des vorherigen Standes: ${result.safetyBackupId}\nAnmeldung und Daten in der App pruefen.`;
    } catch(err) {invalidateRestore();backupLog.textContent=err.message;} finally {setBusy(false);}
  });
})();
