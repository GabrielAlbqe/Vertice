const router = require('express').Router();
const {pool, wrap, id, text, fail, write} = require('../utils/operacional');
function office(req) {
  if (String(req.acesso.ambiente).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase() !== 'escritorio') fail(403,'Somente o Escritório pode administrar profissionais.');
}
router.get('/', wrap(async (req,res) => {
  const [rows] = await pool.query(`SELECT p.*, COALESCE(e.nome_equipe,t.nome_equipe) equipe,
    COALESCE(e.idobra,t.id_obra) id_obra,o.nome obra_nome FROM profissional p
    LEFT JOIN cadastro_de_equipes e ON e.id_cadastro_equipes=p.equipe_id
    LEFT JOIN cadastro_de_equipes_terceirizadas t ON t.id_equipe_terceirizada=p.terceirizada_id
    LEFT JOIN obra o ON o.id_obra=COALESCE(e.idobra,t.id_obra) AND o.id_construtora=p.id_construtora
    WHERE p.id_construtora=? ORDER BY p.nome,p.id_profissional`,[req.acesso.idconstrutora]);
  res.json(rows);
}));
async function save(req,res) {
  office(req);
  const b=req.body, nome=text(b.nome,150), codigo=text(b.codigo,50), cargo=text(b.cargo,100);
  const own=b.equipe_id ? id(b.equipe_id) : null, external=b.terceirizada_id ? id(b.terceirizada_id) : null;
  if (own && external) fail(400,'Um profissional pode integrar somente uma equipe atual.');
  if (typeof b.ativo !== 'boolean') fail(400,'Situação inválida.');
  const result=await write(req,async c=>{
    const current=req.params.id?(await c.query('SELECT equipe_id,terceirizada_id FROM profissional WHERE id_profissional=? AND id_construtora=? FOR UPDATE',[id(req.params.id),req.acesso.idconstrutora]))[0][0]:null;
    if(req.params.id&&!current)fail(404,'Profissional não encontrado.');
    if (own || external) {
      const ready=await require('../utils/equipesDisponibilidade').enabled(c);
      const sql=own ? 'SELECT e.id_cadastro_equipes FROM cadastro_de_equipes e JOIN obra o ON o.id_obra=e.idobra WHERE e.id_cadastro_equipes=? AND o.id_construtora=? FOR UPDATE' : 'SELECT e.id_equipe_terceirizada FROM cadastro_de_equipes_terceirizadas e JOIN obra o ON o.id_obra=e.id_obra WHERE e.id_equipe_terceirizada=? AND o.id_construtora=? FOR UPDATE';
      const t=require('../utils/equipesDisponibilidade').type(own?'propria':'terceirizada');
      const sameTeam=current&&(own?current.equipe_id===own:current.terceirizada_id===external);
      const scopedSql=ready?`SELECT e.${t.pk} FROM ${t.table} e WHERE e.${t.pk}=? AND ${require('../utils/equipesDisponibilidade').owner(t)}=?${sameTeam?'':' AND e.ativo=1'} FOR UPDATE`:sql;
      if (!(await c.query(scopedSql,[own || external,req.acesso.idconstrutora]))[0].length) fail(403,'Equipe indisponível para esta construtora.');
    }
    if (req.params.id) {
      const target=id(req.params.id);
      try {await c.query('UPDATE profissional SET codigo=?,nome=?,cargo=?,equipe_id=?,terceirizada_id=?,ativo=? WHERE id_profissional=?',[codigo,nome,cargo,own,external,b.ativo,target]);}
      catch(e){if(e.code==='ER_DUP_ENTRY')fail(409,'Código de profissional já cadastrado nesta construtora.');throw e;}
      return {insertId:target};
    }
    try {
      const [r]=await c.query('INSERT INTO profissional(id_construtora,codigo,nome,cargo,equipe_id,terceirizada_id,ativo) VALUES (?,?,?,?,?,?,?)',[req.acesso.idconstrutora,codigo,nome,cargo,own,external,b.ativo]);
      return {insertId:r.insertId};
    } catch(e) {if(e.code==='ER_DUP_ENTRY') fail(409,'Código de profissional já cadastrado nesta construtora.');throw e;}
  });
  res.status(result.repeated?200:201).json(result.result);
}
router.post('/',wrap(save));
router.put('/:id',wrap(save));
module.exports=router;
