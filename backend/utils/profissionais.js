const crypto=require('crypto');
const {id,text,fail}=require('./operacional');
const office=user=>String(user?.ambiente||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()==='escritorio';
function version(row){return crypto.createHash('sha256').update(JSON.stringify([Number(row.id_profissional),Number(row.id_construtora),row.codigo,row.nome,row.cargo,row.equipe_id==null?null:Number(row.equipe_id),row.terceirizada_id==null?null:Number(row.terceirizada_id),Boolean(Number(row.ativo))])).digest('hex');}
function payload(body){
 if(!body||typeof body!=='object'||Array.isArray(body))fail(400,'Informe os dados do profissional.');
 const allowed=new Set(['nome','codigo','cargo','equipe_id','terceirizada_id','ativo','versao']);
 if(Object.keys(body||{}).some(key=>!allowed.has(key)))fail(400,'Campo de profissional desconhecido.');
 const result={nome:text(body.nome,150),codigo:text(body.codigo,50),cargo:text(body.cargo,100),equipe_id:body.equipe_id==null?null:id(body.equipe_id),terceirizada_id:body.terceirizada_id==null?null:id(body.terceirizada_id),ativo:body.ativo};
 if(result.equipe_id&&result.terceirizada_id)fail(400,'Um profissional pode integrar somente uma equipe atual.');
 if(typeof result.ativo!=='boolean')fail(400,'Selecione uma situação válida para o profissional.');
 if(body.versao!==undefined&&(typeof body.versao!=='string'||!(/^[a-f0-9]{64}$/).test(body.versao)))fail(400,'Versão de profissional inválida.');
 return result;
}
module.exports={office,version,payload};
