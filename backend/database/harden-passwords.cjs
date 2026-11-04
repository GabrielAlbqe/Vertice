const fs=require('fs/promises'),path=require('path'),crypto=require('crypto');
const {preparePasswordResets,isHash}=require('../security/passwordReset');
if(require.main===module){
  require('../config/environment');
  (async()=>{
    const env=process.env,approved=process.argv.includes(`--approved-database=${env.DB_NAME}`);
    if(!/^vertice_test_[a-z0-9_]+$/.test(env.DB_NAME)&&!approved)throw Error('APPROVAL_REQUIRED');
    const c=await require('mysql2/promise').createConnection(require('../config/environment').databaseOptions());let file;
    const selection=process.argv.find(arg=>arg.startsWith('--users='));
    const selectedIds=selection?selection.slice('--users='.length).split(',').map(Number):undefined;
    try{await c.beginTransaction();const tickets=await preparePasswordResets(c,selectedIds);
      if(tickets.length){
        const base=env.PASSWORD_RESET_BASE_URL||(env.PUBLIC_FRONTEND_URL?require('../config/publicOrigins').publicOrigin(env.PUBLIC_FRONTEND_URL,'PUBLIC_FRONTEND_URL')+'/login':null);if(!base)throw Error('RESET_URL_REQUIRED');
        const url=new URL(base);if(url.username||url.password||url.search||url.hash||!['https:','http:'].includes(url.protocol)||(env.NODE_ENV==='production'&&url.protocol!=='https:'))throw Error('RESET_URL_INVALID');
        const directory=path.resolve(__dirname,'../storage/private/resets');await fs.mkdir(directory,{recursive:true,mode:0o700});file=path.join(directory,crypto.randomUUID()+'.env');
        const text=tickets.map(item=>'USER_'+item.id_usuario+'_RESET_URL='+JSON.stringify(base+'#reset='+encodeURIComponent(item.ticket))).join('\n');
        await fs.writeFile(file,text,{flag:'wx',mode:0o600});
        if(process.platform==='win32')require('child_process').execFileSync('icacls.exe',[file,'/inheritance:r','/grant:r',process.env.USERDOMAIN+'\\'+process.env.USERNAME+':(F)'],{windowsHide:true,stdio:'ignore'});
      }
      await c.commit();console.log(JSON.stringify({resetRequired:tickets.length,privateDeliveryFile:file||null,expiresInMinutes:30}));
    }catch(e){await c.rollback();if(file)await fs.unlink(file).catch(()=>{});throw e;}finally{await c.end();}
  })().catch(()=>{console.error('Redefinicao nao aplicada. Verifique autorizacao, backup, URL e permissoes do arquivo privado.');process.exitCode=1;});
}
module.exports={preparePasswordResets,isHash};
