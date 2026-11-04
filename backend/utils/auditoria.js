const {fail}=require('./operacional');
async function disponivel(c){return (await c.query("SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('gestao_auditoria','estoque_config','estoque_movimento','etapa_planejamento','maquina_evento','custo_detalhe','notificacao_leitura')"))[0][0].n===7;}
async function registrar(c,req,evento,recurso,recursoId,obraId,detalhes={}){
  // Apenas metadados explicitamente selecionados pelo chamador. Nunca recebe req.body.
  await c.query('INSERT INTO gestao_auditoria(construtora_id,usuario_id,obra_id,evento,recurso,recurso_id,detalhes) VALUES (?,?,?,?,?,?,?)',[req.acesso.idconstrutora,req.acesso.id_usuario,obraId||null,evento,recurso,recursoId,JSON.stringify(detalhes)]);
}
function office(req){if(String(req.acesso.ambiente).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()!=='escritorio')fail(403,'Somente o Escritório pode administrar este recurso.');}
const recursos={obra:['id_obra',null],usuario:['id_usuario',null],cadastro_de_equipes:['id_cadastro_equipes','idobra'],cadastro_de_equipes_terceirizadas:['id_equipe_terceirizada','id_obra'],cadastro_de_insumos:['id_insumos','idobra'],cadastro_de_maquinario:['id_maquina','idobra'],etapa:['id_etapa','id_obra']};
function recursoLegado(sql){const match=sql.match(/^\s*(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+`?(\w+)/i);return match&&recursos[match[1]]?match[1]:null;}
async function registrarLegado(c,actor,sql,result){
 const resource=recursoLegado(sql);if(!actor?.auditoria||!resource||!result.affectedRows)return;
 const target=result.insertId||actor.auditoria.id;if(!target)return;
 const [pk,column]=recursos[resource];let work=null;
 if(resource==='obra')work=/^\s*DELETE/i.test(sql)?null:target;
 else if(column){const [rows]=await c.query(`SELECT ${column} obra FROM ${resource} WHERE ${pk}=?`,[target]);work=rows[0]?.obra||null;}
 await registrar(c,{acesso:actor},actor.auditoria.evento,resource,target,work,actor.auditoria.detalhes);
}
module.exports={disponivel,registrar,office,recursoLegado,registrarLegado};
