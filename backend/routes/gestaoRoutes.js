const express = require('express');
const {pool,wrap,id,fail,obra}=require('../utils/operacional');
const {csv}=require('../utils/csv');
const router=express.Router();
router.use('/operacoes',require('./operacoesGestaoRoutes'));
router.use('/equipes',require('./equipesDisponibilidadeRoutes'));
router.use('/pessoas',require('./pessoasRoutes'));
router.use('/custos',require('./lancamentosRoutes'));
router.get('/responsaveis',wrap(async(req,res)=>res.json((await pool.query("SELECT id_usuario,nome FROM usuario WHERE idconstrutora=? AND status='Ativo' ORDER BY nome",[req.acesso.idconstrutora]))[0])));
router.get('/recursos',wrap(async(req,res)=>{
  const result={};
  for(const [key,table,column] of [['equipes','cadastro_de_equipes','idobra'],['insumos','cadastro_de_insumos','idobra'],['maquinarios','cadastro_de_maquinario','idobra']]){
    const ready=key==='equipes'&&await require('../utils/equipesDisponibilidade').enabled();
    result[key]=(await pool.query(ready?"SELECT r.* FROM cadastro_de_equipes r LEFT JOIN obra o ON o.id_obra=r.idobra WHERE COALESCE(r.id_construtora,o.id_construtora)=?":`SELECT r.* FROM ${table} r JOIN obra o ON o.id_obra=r.${column} WHERE o.id_construtora=?`,[req.acesso.idconstrutora]))[0];
  }
  res.json(result);
}));
function periodo(query){
  if(Object.keys(query).some(k=>/^(inicio|fim)\[/.test(k)))fail(400,'Período inválido.');
  const values=['inicio','fim'].map(k=>{
    const v=query[k];
    if(v===undefined || v==='')return null;
    if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'1000-01-01'||v>'9998-12-31'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail(400,'Período inválido.');
    return v;
  });
  if(values[0]&&values[1]&&values[0]>values[1])fail(400,'O início deve anteceder o fim.');
  return values;
}
async function resumo(req){
  const [start,end]=periodo(req.query),work=req.query.obra_id?id(req.query.obra_id):null;
  if(work)await obra(pool,work,req.acesso);
  await require('../utils/schemaReadiness').requireSchema(pool,'resumo');
  const c=await pool.getConnection();
  const scope='o.id_construtora=?'+(work?' AND o.id_obra=?':''),args=[req.acesso.idconstrutora,...(work?[work]:[])];
  function range(column,timestamp=false){
    const clauses=[],values=[];
    if(start){clauses.push(`${column}>=?`);values.push(timestamp?`${start} 03:00:00`:start);}
    if(end){clauses.push(`${column}<?`);const next=new Date(Date.parse(end)+86400000).toISOString().slice(0,10);values.push(timestamp?`${next} 03:00:00`:next);}
    return {sql:clauses.length?' AND '+clauses.join(' AND '):'',values};
  }
  async function query(sql,column,timestamp=false){const r=range(column,timestamp),parameters=sql.indexOf('$period')<sql.indexOf('$scope')?[...r.values,...args]:[...args,...r.values];return (await c.query(sql.replace('$scope',scope).replace('$period',r.sql),parameters))[0];}
  try{
    await c.query('SET TRANSACTION READ ONLY');await c.beginTransaction();
    const works=(await c.query(`SELECT o.* FROM obra o WHERE ${scope} ORDER BY o.nome`,args))[0];
    const financial=await query('SELECT o.id_obra,COUNT(*) registros,SUM(cr.valor_total) realizado FROM custo_realizado cr JOIN obra o ON o.id_obra=cr.id_obra WHERE $scope $period GROUP BY o.id_obra','cr.data');
    let previous=null;
    if(start&&end){
      const duration=Date.parse(end)-Date.parse(start)+86400000,from=new Date(Date.parse(start)-duration).toISOString().slice(0,10),to=new Date(Date.parse(start)-86400000).toISOString().slice(0,10);
      if(from>='1000-01-01')previous={inicio:from,fim:to,financeiro:(await c.query(`SELECT o.id_obra,COUNT(*) registros,SUM(cr.valor_total) realizado FROM custo_realizado cr JOIN obra o ON o.id_obra=cr.id_obra WHERE ${scope} AND cr.data>=? AND cr.data<? GROUP BY o.id_obra`,[...args,from,start]))[0]};
    }
    // Planejamento é selecionado por sobreposição; seu valor não é rateado por dia.
    const planned=(await c.query(`SELECT cp.* FROM custo_planejado cp JOIN obra o ON o.id_obra=cp.id_obra WHERE ${scope}${start?' AND cp.data_fim_prevista>=?':''}${end?' AND cp.data_inicio_prevista<=?':''} ORDER BY cp.data_inicio_prevista LIMIT 1001`,[...args,...(start?[start]:[]),...(end?[end]:[])]))[0];
    const diaryCounts=await query("SELECT o.id_obra,COUNT(*) diarios,SUM(TRIM(COALESCE(d.atrasos,''))<>'') diarios_com_atraso,SUM(TRIM(COALESCE(d.paralisacoes,''))<>'') diarios_com_paralisacao FROM diario_obra d JOIN obra o ON o.id_obra=d.obrax_id WHERE $scope $period GROUP BY o.id_obra",'d.data');
    const diaries=await query('SELECT d.id_diario,d.obrax_id,d.data,d.turno,d.etapa_atuacao,d.atrasos,d.paralisacoes,u.nome responsavel FROM diario_obra d JOIN obra o ON o.id_obra=d.obrax_id JOIN usuario u ON u.id_usuario=d.usuario_id WHERE $scope $period ORDER BY d.data DESC,d.id_diario DESC LIMIT 501','d.data');
    const activities=await query('SELECT e.id_atividade,e.descricao,e.idx_obra,COUNT(a.id_apontamento) registros,SUM(a.percentual_dia) avanco_periodo FROM atividade_eap e JOIN obra o ON o.id_obra=e.idx_obra LEFT JOIN (apontamento_fisico a JOIN diario_obra d ON d.id_diario=a.diario_id) ON a.atividade_eap_id=e.id_atividade $period WHERE $scope GROUP BY e.id_atividade ORDER BY e.id_atividade LIMIT 1001','d.data');
    const materials=await query('SELECT i.id_insumos,i.nome,o.id_obra,COUNT(*) registros,SUM(a.quantidade_consumida) quantidade FROM apropriacao a JOIN cadastro_de_insumos i ON i.id_insumos=a.id_insumo JOIN atividade_eap e ON e.id_atividade=a.id_atividade JOIN obra o ON o.id_obra=e.idx_obra LEFT JOIN apropriacao_registro ar ON ar.apropriacao_id=a.id_apropriacao WHERE $scope $period GROUP BY i.id_insumos,i.nome,o.id_obra ORDER BY i.nome LIMIT 1001','ar.registrado_em',true);
    const occurrences=await query('SELECT oc.*,u.nome responsavel,a.nome encarregado FROM ocorrencia_obra oc JOIN obra o ON o.id_obra=oc.obra_id JOIN usuario u ON u.id_usuario=oc.usuario_id LEFT JOIN usuario a ON a.id_usuario=oc.responsavel_id WHERE $scope $period ORDER BY oc.registrado_em DESC LIMIT 501','oc.registrado_em',true);
    const occurrenceCounts=await query("SELECT o.id_obra,COUNT(*) ocorrencias,SUM(oc.status='Aberta') abertas,SUM(oc.status='Aberta' AND oc.prioridade IN ('Alta','Critica')) criticas,SUM(oc.status='Aberta' AND oc.prazo_previsto<DATE(UTC_TIMESTAMP()-INTERVAL 3 HOUR)) vencidas FROM ocorrencia_obra oc JOIN obra o ON o.id_obra=oc.obra_id WHERE $scope $period GROUP BY o.id_obra",'oc.registrado_em',true);
    const teams=await query('SELECT o.id_obra,COUNT(DISTINCT p.equipe_id) equipes_presentes FROM diario_equipe_presente p JOIN diario_obra d ON d.id_diario=p.diario_id JOIN obra o ON o.id_obra=d.obrax_id WHERE $scope $period GROUP BY o.id_obra','d.data');
    const external=await query('SELECT o.id_obra,COUNT(DISTINCT p.equipe_id) terceirizadas_presentes FROM diario_terceirizada_presente p JOIN diario_obra d ON d.id_diario=p.diario_id JOIN obra o ON o.id_obra=d.obrax_id WHERE $scope $period GROUP BY o.id_obra','d.data');
    const machines=await query('SELECT o.id_obra,COUNT(DISTINCT p.maquinario_id) maquinarios_utilizados FROM diario_maquinario_utilizado p JOIN diario_obra d ON d.id_diario=p.diario_id JOIN obra o ON o.id_obra=d.obrax_id WHERE $scope $period GROUP BY o.id_obra','d.data');
    await c.commit();
    const limited=diaries.length>500||occurrences.length>500||activities.length>1000||materials.length>1000||planned.length>1000;
    return {periodo:{inicio:start,fim:end},periodo_anterior:previous,obras:works,financeiro:financial,planejamento:planned.slice(0,1000),indicadores_diarios:diaryCounts,indicadores_ocorrencias:occurrenceCounts,diarios:diaries.slice(0,500),atividades:activities.slice(0,1000),materiais:materials.slice(0,1000),ocorrencias:occurrences.slice(0,500),equipes:teams,terceirizadas:external,maquinarios:machines,limitado:limited,consultado_em:new Date().toISOString()};
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
router.get('/resumo',wrap(async(req,res)=>res.json(await resumo(req))));
router.get('/relatorio.csv',wrap(async(req,res)=>{
  const r=await resumo(req);
  if(r.limitado)fail(422,'Relatório excede o limite. Selecione uma obra e reduza o período.');
  const rows=[['Tipo','Obra/ID','Data','Descrição','Valor','Unidade/critério']];
  for(const w of r.obras)rows.push(['Obra',w.id_obra,'',w.nome,w.status,'Situação atual']);
  for(const d of r.diarios)rows.push(['Diário',d.obrax_id,d.data,`${d.turno} · ${d.etapa_atuacao} · ${d.responsavel}`,d.id_diario,'ID']);
  for(const a of r.atividades)rows.push(['Avanço físico',a.idx_obra,'',a.descricao,a.avanco_periodo,'Pontos percentuais da atividade no período; vazio = sem apontamento']);
  for(const m of r.materiais)rows.push(['Material',m.id_obra,'',m.nome,m.quantidade,'Unidade não cadastrada']);
  for(const o of r.ocorrencias)rows.push(['Ocorrência',o.obra_id,o.registrado_em,`${o.descricao} · ${o.prioridade} · ${o.status} · ${o.classificacao||"Sem classificação"} · ${o.encarregado||"Não atribuído"} · Prazo: ${o.prazo_previsto||"Não informado"}`,'','Situação atual']);
  for(const p of r.planejamento)rows.push(['Planejado',p.id_obra,`${p.data_inicio_prevista} / ${p.data_fim_prevista}`,p.etapa,p.valor_planejado,'BRL; sobreposição sem rateio']);
  for(const f of r.financeiro)rows.push(['Realizado',f.id_obra,'','Lançamentos financeiros',f.realizado,'BRL']);
  for(const f of r.periodo_anterior?.financeiro||[])rows.push(['Realizado no período anterior',f.id_obra,`${r.periodo_anterior.inicio} / ${r.periodo_anterior.fim}`,'Lançamentos financeiros',f.realizado,'BRL']);
  for(const [key,label,field] of [['equipes','Equipes presentes','equipes_presentes'],['terceirizadas','Terceirizadas presentes','terceirizadas_presentes'],['maquinarios','Maquinários utilizados','maquinarios_utilizados']])for(const x of r[key])rows.push([label,x.id_obra,'','Recursos distintos no período',x[field],'Cadastros distintos; não pessoa-dia/máquina-dia']);
  res.set({'Content-Type':'text/csv; charset=utf-8','Content-Disposition':'attachment; filename="vertice-relatorio.csv"','Cache-Control':'private, no-store'}).send(csv(rows));
}));
module.exports={router,periodo};
