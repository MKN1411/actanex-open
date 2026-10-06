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
