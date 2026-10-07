const fs = require('node:fs');
const path = require('node:path');
const {CloudflareUpdate} = require('../installer/load-updater.cjs');
async function main() {
  const config = {
    cfAccountId:process.env.CLOUDFLARE_ACCOUNT_ID, cfApiToken:process.env.CLOUDFLARE_API_TOKEN,
    workerName:process.env.ACTANEX_WORKER || 'actanex-open-worker', d1DbName:process.env.ACTANEX_DATABASE || 'actanex-open-db',
    r2BucketName:process.env.ACTANEX_BUCKET || 'actanex-open-storage', deploymentMode:process.env.ACTANEX_MODE || 'pages',
    pagesProjectName:process.env.ACTANEX_PAGES || 'actanex-open-web', gitHubRepo:process.env.GITHUB_REPOSITORY || 'MKN1411/actanex-open',
    targetCommit:process.env.GITHUB_SHA
  };
  if (!config.targetCommit) throw new Error('GITHUB_SHA must identify the immutable release commit.');
  const updater = new CloudflareUpdate();
  // Repair only the incomplete backup from the known failed hosted smoke run.
  // Never release a lock associated with an update, another instance or another time.
  if(config.workerName==='actanex-open-worker' && config.d1DbName==='actanex-open-db') {
    const root=`/accounts/${config.cfAccountId}`;
    const settings=await updater.cf(config,`${root}/workers/scripts/${config.workerName}/settings`);
    const database=settings.bindings.find(binding=>binding.type==='d1' && binding.name==='DB')?.id;
    if(database) {
      const locks=(await updater.query(config,database,'SELECT run_id FROM actanex_update_lock WHERE id=1'))[0].results;
      if(locks.length===1) {
        const databases=await updater.cf(config,`${root}/d1/database?per_page=10000`);
        for(const vault of databases.filter(item=>/\-backups$/.test(item.name || ''))) {
          const matches=(await updater.query(config,vault.uuid || vault.id,"SELECT id FROM snapshots WHERE status='writing' AND json_extract(manifest,'$.worker')=? AND json_extract(manifest,'$.databaseId')=? AND json_extract(manifest,'$.lockRunId')=? AND created_at>=? AND created_at<=?",[config.workerName,database,locks[0].run_id,'2026-10-07T14:04:45.000Z','2026-10-07T14:05:08.500Z']))[0].results;
          if(matches.length===1) {
            const updates=(await updater.query(config,database,'SELECT id FROM actanex_update_runs WHERE id=?',[locks[0].run_id]))[0].results;
            if(updates.length) throw new Error('Failed smoke backup lock overlaps an update; refusing automatic repair.');
            await updater.query(config,database,'DELETE FROM actanex_update_lock WHERE id=1 AND run_id=?',[locks[0].run_id]);
            console.log('Released only the abandoned original Open backup lock from failed smoke run 37633476588.');
            break;
          }
        }
      }
    }
  }
  const plan = await updater.preflight(config);
  const dir = path.resolve('output/update-recovery');fs.mkdirSync(dir,{recursive:true});
  // Recovery artifacts can include plain-text Worker configuration; do not commit them.
  fs.writeFileSync(path.join(dir,'worker-before-update.json'),JSON.stringify(plan.recovery));
  console.log(`Update ${plan.installedVersion} -> ${plan.targetVersion}; ${plan.migrations.length} schema changes; ${plan.targetCommit}`);
  const result = await updater.execute({...config,planId:plan.planId});
  fs.writeFileSync(path.join(dir,'result.json'),JSON.stringify(result,null,2));
  console.log(`Verified release ${result.releaseId}; D1 bookmark ${result.bookmark}`);
}
main().catch(err=>{console.error(err.message);process.exitCode=1;});
