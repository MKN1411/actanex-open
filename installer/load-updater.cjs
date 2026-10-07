const { buildSync } = require('esbuild');
const Module = require('node:module');
const path = require('node:path');
const result = buildSync({entryPoints:[path.join(__dirname,'cloudflare-update.ts')],bundle:true,platform:'node',format:'cjs',write:false});
const loaded = new Module(__filename);
loaded._compile(result.outputFiles[0].text, __filename);
module.exports = loaded.exports;
