const express = require('express');
const crypto = require('crypto');
const {pipeline}=require('stream/promises');
const { pool, wrap, obra, related, id, text, fail, write } = require('../utils/operacional');
const storage = require('../storage/imagens');
const router = express.Router();
router.get('/', wrap(async (req,res) => {
  await obra(pool,req.query.obra_id,req.acesso);
  const args=[id(req.query.obra_id)],filters=[req.query.excluidas==='true'?'f.excluido_em IS NOT NULL':'f.excluido_em IS NULL'];
  if(req.query.atividade_id){filters.push('f.atividade_id=?');args.push(id(req.query.atividade_id));}
  if(req.query.antes){filters.push('f.id_foto<?');args.push(id(req.query.antes));}
  const limit=req.query.limite===undefined?200:id(req.query.limite);if(limit>200)fail(400,'Limite máximo de 200 fotos.');
  const [start,end]=require('./gestaoRoutes').periodo(req.query);
  if(start){filters.push('f.registrado_em>=?');args.push(`${start} 03:00:00`);}
  if(end){filters.push('f.registrado_em<?');args.push(`${new Date(Date.parse(end)+86400000).toISOString().slice(0,10)} 03:00:00`);}
  if(req.query.busca){filters.push('(LOCATE(LOWER(?),LOWER(f.descricao))>0 OR LOCATE(LOWER(?),LOWER(u.nome))>0)');const search=text(req.query.busca,100);args.push(search,search);}
  const [rows] = await pool.query('SELECT f.id_foto,f.obra_id,f.usuario_id,f.excluido_em,f.excluido_por,f.atividade_id,e.descricao atividade,f.descricao,f.mime,f.tamanho,f.registrado_em,u.nome responsavel FROM foto_obra f JOIN usuario u ON u.id_usuario=f.usuario_id LEFT JOIN atividade_eap e ON e.id_atividade=f.atividade_id WHERE f.obra_id=?'+(filters.length?' AND '+filters.join(' AND '):'')+' ORDER BY f.id_foto DESC LIMIT ?',[...args,limit]);
  res.json(rows);
}));
router.post('/', express.raw({ type: ['image/jpeg','image/png','image/webp'], limit:'5mb' }), wrap(async(req,res)=>{
  const work=id(req.query.obra_id),description=text(req.query.descricao,1000);
  await obra(pool,work,req.acesso);
  if(!Buffer.isBuffer(req.body))fail(415,'Envie uma foto JPEG, PNG ou WebP.');
  const hash=crypto.createHash('sha256').update(req.body).digest('hex');
  let saved;
  try {
    const result=await write(req,async c=>{
      await obra(c,work,req.acesso,true);
      const activity=req.query.atividade_id?id(req.query.atividade_id):null;
      if(activity)await related(c,'atividade_eap','id_atividade',activity,'idx_obra',work);
      saved=await storage.put(req.body);
      const [existing]=await c.query('SELECT id_foto FROM foto_obra WHERE obra_id=? AND sha256=? AND excluido_em IS NULL ORDER BY id_foto DESC LIMIT 1',[work,saved.sha256]);
      if(existing.length){await storage.remove(saved.arquivo);saved=null;return {insertId:existing[0].id_foto,deduplicada:true,message:'Imagem já registrada nesta obra. O registro original foi preservado.'};}
      const [r]=await c.query('INSERT INTO foto_obra(obra_id,usuario_id,descricao,arquivo,mime,tamanho,sha256,atividade_id) VALUES (?,?,?,?,?,?,?,?)',[work,req.acesso.id_usuario,description,saved.arquivo,saved.mime,saved.tamanho,saved.sha256,activity]);
      await c.query("INSERT INTO foto_historico(foto_id,usuario_id,acao,descricao) VALUES (?,?,'Enviada',?)",[r.insertId,req.acesso.id_usuario,description]);
      return {insertId:r.insertId,message:'Foto recebida e confirmada pelo servidor.'};
    },hash);
    res.status(result.repeated?200:201).json(result.result);
  } catch(e) { if(saved && !e.commitUncertain)await storage.remove(saved.arquivo); throw e; }
}));
router.get('/:id/arquivo',wrap(async(req,res,next)=>{
  const [rows]=await pool.query('SELECT f.arquivo FROM foto_obra f JOIN obra o ON o.id_obra=f.obra_id WHERE f.id_foto=? AND o.id_construtora=? AND f.excluido_em IS NULL',[id(req.params.id),req.acesso.idconstrutora]);
  if(!rows.length)fail(404,'Foto não encontrada.');
  const stream=await storage.read(rows[0].arquivo);
  res.set({'Content-Type':'image/webp','Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff','Content-Disposition':'inline; filename="foto.webp"'});
  await pipeline(stream,res);
}));
router.get('/:id/historico',wrap(async(req,res)=>{
  const photo=id(req.params.id);
  const [rows]=await pool.query('SELECT f.id_foto FROM foto_obra f JOIN obra o ON o.id_obra=f.obra_id WHERE f.id_foto=? AND o.id_construtora=?',[photo,req.acesso.idconstrutora]);
  if(!rows.length)fail(404,'Foto não encontrada.');
  const [history]=await pool.query('SELECT h.id_historico,h.acao,h.descricao,h.registrado_em,u.nome responsavel FROM foto_historico h JOIN usuario u ON u.id_usuario=h.usuario_id WHERE h.foto_id=? ORDER BY h.id_historico',[photo]);res.json(history);
}));
router.delete('/:id',wrap(async(req,res)=>{
  const photo=id(req.params.id),reason=text(req.body.motivo,1000);
  const result=await write(req,async c=>{
    const [rows]=await c.query('SELECT f.* FROM foto_obra f JOIN obra o ON o.id_obra=f.obra_id WHERE f.id_foto=? AND o.id_construtora=? FOR UPDATE',[photo,req.acesso.idconstrutora]);
    const f=rows[0];if(!f)fail(404,'Foto não encontrada.');
    const office=String(req.acesso.ambiente||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()==='escritorio';
    if(f.usuario_id!==req.acesso.id_usuario&&!office)fail(403,'Somente o autor ou o Escritório pode retirar a foto.');
    if(f.excluido_em)fail(409,'Foto já retirada. Atualize a galeria.');
    await c.query('UPDATE foto_obra SET excluido_em=NOW(),excluido_por=? WHERE id_foto=?',[req.acesso.id_usuario,photo]);
    await c.query("INSERT INTO foto_historico(foto_id,usuario_id,acao,descricao) VALUES (?,?,'Excluida',?)",[photo,req.acesso.id_usuario,reason]);
    return {id_foto:photo,message:'Foto retirada da galeria. Arquivo e histórico preservados para auditoria.'};
  });res.json(result.result);
}));
module.exports=router;
