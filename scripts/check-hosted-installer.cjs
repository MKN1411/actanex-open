async function main() {
  const account=process.env.CLOUDFLARE_ACCOUNT_ID;
  const token=process.env.CLOUDFLARE_API_TOKEN;
  if(!account || !token) throw new Error('Cloudflare credentials required for hosted discovery check.');
  const response=await fetch('https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer/discover',{
    method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
    body:JSON.stringify({cfAccountId:account,cfApiToken:token})
  });
  const result=await response.json();
  if(!response.ok || !result.success) throw new Error(`Hosted discovery failed: ${String(result.error || response.status).split(token).join('[redacted]')}`);
  const instance=result.instances?.find(i=>i.workerName==='actanex-open-worker');
  if(instance?.version!==require('../package.json').version) throw new Error('Hosted discovery did not identify the updated original Open instance.');
  console.log(`Hosted discovery verified: original Open ${instance.version}; ${result.instances.length} supported instances. No installation or update requested.`);
  const planResponse=await fetch('https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer/update-plan',{
    method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(120000),
    body:JSON.stringify({...instance,cfAccountId:account,cfApiToken:token,gitHubRepo:'MKN1411/actanex-open',gitHubBranch:'main'})
  });
  const plan=await planResponse.json();
  if(!planResponse.ok || !plan.success) throw new Error(`Hosted update check failed: ${String(plan.error || planResponse.status).split(token).join('[redacted]')}`);
  console.log('Hosted update preflight verified. No update executed.');
  const updateResponse=await fetch('https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer/update-stream',{
    method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(240000),
    body:JSON.stringify({...instance,cfAccountId:account,cfApiToken:token,gitHubRepo:'MKN1411/actanex-open',targetCommit:plan.targetCommit,planId:plan.planId})
  });
  const events=(await updateResponse.text()).trim().split('\n').map(line=>JSON.parse(line));
  const outcome=events.at(-1);
  if(!updateResponse.ok || outcome?.type!=='result' || !outcome.result?.success) throw new Error(`Hosted original Open update failed: ${String(outcome?.error || outcome?.message || updateResponse.status).split(token).join('[redacted]')}`);
  console.log('Hosted original Open same-release update verified, including locked split backup transport. No other instance updated.');
  const backupConfig={...instance,cfAccountId:account,cfApiToken:token};
  async function backupAction(action,config) {
    const response=await fetch(`https://actanex-open-worker.michael-kirst.workers.dev/api/v1/installer/${action}`,{
      method:'POST',headers:{'Content-Type':'application/json'},signal:AbortSignal.timeout(240000),body:JSON.stringify(config)
    });
    const result=await response.json();
    if(!response.ok || !result.success) throw new Error(`Hosted ${action} failed: ${String(result.error || response.status).split(token).join('[redacted]')}`);
    return result;
  }
  const backup=await backupAction('backup-create',backupConfig);
  const download=await backupAction('backup-download',{...backupConfig,backupId:backup.backupId});
  if(!download.sql || !download.workerCode) throw new Error('Hosted backup download is incomplete.');
  console.log('Hosted original Open SQL and Worker backup created and verified on download. No restore executed.');
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
