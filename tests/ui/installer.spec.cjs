const {test,expect}=require('@playwright/test');
test('local service supplies source branch and network failure preserves inputs',async({page})=>{
  await page.route('**/api/health', route=>route.fulfill({json:{status:'healthy',app:'ActaNex Installer Companion',updateSourceRef:'CF-instance-update'}}));
  await page.route('**/api/update-plan',route=>route.abort('connectionrefused'));
  await page.goto('/');
  await page.getByLabel('Bestehende Instanz aktualisieren',{exact:true}).check();
  await expect(page.locator('#update-form [name=gitHubBranch]')).toHaveValue('CF-instance-update');
  await expect(page.getByText('Betriebsmodus',{exact:true})).toHaveCount(0);
  await expect(page.locator('#update-form [name=deploymentMode]')).toHaveValue('standalone');
  await expect(page.locator('#update-form [name=deploymentMode]')).toBeHidden();
  await expect(page.locator('#update-form [name=pagesProjectName]')).toHaveCount(0);
  await expect(page.locator('#pagesProjectName')).toBeHidden();
  await page.locator('#update-form [name=cfAccountId]').fill('a'.repeat(32));
  await page.locator('#update-form [name=cfApiToken]').fill('fake-test-token');
  await page.getByRole('button',{name:'Update prüfen'}).click();
  await expect(page.locator('#update-log')).toContainText('lokale Setup-Dienst');
  await expect(page.locator('#update-form [name=cfApiToken]')).toHaveValue('fake-test-token');
  await expect(page.locator('#update-apply')).toBeDisabled();
});
test('update selection, review, backup confirmation, success and invalidation',async({page},info)=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  await page.route('**/api/update-plan',route=>route.fulfill({json:{success:true,planId:'plan',targetCommit:'a'.repeat(40),installedVersion:'3.0.0',targetVersion:'3.1.0',resources:{worker:'test-worker',database:'test-db',bucket:'test-bucket',pages:null},changes:['Update'],migrations:['column:app_settings.vehicle_planning_json'],warnings:['Eigene Codeanpassungen werden ersetzt.'],recovery:{workerCode:'old-code',settings:{}}}}));
  await page.route('**/api/update-stream',route=>route.fulfill({json:{success:true,version:'3.1.0',backupId:'cloud-backup-1',migrations:1,bookmark:'bookmark-123',runId:'run-1',loginCheck:'Anmeldung mit bestehendem Konto pruefen.'}}));
  await page.route('**/api/backup-list',route=>route.fulfill({json:{success:true,backups:[]}}));
  await page.route('**/api/backup-create',route=>route.fulfill({json:{success:true,backupId:'manual-backup',backupDatabase:'test-backups',sqlBytes:4096}}));
  await page.goto('/');
  await page.getByLabel('Bestehende Instanz aktualisieren',{exact:true}).check();
  await expect(page.locator('#new-installation')).toBeHidden();
  await expect(page.locator('#instance-update')).toBeVisible();
  await page.locator('#update-form [name=cfAccountId]').fill('a'.repeat(32));
  await page.locator('#update-form [name=cfApiToken]').fill('fake-test-token');
  await page.getByRole('button',{name:'Update prüfen'}).click();
  await expect(page.locator('#update-plan')).toBeVisible();
  await expect(page.locator('#update-apply')).toBeDisabled();
  await page.locator('#update-backup-create').click();
  await expect(page.locator('#backup-status')).toContainText('manual-backup');
  await expect(page.locator('#update-plan')).toBeVisible();
  await expect(page.locator('#update-apply')).toBeDisabled();
  const download=page.waitForEvent('download');await page.locator('#update-backup').click();await download;
  await page.locator('#update-confirm').check();
  await expect(page.locator('#update-apply')).toBeEnabled();
  await page.screenshot({path:`output/update-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#update-apply').click();
  await expect(page.locator('#update-log')).toContainText('bookmark-123');
  await expect(page.locator('#backup-status')).toContainText('Erfolgreich gespeichert und geprueft');
  await expect(page.locator('#deployment-status')).toContainText('erfolgreich bereitgestellt');
  await page.getByRole('button',{name:'Update prüfen'}).click();
  await expect(page.locator('#update-plan')).toBeVisible();
  await page.locator('#update-form [name=workerName]').fill('other-worker');
  await expect(page.locator('#update-plan')).toBeHidden();
  expect(errors).toEqual([]);
});

test('cloud backup selection, download, explicit restore confirmation and resource invalidation',async({page},info)=>{
  const errors=[];page.on('pageerror',err=>errors.push(err.message));
  const backup={id:'backup-1',createdAt:'2026-10-07T09:00:00Z',version:'3.1.1',releaseId:'release-1',workerVersionIds:['worker-version-1'],sqlBytes:4096};
  await page.route('**/api/backup-create',route=>route.fulfill({json:{success:true,backupId:backup.id,backupDatabase:'test-backups',sqlBytes:4096}}));
  await page.route('**/api/backup-list',route=>route.fulfill({json:{success:true,backupDatabase:'test-backups',backups:[backup]}}));
  await page.route('**/api/backup-download',route=>route.fulfill({json:{success:true,sql:'CREATE TABLE example(id TEXT);',workerCode:'old-code',manifest:{id:backup.id}}}));
  await page.route('**/api/restore-plan',route=>route.fulfill({json:{success:true,restorePlanId:'restore-plan',createdAt:backup.createdAt,version:backup.version,warnings:['Alle spaeteren Datenaenderungen gehen verloren.']}}));
  let restored=false;
  await page.route('**/api/restore',async route=>{
    expect(route.request().postDataJSON().confirmRestore).toBe(true);
    expect(route.request().postDataJSON().restoreDatabase).toBe(true);restored=true;
    await route.fulfill({json:{success:true,safetyBackupId:backup.id}});
  });
  await page.goto('/');await page.getByLabel('Bestehende Instanz aktualisieren',{exact:true}).check();
  await page.locator('#update-form [name=cfAccountId]').fill('a'.repeat(32));
  await page.locator('#update-form [name=cfApiToken]').fill('fake-test-token');
  await page.locator('#backup-create').click();
  await expect(page.locator('#backup-log')).toContainText('gespeichert');
  await expect(page.locator('#backup-select')).toHaveValue(backup.id);
  await expect(page.locator('#backup-details')).toContainText('Version 3.1.1');
  await expect(page.locator('#backup-details')).toContainText('Worker-Version: worker-version-1');
  await expect(page.locator('#backup-details')).toContainText('Release: release-1');
  await expect(page.locator('#restore-apply')).toBeVisible();
  await expect(page.locator('#restore-apply')).toHaveText('Umgebung aus Sicherung wiederherstellen');
  await expect(page.locator('#restore-apply')).toBeDisabled();
  const download=page.waitForEvent('download');await page.locator('#backup-download').click();await download;
  await expect(page.locator('#backup-log')).toContainText('heruntergeladen');
  await page.locator('#restore-check').click();
  await expect(page.locator('#restore-panel')).toBeVisible();
  await expect(page.locator('#restore-apply')).toBeDisabled();expect(restored).toBe(false);
  await page.locator('#restore-db').uncheck();await expect(page.locator('#restore-panel')).toBeHidden();
  await page.locator('#restore-db').check();await page.locator('#restore-check').click();
  await page.locator('#restore-confirm').check();await expect(page.locator('#restore-apply')).toBeEnabled();
  await page.screenshot({path:`output/backups-${info.project.name}.png`,fullPage:true});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.locator('#restore-apply').click();await expect(page.locator('#backup-log')).toContainText('Wiederhergestellt');
  expect(restored).toBe(true);
  await page.locator('#restore-check').click();
  await page.locator('#update-form [name=workerName]').fill('another-worker');
  await expect(page.locator('#restore-panel')).toBeHidden();await expect(page.locator('#restore-check')).toBeDisabled();
  expect(errors).toEqual([]);
});

for(const scenario of ['backup-failure','deployment-failure']) test(`visible streamed status: ${scenario}`,async({page})=>{
  await page.route('**/api/update-plan',route=>route.fulfill({json:{success:true,planId:'plan',targetCommit:'a'.repeat(40),installedVersion:'3.0.0',targetVersion:'3.2.0',resources:{worker:'test-worker',database:'test-db',bucket:'test-bucket'},changes:[],migrations:[],warnings:[],recovery:{}}}));
  await page.route('**/api/update-stream',route=>route.fulfill({contentType:'application/x-ndjson',body:[
    {type:'progress',phase:'backup',backupStatus:'running'},
    ...(scenario==='deployment-failure'?[{type:'progress',phase:'backup',backupStatus:'verified',backupId:'verified-backup'}]:[]),
    {type:'error',backupStatus:scenario==='backup-failure'?'failed':'verified',backupId:scenario==='backup-failure'?'':'verified-backup',error:scenario==='backup-failure'?'SQL-Export fehlgeschlagen':'Worker-Bereitstellung fehlgeschlagen'}
  ].map(JSON.stringify).join('\n')+'\n'}));
  await page.goto('/');await page.getByLabel('Bestehende Instanz aktualisieren',{exact:true}).check();
  await page.locator('#update-form [name=cfAccountId]').fill('a'.repeat(32));
  await page.locator('#update-form [name=cfApiToken]').fill('fake-test-token');
  await page.locator('#update-check').click();await expect(page.locator('#update-plan')).toBeVisible();
  expect(await page.locator('#update-backup-create').evaluate(el=>Boolean(el.compareDocumentPosition(document.querySelector('#update-apply')) & Node.DOCUMENT_POSITION_FOLLOWING))).toBe(true);
  await page.locator('#update-confirm').check();await page.locator('#update-apply').click();
  await expect(page.locator('#deployment-status')).toHaveAttribute('data-state','error');
  await expect(page.locator('#backup-status')).toHaveAttribute('data-state',scenario==='backup-failure'?'error':'success');
  await expect(page.locator('#backup-status')).toContainText(scenario==='backup-failure'?'Kein Update bereitgestellt':'verified-backup');
  await expect(page.locator('#update-plan')).toBeHidden();
});
