const bd = require('../config/connection');
const resources = require('../config/recursos');
const schema = require('../config/schema.json');
const { validar, idValido } = require('../utils/validar');
const query = (sql, params=[]) => new Promise((resolve,reject) => bd.query(sql,params,(err,rows)=>err?reject(err):resolve(rows)));
const fail = (status,message) => Object.assign(new Error(message), { status });
const managers = new Set(['gerencia','gerente','administrador','administradora','admin']);
const isManager = user => managers.has(String(user.ocupacao || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase());
function select(key) {
  const [table,pk,tenant,work,joins=''] = resources[key];
  return { table, pk, tenant, work, from: table + ' t ' + joins };
}
async function owned(key,id,tenant) {
  if (!idValido(id)) throw fail(400,'Identificador inválido.');
  const s = select(key);
  const rows = await query('SELECT t.*, ' + s.work + ' AS __obra FROM ' + s.from + ' WHERE t.' + s.pk + '=?' + (s.tenant ? ' AND '+s.tenant+'=?' : ''),s.tenant?[id,tenant]:[id]);
  if(!rows.length) throw fail(404,'Registro não encontrado ou não autorizado.');
  return rows[0];
}
const references = {
 id_obra:'obras',idobra:'obras',idx_obra:'obras',obrax_id:'obras',obra_idxx:'obras',
 id_etapa:'etapas',id_rdo:'rdo',id_insumo:'insumos',id_atividade:'atividades-eap',id_atividade_eap:'atividades-eap',atividade_eap_id:'atividades-eap',
 id_diario:'diarios-obra',diario_id:'diarios-obra',id_equipe:'equipes',id_maquinario:'maquinarios',id_usuario:'usuarios',usuario_id:'usuarios',
};
async function authorize(req,res,next) {
  const parts = req.path.replace(/\/+$/,'').toLowerCase().split('/');
  const key = parts[2];
  if(!resources[key]) return next();
  const s=select(key), writing=!['GET','HEAD','OPTIONS'].includes(req.method);
  const users=await query('SELECT id_usuario,idconstrutora,status,ocupacao FROM usuario WHERE id_usuario=?',[req.usuario.id_usuario]);
  const user=users[0];
  if(!user || user.status!=='Ativo') throw fail(403,'Usuário sem acesso ativo.');
  if(!idValido(user.idconstrutora) || Number(user.idconstrutora)!==Number(req.usuario.idconstrutora)) throw fail(403,'Construtora não autorizada. Faça login novamente.');
  const companies=await query('SELECT status FROM construtora WHERE id_construtora=?',[user.idconstrutora]);
  if(!companies.length || companies[0].status!=='Ativo')throw fail(403,'Construtora sem acesso ativo.');
  req.idConstrutora=Number(user.idconstrutora); req.usuarioAtual=user;
  if(writing && key==='cargos')throw fail(403,'Catálogo global de cargos exige provisionamento administrativo.');
  const operational = new Set(['rdo','rdo-equipes','rdo-maquinarios','consumos-insumos','diarios-obra','apontamentos-fisicos','atrasos','paralisacoes','registro-relatorios']);
  const siteRole = ['operacional','engenheiro','engenheira','mestre de obras'].includes(String(user.ocupacao || '').trim().toLowerCase());
  const ownProfile = key === 'usuarios' && req.method === 'PUT' && Number(parts[4]) === Number(user.id_usuario) && Object.keys(req.body || {}).every(f => ['nome','email','senha'].includes(f));
  if(writing && !isManager(user) && !(siteRole && operational.has(key)) && !ownProfile) throw fail(403,'Perfil sem permissão para alterar estes registros.');
  if (writing && key==='construtoras' && req.method==='POST') throw fail(403,'Criação de novas construtoras exige provisionamento administrativo.');
  if (writing) await query('SELECT id_construtora FROM construtora WHERE id_construtora=? FOR UPDATE',[req.idConstrutora]);
  let current;
  if(parts.length>3) {
    const id=parts[3]==='insert'||parts[3]==='del'?parts[4]:parts[3];
    if(id) {
      try { current=await owned(key,id,req.idConstrutora); }
      catch(err) {
        if(err.status!==404 || key!=='usuarios' || req.method!=='PUT' || !isManager(user))throw err;
        const pending=await query("SELECT * FROM usuario WHERE id_usuario=? AND idconstrutora IS NULL AND status='Inativo'",[id]);
        if(!pending.length)throw err;
        current=pending[0];
      }
    }
  }
  if(!writing && !current && parts.length===3) {
    const conditions=s.tenant?[s.tenant+'=?']:[];const params=s.tenant?[req.idConstrutora]:[];
    const filters = {...req.query};
    if(key==='obras' && filters.idconstrutora!==undefined)filters.id_construtora=filters.idconstrutora;
    if(key==='atividades-eap' && filters.id_obra!==undefined)filters.idx_obra=filters.id_obra;
    if(key==='diarios-obra' && filters.id_obra!==undefined)filters.obrax_id=filters.id_obra;
    const required=require('../config/filtros')[key];
    if(required && !required.some(col=>idValido(filters[col] ?? req.headers[col.replace(/_/g,'-')])))throw fail(400,'Informe o filtro obrigatório: '+required.join(' ou ')+'.');
    for(const col of Object.keys(schema[s.table])) {
      const value=filters[col] ?? req.headers[col.replace(/_/g,'-')];
      if(value===undefined || value==='')continue;
      if(col==='idobra' && value==='null'){conditions.push('t.idobra IS NULL');continue;}
      if(typeof value!=='string' && typeof value!=='number')throw fail(400,'Filtro inválido.');
      if((col.startsWith('id')||col.endsWith('_id'))&&!idValido(value))throw fail(400,'Filtro inválido.');
      conditions.push('t.'+col+'=?');params.push(value);
    }
    const columns=key==='usuarios'?Object.keys(schema.usuario).filter(c=>c!=='senha').map(c=>'t.'+c).join(','):'t.*';
    const rows=await query('SELECT '+columns+' FROM '+s.from+(conditions.length?' WHERE '+conditions.join(' AND '):'')+' ORDER BY t.'+s.pk+' DESC',params);
    return res.json(rows);
  }
  if(writing && req.method!=='DELETE') {
    if(!req.body || Array.isArray(req.body) || typeof req.body!=='object')throw fail(400,'Corpo JSON inválido.');
    const input=req.body;
    if(!['equipes','insumos','maquinarios'].includes(key) && input.id_construtora!==undefined && Number(input.id_construtora)!==req.idConstrutora)throw fail(403,'Construtora não autorizada.');
    if(input.idconstrutora!==undefined && Number(input.idconstrutora)!==req.idConstrutora)throw fail(403,'Construtora não autorizada.');
    const body={...(current||{}),...input};delete body.__obra;
    if(key==='usuarios' && !Object.hasOwn(input,'senha'))delete body.senha;
    for(const [field,definition] of Object.entries(schema[s.table])) {
      if(!Object.hasOwn(input,field) && body[field]!==null && body[field]!==undefined && /^(int|decimal|float)/.test(definition))body[field]=Number(body[field]);
    }
    if(Object.hasOwn(body,'idobra') && body.idobra==='')body.idobra=null;
    if(key==='atividades-eap' && input.id_obra!==undefined)body.idx_obra=input.id_obra;
    if(key==='diarios-obra' && Object.hasOwn(input,'id_obra'))body.obrax_id=input.id_obra;
    if(['equipes','insumos','maquinarios'].includes(key))body.id_construtora=req.idConstrutora;
    if(key==='obras')body.id_construtora=req.idConstrutora;
    if(key==='usuarios')body.idconstrutora=req.idConstrutora;
    if(key==='projecoes-financeiras' && body.etapa==='Nenhum')body.etapa=null;
    const error=validar(s.table,body,req.method==='POST');
    if(error)throw fail(400,error);
    const works=new Set();
    for(const [field,target] of Object.entries(references)) {
      if(!Object.hasOwn(schema[s.table],field) || field===s.pk || body[field]===undefined || body[field]===null)continue;
      if(field==='idobra' && (body[field]==='' || body[field]===0 || body[field]==='0')){body[field]=null;continue;}
      const ref=await owned(target,body[field],req.idConstrutora);
      if(ref.__obra!==null && ref.__obra!==undefined)works.add(Number(ref.__obra));
      if(['insumos','equipes','maquinarios'].includes(target) && !ref.__obra && ['consumos-insumos','apropriacoes','rdo-equipes','rdo-maquinarios'].includes(key))throw fail(400,'Recurso deve estar vinculado à obra.');
    }
    if(works.size>1)throw fail(400,'Os relacionamentos devem pertencer à mesma obra.');
    if(key==='custos-realizados') {
      const target={'Equipe':'equipes','Insumo':'insumos','Maquinário':'maquinarios'}[body.origem_custo];
      if(!target)throw fail(400,'Origem inválida.');
      const origin=await owned(target,body.id_origem,req.idConstrutora);
      if(Number(origin.__obra)!==Number(body.id_obra))throw fail(400,'Origem do custo incompatível com a obra.');
    }
    if(key==='apontamentos-fisicos') {
      const [progress]=await query('SELECT COALESCE(SUM(percentual_dia),0) total FROM apontamento_fisico WHERE atividade_eap_id=? AND id_apontamento<>?',[body.atividade_eap_id,current?current.id_apontamento:0]);
      if(Number(progress.total)+Number(body.percentual_dia)>100)throw fail(400,'Progresso acumulado da atividade excede 100%.');
    }
    if(key==='rdo-maquinarios') {
      const machine=await owned('maquinarios',body.id_maquinario,req.idConstrutora);
      if(machine.status!=='Ativo'||Number(body.quantidade_utilizada)>Number(machine.quantidade))throw fail(400,'Maquinário inativo ou quantidade indisponível.');
    }
    if(key==='insumos' && current && body.quantidade_disponivel!==undefined) {
      const [a]=await query('SELECT COALESCE(SUM(quantidade_consumida),0) total FROM apropriacao WHERE id_insumo=?',[current.id_insumos]);
      const [c]=await query('SELECT COALESCE(SUM(quantidade_consumida),0) total FROM consumo_insumo WHERE id_insumo=?',[current.id_insumos]);
      if(Number(body.quantidade_disponivel)<Number(a.total)+Number(c.total))throw fail(400,'Estoque não pode ser inferior ao consumo registrado.');
    }
    if(key==='consumos-insumos'||key==='apropriacoes') {
      const supply=await owned('insumos',body.id_insumo,req.idConstrutora);
      const [a]=await query('SELECT COALESCE(SUM(quantidade_consumida),0) total FROM apropriacao WHERE id_insumo=? AND id_apropriacao<>?',[body.id_insumo,key==='apropriacoes'&&current?current.id_apropriacao:0]);
      const [c]=await query('SELECT COALESCE(SUM(quantidade_consumida),0) total FROM consumo_insumo WHERE id_insumo=? AND id_consumo<>?',[body.id_insumo,key==='consumos-insumos'&&current?current.id_consumo:0]);
      if(Number(a.total)+Number(c.total)+Number(body.quantidade_consumida)>Number(supply.quantidade_disponivel))throw fail(400,'Quantidade consumida excede o estoque cadastrado.');
    }
    req.body=body;
  }
  next();
}
module.exports = async (req,res,next) => {
  const writing=!['GET','HEAD','OPTIONS'].includes(req.method);
  if(!writing)return authorize(req,res,next).catch(next);
  let connection;
  try {
    connection=await new Promise((resolve,reject)=>bd.getConnection((err,c)=>err?reject(err):resolve(c)));
    await connection.promise().beginTransaction();
    let settled=false;
    const json=res.json.bind(res);
    const finish=async success=>{if(settled)return;settled=true;try{if(success)await connection.promise().commit();else await connection.promise().rollback();}finally{connection.release();}};
    res.once('close',()=>{if(!settled)finish(false).catch(()=>{});});
    res.json=function(body){finish(res.statusCode<400).then(()=>json(body),()=>{res.statusCode=500;json({message:'Erro ao confirmar operação.'});});return res;};
    bd.context.run(connection,()=>authorize(req,res,next).catch(next));
  }catch(err){if(connection){try{await connection.promise().rollback();}finally{connection.release();}}next(err);}
};
module.exports.owned=owned;
module.exports.isManager=isManager;
