const fs=require('fs'),path=require('path'),crypto=require('crypto');
function classifyReference(value){
 try{const url=new URL(value),host=url.hostname.toLowerCase();if(!['http:','https:'].includes(url.protocol)||url.username||url.password)return 'invalid';return host==='localhost'||host.endsWith('.localhost')||host==='[::1]'||/^127\./.test(host)?'localhost':'external';}catch{return 'invalid';}
}
function photoPlan(rows){
 const groups=new Map(),counts={references:rows.length,localhost:0,external:0,invalid:0,ownershipConflicts:0};
 for(const row of rows){const kind=classifyReference(row.url_foto);counts[kind]++;if(Number(row.obra_id)!==Number(row.activity_work))counts.ownershipConflicts++;
  const fingerprint=crypto.createHash('sha256').update(String(row.url_foto)).digest('hex');const key=String(row.id_construtora)+':'+fingerprint;
  if(!groups.has(key))groups.set(key,{sourceFingerprint:fingerprint,tenant:row.id_construtora,kind,sourceRecords:[],automaticDownload:false});groups.get(key).sourceRecords.push(row.id_apontamento);
 }
 return {readOnly:true,modified:false,...counts,uniqueSourcesPerTenant:groups.size,sources:[...groups.values()],strategy:['Localizar os arquivos originais em fonte expressamente autorizada; não baixar URLs arbitrárias do banco.','Conferir obra e construtora de cada referência; não reutilizar objetos entre construtoras.','Após autorização: recodificar sem EXIF/GPS, enviar ao S3 privado e conferir tamanho e SHA-256.','Registrar foto_obra e ajustar os vínculos por transação somente após validar os objetos.','Validar leitura autenticada, CSRF e isolamento; preservar os originais e o backup.']};
}
async function inventory(connection){
 const [rows]=await connection.query("SELECT a.id_apontamento,a.url_foto,d.obrax_id obra_id,e.idx_obra activity_work,o.id_construtora FROM apontamento_fisico a JOIN diario_obra d ON d.id_diario=a.diario_id JOIN atividade_eap e ON e.id_atividade=a.atividade_eap_id JOIN obra o ON o.id_obra=d.obrax_id WHERE TRIM(COALESCE(a.url_foto,''))<>'' ORDER BY a.id_apontamento");
 return photoPlan(rows);
}
if(require.main===module)(async()=>{const connection=await require('mysql2/promise').createConnection(require('../config/environment').databaseOptions());try{const plan=await inventory(connection);if(!process.argv.includes('--details'))delete plan.sources;console.log(JSON.stringify(plan));}finally{await connection.end();}})().catch(error=>{console.error(JSON.stringify({code:error.code||error.message}));process.exitCode=1;});
module.exports={classifyReference,photoPlan,inventory};
