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
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
