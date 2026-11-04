const router=require('express').Router();
const {pool,wrap,id,text,fail,write}=require('../utils/operacional');
const {office,version,payload}=require('../utils/profissionais');
const schema=require('../utils/schemaReadiness');
const availability=require('../utils/equipesDisponibilidade');
router.get('/estado',wrap(async(req,res)=>{
 const state=(await schema.inspectSchema(pool,['pessoas'])).pessoas;
 res.json({habilitado:state.ready,pode_editar:office(req.acesso),migrations:state.migrations,historico_habilitado:state.ready&&await require('../utils/auditoria').disponivel(pool)});
}));
router.use(wrap(async(req,res,next)=>{
 if(!['GET','HEAD'].includes(req.method)&&!office(req.acesso))fail(403,'Somente o Escritório pode administrar profissionais.');
 await schema.requireSchema(pool,'pessoas');next();
}));
async function list(req,target){
 const ready=await availability.enabled(),args=[req.acesso.idconstrutora],conditions=['p.id_construtora=?'];
 const allowed=new Set(['busca','nome','codigo','cargo','equipe_id','terceirizada_id','sem_equipe','situacao','obra_id']);
 for(const key of Object.keys(req.query))if(!allowed.has(key))fail(400,'Filtro de profissional desconhecido: '+key+'.');
 if(target){conditions.push('p.id_profissional=?');args.push(id(target));}
 for(const field of ['nome','codigo','cargo'])if(req.query[field]){conditions.push('LOCATE(?,p.'+field+')>0');args.push(text(req.query[field],field==='codigo'?50:field==='nome'?150:100));}
 if(req.query.busca){conditions.push("LOCATE(?,CONCAT_WS(' ',p.nome,p.codigo,p.cargo,e.nome_equipe,t.nome_equipe))>0");args.push(text(req.query.busca,250));}
 for(const field of ['equipe_id','terceirizada_id'])if(req.query[field]){conditions.push('p.'+field+'=?');args.push(id(req.query[field]));}
 if(req.query.equipe_id&&req.query.terceirizada_id)fail(400,'Selecione uma equipe por consulta.');
 if(req.query.sem_equipe!==undefined){
  if(req.query.sem_equipe!=='true'||req.query.equipe_id||req.query.terceirizada_id)fail(400,'Filtro de equipe incompatível.');
  conditions.push('p.equipe_id IS NULL AND p.terceirizada_id IS NULL');
 }
 if(req.query.situacao){if(!['ativo','inativo'].includes(req.query.situacao))fail(400,'Situação de profissional inválida.');conditions.push('p.ativo=?');args.push(req.query.situacao==='ativo');}
 if(req.query.obra_id){conditions.push('o.id_obra=?');args.push(id(req.query.obra_id));}
 const owner=(alias,kind,column)=>ready?availability.owner(availability.type(kind),alias):alias+'.'+column+' IN (SELECT id_obra FROM obra WHERE id_construtora=p.id_construtora)';
 const own=ready?owner('e','propria','idobra')+'=p.id_construtora':owner('e','propria','idobra');
 const external=ready?owner('t','terceirizada','id_obra')+'=p.id_construtora':owner('t','terceirizada','id_obra');
 const [rows]=await pool.query(
  'SELECT p.*,COALESCE(e.nome_equipe,t.nome_equipe) equipe,COALESCE(e.idobra,t.id_obra) id_obra,o.nome obra_nome FROM profissional p '+
  'LEFT JOIN cadastro_de_equipes e ON e.id_cadastro_equipes=p.equipe_id AND ('+own+') '+
  'LEFT JOIN cadastro_de_equipes_terceirizadas t ON t.id_equipe_terceirizada=p.terceirizada_id AND ('+external+') '+
  'LEFT JOIN obra o ON o.id_obra=COALESCE(e.idobra,t.id_obra) AND o.id_construtora=p.id_construtora WHERE '+conditions.join(' AND ')+' ORDER BY p.nome,p.id_profissional',args);
 return rows.map(row=>({...row,ativo:Boolean(Number(row.ativo)),versao:version(row)}));
}
router.get('/',wrap(async(req,res)=>res.json(await list(req))));
router.get('/:id',wrap(async(req,res)=>{const rows=await list(req,req.params.id);if(!rows.length)fail(404,'Profissional não encontrado.');res.json(rows[0]);}));
async function save(req,res){
 const b=payload(req.body),own=b.equipe_id,external=b.terceirizada_id;
 const result=await write(req,async c=>{
  const current=req.params.id?(await c.query('SELECT * FROM profissional WHERE id_profissional=? AND id_construtora=? FOR UPDATE',[id(req.params.id),req.acesso.idconstrutora]))[0][0]:null;
  if(req.params.id&&!current)fail(404,'Profissional não encontrado.');
  if(current&&req.body.versao!==undefined&&req.body.versao!==version(current))fail(409,'Este profissional foi alterado em outra sessão. Atualize a listagem e revise a edição.');
  if(own||external){
   const ready=await availability.enabled(c),t=availability.type(own?'propria':'terceirizada');
   const sameTeam=current&&Number(own?current.equipe_id:current.terceirizada_id)===Number(own||external);
   const sql=ready?'SELECT e.'+t.pk+' FROM '+t.table+' e WHERE e.'+t.pk+'=? AND '+availability.owner(t)+'=?'+(sameTeam?'':' AND e.ativo=1')+' FOR UPDATE':
    'SELECT e.'+t.pk+' FROM '+t.table+' e JOIN obra o ON o.id_obra=e.'+t.work+' WHERE e.'+t.pk+'=? AND o.id_construtora=? FOR UPDATE';
   if(!(await c.query(sql,[own||external,req.acesso.idconstrutora]))[0].length)fail(403,'Equipe inexistente, inativa ou de outra construtora.');
  }
  try{
   if(current){
    await c.query('UPDATE profissional SET codigo=?,nome=?,cargo=?,equipe_id=?,terceirizada_id=?,ativo=? WHERE id_profissional=? AND id_construtora=?',[b.codigo,b.nome,b.cargo,own,external,b.ativo,current.id_profissional,req.acesso.idconstrutora]);
    return {insertId:current.id_profissional,message:'Profissional atualizado com sucesso.'};
   }
   const [row]=await c.query('INSERT INTO profissional(id_construtora,codigo,nome,cargo,equipe_id,terceirizada_id,ativo) VALUES (?,?,?,?,?,?,?)',[req.acesso.idconstrutora,b.codigo,b.nome,b.cargo,own,external,b.ativo]);
   return {insertId:row.insertId,message:'Profissional cadastrado com sucesso.'};
  }catch(e){if(e.code==='ER_DUP_ENTRY')fail(409,'Código de profissional já cadastrado nesta construtora.');throw e;}
 });
 res.status(result.repeated?200:201).json(result.result);
}
router.post('/',wrap(save));router.put('/:id',wrap(save));
module.exports=router;
