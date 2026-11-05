const fs=require('fs/promises'),path=require('path'),crypto=require('crypto');
const {preparePasswordResets,inspectPasswordResets,isHash}=require('../security/passwordReset');
function resetCommandOptions(argv,env){
 const apply=argv.includes('--apply');if(apply&&argv.includes('--dry-run'))throw Error('RESET_MODE_AMBIGUOUS');
 const selection=argv.find(arg=>arg.startsWith('--users='));const selectedIds=selection?selection.slice('--users='.length).split(',').map(Number):undefined;
 if(selectedIds&&(!selectedIds.length||selectedIds.length>100||selectedIds.some(id=>!Number.isSafeInteger(id)||id<=0)||new Set(selectedIds).size!==selectedIds.length))throw Error('RESET_USERS_INVALID');
 const isolated=/^vertice_test_[a-z0-9_]+$/.test(env.DB_NAME||'');
 if(apply&&!isolated&&(!env.DB_NAME||!argv.includes('--approved-database='+env.DB_NAME)||!selectedIds))throw Error('EXPLICIT_DATABASE_AND_USERS_APPROVAL_REQUIRED');
 return {apply,selectedIds};
}
async function main(argv=process.argv,env=process.env){
 const {apply,selectedIds}=resetCommandOptions(argv,env);
 const c=await require('mysql2/promise').createConnection(require('../config/environment').databaseOptions(env));let file;
 try{
  if(!apply){const candidates=await inspectPasswordResets(c,selectedIds);console.log(JSON.stringify({dryRun:true,modified:false,candidates,nextStep:'Após backup verificado e autorização específica: --apply --approved-database=<banco> --users=<ids>. Requer URL privada de redefinição.'}));return;}
  const base=env.PASSWORD_RESET_BASE_URL||(env.PUBLIC_FRONTEND_URL?require('../config/publicOrigins').publicOrigin(env.PUBLIC_FRONTEND_URL,'PUBLIC_FRONTEND_URL')+'/login':null);if(!base)throw Error('RESET_URL_REQUIRED');
  const url=new URL(base);if(url.username||url.password||url.search||url.hash||!['https:','http:'].includes(url.protocol)||(env.NODE_ENV==='production'&&url.protocol!=='https:'))throw Error('RESET_URL_INVALID');
  await c.beginTransaction();
  try{
   const tickets=await preparePasswordResets(c,selectedIds);
   if(tickets.length){
    const directory=path.resolve(__dirname,'../storage/private/resets');await fs.mkdir(directory,{recursive:true,mode:0o700});file=path.join(directory,crypto.randomUUID()+'.env');
    const text=tickets.map(item=>'USER_'+item.id_usuario+'_RESET_URL='+JSON.stringify(base+'#reset='+encodeURIComponent(item.ticket))).join('\n');
    await fs.writeFile(file,text,{flag:'wx',mode:0o600});
    if(process.platform==='win32')require('child_process').execFileSync('icacls.exe',[file,'/inheritance:r','/grant:r',env.USERDOMAIN+'\\'+env.USERNAME+':(F)'],{windowsHide:true,stdio:'ignore'});
   }
   await c.commit();console.log(JSON.stringify({resetRequired:tickets.length,privateDeliveryFile:file||null,expiresInMinutes:30}));
  }catch(error){await c.rollback();if(file)await fs.unlink(file).catch(()=>{});throw error;}
 }finally{await c.end();}
}
if(require.main===module){require('../config/environment');main().catch(error=>{console.error(JSON.stringify({modified:false,code:error.code||error.message}));process.exitCode=1;});}
module.exports={preparePasswordResets,inspectPasswordResets,isHash,resetCommandOptions,main};
