const router=require('express').Router();
const {pool,wrap,fail,id,text,number,date,option,obra,related,write}=require('../utils/operacional');
router.get('/',wrap(async(req,res)=>{
  const work=id(req.query.obra_id);await obra(pool,work,req.acesso);
  const extra=await require('../utils/auditoria').disponivel(pool);
  res.json((await pool.query(extra?'SELECT c.*,d.categoria,d.descricao FROM custo_realizado c LEFT JOIN custo_detalhe d ON d.custo_id=c.id_custo_realizado WHERE c.id_obra=? ORDER BY c.data DESC,c.id_custo_realizado DESC':'SELECT * FROM custo_realizado WHERE id_obra=? ORDER BY data DESC,id_custo_realizado DESC',[work]))[0]);
}));
router.post('/',wrap(async(req,res)=>{
  if(String(req.acesso.ambiente).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()!=='escritorio')fail(403,'Somente o Escritório pode confirmar despesas.');
  const b=req.body, work=id(b.id_obra),stage=id(b.id_etapa),sourceDiary=b.diario_id?id(b.diario_id):null,sourceRdo=b.id_rdo?id(b.id_rdo):null,origin=option(b.origem_custo,['Equipe','Insumo','Maquinário']),resource=id(b.id_origem),day=date(b.data),quantity=number(b.quantidade,99999999.99);
  if(Boolean(sourceDiary)===Boolean(sourceRdo))fail(400,'Selecione um RDO ou um Diário do Canteiro.');
  if(!['number','string'].includes(typeof b.custo_unitario)||String(b.custo_unitario).trim()===''||!Number.isFinite(Number(b.custo_unitario))||Number(b.custo_unitario)<0||Number(b.custo_unitario)>99999999.99)fail(400,'Custo unitário inválido.');
  const price=Number(b.custo_unitario);
  const details=b.categoria||b.descricao?{categoria:text(b.categoria,80).replace(/\s+/g,' '),descricao:text(b.descricao,500)}:null;
  if([quantity,price].some(v=>Math.abs(v*100-Math.round(v*100))>0.00001))fail(400,'Informe no máximo duas casas decimais.');
  if(quantity*price>9999999999.99)fail(400,'Valor total excede o limite.');
  const result=await write(req,async c=>{
    await obra(c,work,req.acesso,true);
    await related(c,'etapa','id_etapa',stage,'id_obra',work);
    let rdo=sourceRdo;
    if(sourceDiary){
      const diary=await related(c,'diario_obra','id_diario',sourceDiary,'obrax_id',work);
      if(String(diary.data instanceof Date?diary.data.toISOString():diary.data).slice(0,10)!==day)fail(400,'A data deve corresponder ao Diário selecionado.');
      const [matches]=await c.query('SELECT id_rdo FROM rdo WHERE id_obra=? AND data_rdo=? AND turno=? ORDER BY id_rdo LIMIT 1',[work,day,diary.turno]);
      rdo=matches[0]?.id_rdo;
      if(!rdo){const [created]=await c.query('INSERT INTO rdo(id_obra,data_rdo,turno,clima) VALUES (?,?,?,?)',[work,day,diary.turno,diary.clima]);rdo=created.insertId;}
    }
    const diary=await related(c,'rdo','id_rdo',rdo,'id_obra',work);
    if(String(diary.data_rdo instanceof Date ? diary.data_rdo.toISOString() : diary.data_rdo).slice(0,10)!==day)fail(400,'A data deve corresponder ao RDO selecionado.');
    const [table,pk]=origin==='Equipe'?['cadastro_de_equipes','id_cadastro_equipes']:origin==='Insumo'?['cadastro_de_insumos','id_insumos']:['cadastro_de_maquinario','id_maquina'];
    await related(c,table,pk,resource,'idobra',work);
    const [existing]=await c.query('SELECT id_custo_realizado FROM custo_realizado WHERE id_obra=? AND id_rdo=? AND id_etapa=? AND origem_custo=? AND id_origem=? AND data=? AND quantidade=? AND custo_unitario=?',[work,rdo,stage,origin,resource,day,quantity,price]);
    if(existing.length)fail(409,'Já existe um lançamento idêntico. Consulte o histórico.');
    const [r]=await c.query('INSERT INTO custo_realizado(id_obra,id_etapa,id_rdo,origem_custo,id_origem,data,quantidade,custo_unitario) VALUES (?,?,?,?,?,?,?,?)',[work,stage,rdo,origin,resource,day,quantity,price]);
    if(details)await c.query('INSERT INTO custo_detalhe(custo_id,categoria,descricao) VALUES (?,?,?)',[r.insertId,details.categoria,details.descricao]);
    return {insertId:r.insertId};
  });res.status(result.repeated?200:201).json(result.result);
}));
module.exports=router;
