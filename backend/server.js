const app=require('./app');
const connection=require('./config/connection'),pool=require('./config/operacional');
const port=Number(process.env.PORT||3000);
if(!Number.isInteger(port)||port<1||port>65535)throw Error('PORT inválida.');
let server;
const ready=process.env.SECURITY_STORE==='mysql'?pool.query('SELECT chave,valor,contador,expira_em FROM vertice_security_state LIMIT 0'):Promise.resolve();
ready.then(()=>{
  server=app.listen(port,process.env.NODE_ENV==='production'?'0.0.0.0':'::',()=>console.log(JSON.stringify({event:'server_started',port})));
  server.requestTimeout=30000;server.headersTimeout=15000;
}).catch(error=>{console.error(JSON.stringify({event:'security_storage_unavailable',code:error.code||'SECURITY_STORAGE_FAILURE'}));process.exit(1);});
let closing=false;
function shutdown(signal){
  if(closing)return;closing=true;console.log(JSON.stringify({event:'shutdown',signal}));
  if(!server){process.exit(0);return;}
  const deadline=setTimeout(()=>{server.closeAllConnections();process.exit(1);},10000);deadline.unref();
  server.close(async()=>{try{await pool.end();await new Promise(resolve=>connection.end(resolve));clearTimeout(deadline);process.exit(0);}catch{process.exit(1);}});
}
process.on('SIGTERM',()=>shutdown('SIGTERM'));process.on('SIGINT',()=>shutdown('SIGINT'));
