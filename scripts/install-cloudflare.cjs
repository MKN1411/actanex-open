const {installCloudflare}=require('../installer/load-installer.cjs');
async function main() {
  let input='';for await(const chunk of process.stdin) input+=chunk;
  if(process.argv.includes('--base64')) input=Buffer.from(input.trim(),'base64').toString('utf8');
  const config=JSON.parse(input);
  try {const result=await installCloudflare(config);console.log(`Installation ${result.version} verified: ${result.resources.workerScript.liveUrl}; storage ${result.fileStorageMode}`);}
  catch(error) {throw new Error(String(error.message).split(config.cfApiToken || '\0').join('[redacted]'));}
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
