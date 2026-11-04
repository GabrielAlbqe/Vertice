const {pool,fail,id,text,option}=require('./operacional');
const types={propria:{table:'cadastro_de_equipes',pk:'id_cadastro_equipes',work:'idobra',history:'equipe_id'},terceirizada:{table:'cadastro_de_equipes_terceirizadas',pk:'id_equipe_terceirizada',work:'id_obra',history:'terceirizada_id'}};
const type=value=>types[option(value,Object.keys(types))];
async function enabled(c=pool){
 const [rows]=await c.query("SELECT (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('cadastro_de_equipes','cadastro_de_equipes_terceirizadas') AND COLUMN_NAME IN ('id_construtora','ativo','versao')) n,(SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='equipe_transferencia') h");
 return rows[0].n===6&&rows[0].h===1;
}
const owner=(t,alias='e')=>`COALESCE(${alias}.id_construtora,(SELECT id_construtora FROM obra WHERE id_obra=${alias}.${t.work}))`;
async function list(req){
 const ready=await enabled(),rows=[];
 for(const [kind,t] of Object.entries(types)){
  const [result]=await pool.query(`SELECT e.*,o.nome obra_nome,'${kind}' tipo,${ready?"CASE WHEN e.ativo=0 THEN 'Inativa' WHEN e."+t.work+" IS NULL THEN 'Disponivel' ELSE 'Alocada' END":"'Alocada'"} situacao FROM ${t.table} e LEFT JOIN obra o ON o.id_obra=e.${t.work} WHERE ${ready?owner(t):'o.id_construtora'}=? ORDER BY e.nome_equipe,e.${t.pk}`,[req.acesso.idconstrutora]);
  rows.push(...result.map(r=>({...r,equipe_id:r[t.pk],obra_id:r[t.work],ativo:ready?Boolean(r.ativo):true,versao:ready?r.versao:null})));
 }
 return {habilitado:ready,controle:'vinculo_unico',equipes:rows};
}
async function target(c,req,t,value){
 const [rows]=await c.query(`SELECT e.* FROM ${t.table} e WHERE e.${t.pk}=? AND ${owner(t)}=? FOR UPDATE`,[id(value),req.acesso.idconstrutora]);
 if(!rows.length)fail(404,'Equipe indisponível para esta construtora.');return rows[0];
}
async function checkWork(c,req,value){
 if(value===null)return null;
 const work=id(value),[rows]=await c.query('SELECT id_obra FROM obra WHERE id_obra=? AND id_construtora=?',[work,req.acesso.idconstrutora]);
 if(!rows.length)fail(403,'A obra deve pertencer à mesma construtora da equipe.');return work;
}
function noPeriods(body){if(Object.keys(body).some(k=>/data|inicio|fim|periodo/i.test(k)))fail(400,'Não há controle por período. Use o vínculo único atual, sem datas de alocação.');}
async function record(c,req,t,team,old,work,active,version,reason){
 await c.query(`INSERT INTO equipe_transferencia(construtora_id,usuario_id,${t.history},obra_anterior,obra_atual,ativo_anterior,ativo_atual,versao,motivo) VALUES (?,?,?,?,?,?,?,?,?)`,[req.acesso.idconstrutora,req.acesso.id_usuario,team,old?.[t.work]??null,work,old?Boolean(old.ativo):null,active,version,reason]);
 const audit=require('./auditoria');if(await audit.disponivel(c))await audit.registrar(c,req,old?'Vínculo de equipe atualizado':'Cadastro criado',t.table,team,work,{obra_anterior:old?.[t.work]??null,obra_atual:work,ativo:active,versao:version,motivo:reason});
}
async function move(c,req){
 const t=type(req.params.tipo),b=req.body;noPeriods(b);
 if(typeof b.ativo!=='boolean'||!Number.isSafeInteger(b.versao)||b.versao<0||b.obra_id===undefined)fail(400,'Informe obra atual, situação e versão válida da equipe.');
 const reason=text(b.motivo,500),row=await target(c,req,t,req.params.id);
 if(row.versao!==b.versao)fail(409,'A alocação foi alterada por outra operação. Atualize as equipes antes de tentar novamente.');
 const work=await checkWork(c,req,b.obra_id);
 if(!b.ativo&&work!==null)fail(409,'Libere a equipe da obra para deixá-la inativa.');
 if(!row.ativo&&work!==null&&!b.ativo)fail(409,'Equipe inativa não pode ser alocada.');
 if(row[t.work]===work&&Boolean(row.ativo)===b.ativo)return {insertId:row[t.pk],versao:row.versao};
 await c.query(`UPDATE ${t.table} SET ${t.work}=?,ativo=?,id_construtora=?,versao=versao+1 WHERE ${t.pk}=? AND versao=?`,[work,b.ativo,req.acesso.idconstrutora,row[t.pk],b.versao]);
 await record(c,req,t,row[t.pk],row,work,b.ativo,row.versao+1,reason);
 return {insertId:row[t.pk],versao:row.versao+1};
}
function profile(b,kind){
 const name=text(b.nome_equipe,45),decimal=v=>{if(!['number','string'].includes(typeof v)||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<0||Number(v)>99999999.99||Math.abs(Number(v)*100-Math.round(Number(v)*100))>0.00001)fail(400,'Informe um custo válido com até duas casas decimais.');return Number(v);};
 if(kind==='terceirizada')return {nome_equipe:name,custo_diario_total:decimal(b.custo_diario_total)};
 const count=Number(b.quantidade_profissionais);if(!['number','string'].includes(typeof b.quantidade_profissionais)||String(b.quantidade_profissionais).trim()===''||!Number.isSafeInteger(count)||count<=0)fail(400,'Informe uma quantidade inteira positiva de profissionais.');
 return {nome_equipe:name,etapa_atuacao:option(b.etapa_atuacao,['Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos']),quantidade_profissionais:count,custo_diario:decimal(b.custo_diario),custo_mensal:decimal(b.custo_mensal)};
}
async function create(c,req,kind){
 const t=type(kind),b=req.body;noPeriods(b);const data=profile(b,kind),work=await checkWork(c,req,b[t.work]===undefined||b[t.work]===''?null:b[t.work]);
 if(b.id_construtora!==undefined&&Number(b.id_construtora)!==req.acesso.idconstrutora)fail(403,'Construtora incompatível.');
 const columns=[...Object.keys(data),t.work,'id_construtora'];const [r]=await c.query(`INSERT INTO ${t.table}(${columns.join(',')}) VALUES (${columns.map(()=>'?').join(',')})`,[...Object.values(data),work,req.acesso.idconstrutora]);
 await record(c,req,t,r.insertId,null,work,true,0,'Cadastro da equipe');return {insertId:r.insertId};
}
async function legacyUpdate(c,req,kind){
 const t=type(kind),b=req.body,row=await target(c,req,t,req.params.id);
 if(b[t.work]!==undefined&&(b[t.work]===null||b[t.work]===''?null:Number(b[t.work]))!==row[t.work]||b.ativo!==undefined&&Boolean(b.ativo)!==Boolean(row.ativo)||b.id_construtora!==undefined&&Number(b.id_construtora)!==req.acesso.idconstrutora)fail(409,'Use a gestão de disponibilidade para liberar, transferir ou inativar uma equipe.');
 const data=profile({...row,...b},kind);
 await c.query(`UPDATE ${t.table} SET ${Object.keys(data).map(k=>k+'=?').join(',')} WHERE ${t.pk}=?`,[...Object.values(data),row[t.pk]]);
 const audit=require('./auditoria');if(await audit.disponivel(c))await audit.registrar(c,req,'Cadastro atualizado',t.table,row[t.pk],row[t.work],{campos:Object.keys(data)});
 return {insertId:row[t.pk]};
}
async function legacyDelete(c,req,kind){
 const t=type(kind),row=await target(c,req,t,req.params.id);
 if((await c.query(`SELECT id FROM equipe_transferencia WHERE ${t.history}=? LIMIT 1`,[row[t.pk]]))[0].length)fail(409,'Equipe possui histórico de alocações. Libere o vínculo e inative a equipe para preservar o histórico.');
 await c.query(`DELETE FROM ${t.table} WHERE ${t.pk}=?`,[row[t.pk]]);
 const audit=require('./auditoria');if(await audit.disponivel(c))await audit.registrar(c,req,'Cadastro excluído',t.table,row[t.pk],row[t.work]);
 return {insertId:row[t.pk]};
}
async function transaction(action){const c=await pool.getConnection();try{await c.beginTransaction();const r=await action(c);await c.commit();return r;}catch(e){await c.rollback();throw e;}finally{c.release();}}
function legacyController(original,kind,action){return async(req,res,next)=>{try{if(!await enabled())return original(req,res,next);const value=await transaction(c=>action==='create'?create(c,req,kind):action==='delete'?legacyDelete(c,req,kind):legacyUpdate(c,req,kind));res.status(action==='create'?201:200).json({...value,message:'Equipe confirmada.'});}catch(e){next(e);}};}
module.exports={enabled,list,type,types,owner,target,move,create,legacyController};
