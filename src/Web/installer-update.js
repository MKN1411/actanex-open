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
    @media(max-width:640px){.update-fields{grid-template-columns:1fr}}
  </style>
  <h2 class="text-xl font-semibold">Cloudflare-Update</h2>
  <form id="update-form">
    <div class="update-fields">
      <label>Cloudflare Account-ID<input name="cfAccountId" required pattern="[a-fA-F0-9]{32}" autocomplete="off"></label>
      <label>Cloudflare API-Token<input name="cfApiToken" type="password" required autocomplete="off"></label>
      <label>Worker<input name="workerName" value="actanex-open-worker" required></label>
      <label>D1-Datenbank<input name="d1DbName" value="actanex-open-db" required></label>
      <label>R2-Bucket<input name="r2BucketName" value="actanex-open-storage" required></label>
      <label>Betriebsmodus<select name="deploymentMode"><option value="standalone">Worker mit integrierter Weboberfl&auml;che</option><option value="pages">Worker und separates Pages-Projekt</option></select></label>
      <label id="update-pages-field" hidden>Pages-Projekt<input name="pagesProjectName" value="actanex-open-web"></label>
      <label>Quell-Repository<input name="gitHubRepo" value="MKN1411/actanex-open" required></label>
      <label>Zielversion (Branch, Tag oder Commit)<input name="gitHubBranch" value="main" required></label>
    </div>
    <div class="update-actions"><button id="update-check" type="submit">Update pr&uuml;fen</button></div>
  </form>
  <div id="update-plan" hidden>
    <h3 class="font-semibold mb-3">Geplantes Update</h3>
    <pre id="update-summary" style="white-space:pre-wrap;font-family:inherit"></pre>
    <div class="update-actions"><button id="update-backup" type="button">Worker-Sicherung herunterladen</button></div>
    <label style="display:flex;gap:10px;align-items:flex-start"><input id="update-confirm" type="checkbox" style="margin-top:4px">
      <span>Ich habe die Worker-Sicherung gespeichert und eigene Codeanpassungen gesichert. Die angezeigte Zielversion darf diese ersetzen.</span></label>
    <div class="update-actions"><button id="update-apply" type="button" disabled>Update ausf&uuml;hren</button></div>
  </div>
  <div id="update-log" role="status" aria-live="polite"></div>`;
  main.append(section);
  const form = section.querySelector('form');
  const output = section.querySelector('#update-log');
  const panel = section.querySelector('#update-plan');
  const apply = section.querySelector('#update-apply');
  const confirm = section.querySelector('#update-confirm');
  let plan = null;
  let config = null;
  let downloaded = false;
  let busy = false;
  chooser.addEventListener('change', () => {
    const updating = chooser.querySelector(':checked').value === 'update';
    install.hidden = updating; section.hidden = !updating;
  });
  function invalidate() {
    plan = null; config = null; downloaded = false; confirm.checked = false; apply.disabled = true; panel.hidden = true;
    section.querySelector('#update-pages-field').hidden = form.elements.deploymentMode.value !== 'pages';
  }
  form.addEventListener('input', invalidate);
  form.addEventListener('change', invalidate);
  function setBusy(value) {
    busy = value;
    form.querySelectorAll('input,select,button').forEach(el => el.disabled = value);
    chooser.querySelectorAll('input').forEach(el => el.disabled = value);
    confirm.disabled = value;
    apply.disabled = value || !plan || !downloaded || !confirm.checked;
  }
  async function call(endpoint, body) {
    const local = ['localhost','127.0.0.1'].includes(location.hostname);
    const base = local ? '/api' : location.hostname.endsWith('.pages.dev') ? 'https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer' : `${location.origin}/api/v1/installer`;
    const response = await fetch(`${base}/${endpoint}`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});
    const result = await response.json();
    if (!response.ok || !result.success) throw new Error(result.error || 'Update-Dienst nicht erreichbar.');
    return result;
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (busy || !form.reportValidity()) return;
    invalidate();
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
    setTimeout(()=>URL.revokeObjectURL(url),1000); downloaded = true; apply.disabled = busy || !confirm.checked;
  });
  confirm.addEventListener('change',()=>apply.disabled = busy || !downloaded || !confirm.checked);
  apply.addEventListener('click',async()=>{
    if (busy || !plan || !downloaded || !confirm.checked) return;
    setBusy(true); output.textContent = 'Update laeuft. Dieses Fenster geoeffnet lassen ...';
    try {
      const result = await call('update',{...config,targetCommit:plan.targetCommit,planId:plan.planId});
      output.textContent = `Version ${result.version} bereitgestellt.\nSchemaaenderungen: ${result.migrations}\nD1-Wiederherstellungspunkt: ${result.bookmark}\nProtokoll: ${result.runId}\n${result.loginCheck}`;
      invalidate();
    } catch(err) {output.textContent = err.message; invalidate();}
    finally {setBusy(false);}
  });
})();
