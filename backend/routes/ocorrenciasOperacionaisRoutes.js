const router=require('express').Router();
const {pool,wrap,obra,id,text,option,fail,write}=require('../utils/operacional');
async function acompanhamento(c,b,actor){
  const classificacao=b.classificacao?text(b.classificacao,100):null,responsavel=b.responsavel_id?id(b.responsavel_id):null;
  const prazo=b.prazo_previsto?require('./gestaoRoutes').periodo({inicio:b.prazo_previsto})[0]:null;
  if(responsavel){const [u]=await c.query("SELECT id_usuario FROM usuario WHERE id_usuario=? AND idconstrutora=? AND status='Ativo'",[responsavel,actor.idconstrutora]);if(!u.length)fail(400,'Responsável indisponível nesta construtora.');}
  return {classificacao,responsavel_id:responsavel,prazo_previsto:prazo};
}
router.get('/',wrap(async(req,res)=>{
  await obra(pool,req.query.obra_id,req.acesso);
  const [rows]=await pool.query('SELECT c.*,u.nome responsavel,r.nome responsavel_resolucao,a.nome encarregado FROM ocorrencia_obra c JOIN usuario u ON u.id_usuario=c.usuario_id LEFT JOIN usuario r ON r.id_usuario=c.resolvido_por LEFT JOIN usuario a ON a.id_usuario=c.responsavel_id WHERE c.obra_id=? ORDER BY c.registrado_em DESC,c.id_ocorrencia DESC',[id(req.query.obra_id)]);
  res.json(rows);
}));
router.post('/',wrap(async(req,res)=>{
  const b=req.body,work=id(b.obra_id),description=text(b.descricao,4000),location=text(b.localizacao,255),priority=option(b.prioridade,['Baixa','Media','Alta','Critica']);
  const result=await write(req,async c=>{
    await obra(c,work,req.acesso);
    const fields=await acompanhamento(c,b,req.acesso);
    const [r]=await c.query('INSERT INTO ocorrencia_obra(obra_id,usuario_id,descricao,localizacao,prioridade,classificacao,responsavel_id,prazo_previsto) VALUES (?,?,?,?,?,?,?,?)',[work,req.acesso.id_usuario,description,location,priority,fields.classificacao,fields.responsavel_id,fields.prazo_previsto]);
    await c.query("INSERT INTO ocorrencia_historico(ocorrencia_id,usuario_id,acao,descricao) VALUES (?,?,'Criada',?)",[r.insertId,req.acesso.id_usuario,description]);
    return {insertId:r.insertId};
  });res.status(result.repeated?200:201).json(result.result);
}));
router.post('/:id/acompanhar',wrap(async(req,res)=>{
  const occurrence=id(req.params.id),priority=option(req.body.prioridade,['Baixa','Media','Alta','Critica']);
  const result=await write(req,async c=>{
    const [rows]=await c.query('SELECT x.* FROM ocorrencia_obra x JOIN obra o ON o.id_obra=x.obra_id WHERE x.id_ocorrencia=? AND o.id_construtora=? FOR UPDATE',[occurrence,req.acesso.idconstrutora]);
    const current=rows[0];if(!current)fail(404,'Ocorrência não encontrada.');if(current.status!=='Aberta')fail(409,'Ocorrência já resolvida. Atualize a consulta.');
    const old=Object.fromEntries(['prioridade','classificacao','responsavel_id','prazo_previsto'].map(k=>[k,current[k]]));
    if(!req.body.anterior||JSON.stringify(old)!==JSON.stringify(Object.fromEntries(Object.keys(old).map(k=>[k,req.body.anterior[k]]))))fail(409,'O acompanhamento foi alterado. Atualize antes de editar.');
    const next={prioridade:priority,...await acompanhamento(c,req.body,req.acesso)};
    await c.query('UPDATE ocorrencia_obra SET prioridade=?,classificacao=?,responsavel_id=?,prazo_previsto=? WHERE id_ocorrencia=?',[priority,next.classificacao,next.responsavel_id,next.prazo_previsto,occurrence]);
    await c.query("INSERT INTO ocorrencia_historico(ocorrencia_id,usuario_id,acao,descricao) VALUES (?,?,'Atualizada',?)",[occurrence,req.acesso.id_usuario,JSON.stringify({anterior:old,atual:next})]);
    return {id_ocorrencia:occurrence,status:'Aberta'};
  });res.json(result.result);
}));
router.post('/:id/resolver',wrap(async(req,res)=>{
  const occurrence=id(req.params.id),description=text(req.body.resolucao,4000);
  const result=await write(req,async c=>{
    const [rows]=await c.query('SELECT x.* FROM ocorrencia_obra x JOIN obra o ON o.id_obra=x.obra_id WHERE x.id_ocorrencia=? AND o.id_construtora=? FOR UPDATE',[occurrence,req.acesso.idconstrutora]);
    if(!rows.length)fail(404,'Ocorrência não encontrada.');
    if(rows[0].status==='Resolvida')fail(409,'Ocorrência já resolvida. Atualize a consulta.');
    await c.query("UPDATE ocorrencia_obra SET status='Resolvida',resolucao=?,resolvido_em=NOW(),resolvido_por=? WHERE id_ocorrencia=?",[description,req.acesso.id_usuario,occurrence]);
    await c.query("INSERT INTO ocorrencia_historico(ocorrencia_id,usuario_id,acao,descricao) VALUES (?,?,'Resolvida',?)",[occurrence,req.acesso.id_usuario,description]);
    return {id_ocorrencia:occurrence,status:'Resolvida'};
  });res.status(200).json(result.result);
}));
router.get('/:id/historico',wrap(async(req,res)=>{
  const occurrence=id(req.params.id);
  const [check]=await pool.query('SELECT x.id_ocorrencia FROM ocorrencia_obra x JOIN obra o ON o.id_obra=x.obra_id WHERE x.id_ocorrencia=? AND o.id_construtora=?',[occurrence,req.acesso.idconstrutora]);
  if(!check.length)fail(404,'Ocorrência não encontrada.');
  const [rows]=await pool.query('SELECT h.id_historico,h.acao,h.descricao,h.registrado_em,u.nome responsavel FROM ocorrencia_historico h JOIN usuario u ON u.id_usuario=h.usuario_id WHERE h.ocorrencia_id=? ORDER BY h.id_historico',[occurrence]);
  res.json(rows);
}));
module.exports=router;
