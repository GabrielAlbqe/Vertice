const {spawnSync}=require('child_process');
const path=require('path');
// Captura stderr diretamente, evitando que o PowerShell converta logs do Node em NativeCommandError.
const result=spawnSync(process.execPath,[path.join(__dirname,'canteiro.real.browser.mjs')],{encoding:'utf8',maxBuffer:16*1024*1024,windowsHide:true});
const output=(result.stdout || '')+'\n'+(result.stderr || '');
if(result.status===0)console.log(output.trim().split('\n').slice(-1)[0]);
else console.error(output.slice(-4000));
process.exitCode=result.status ?? 1;
