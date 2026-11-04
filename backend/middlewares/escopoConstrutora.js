const scoped=require('../config/scopedConnection');
const { context }=scoped;
const {pool,fail,id,errors}=require('../utils/operacional');
// Contratos existentes. As relações abaixo são do esquema real, sem novos vínculos.
const references={
  obras:{id_construtora:'construtora'},equipes:{idobra:'obra'},insumos:{idobra:'obra'},maquinarios:{idobra:'obra'},
  'equipes-terceirizadas':{id_obra:'obra'},'atividades-eap':{idx_obra:'obra'},'diarios-obra':{obrax_id:'obra',usuario_id:'usuario'},
  'apontamentos-fisicos':{diario_id:'diario_obra',atividade_eap_id:'atividade_eap'},apropriacoes:{id_insumo:'cadastro_de_insumos',id_atividade:'atividade_eap',id_usuario:'usuario'},
  'custos-planejados':{id_obra:'obra'},'custos-realizados':{id_obra:'obra',id_etapa:'etapa',id_rdo:'rdo'},etapas:{id_obra:'obra'},
  'historico-obras':{id_obra:'obra',usuario_id:'usuario'},'metricas-eva':{obra_idxx:'obra'},'projecoes-financeiras':{id_obra:'obra'},rdo:{id_obra:'obra'},
  'registro-relatorios':{id_obra:'obra',id_diario:'diario_obra'},'orcamentos-previstos':{id_atividade_eap:'atividade_eap'},
  'rdo-equipes':{id_rdo:'rdo',id_equipe:'cadastro_de_equipes'},'rdo-maquinarios':{id_rdo:'rdo',id_maquinario:'cadastro_de_maquinario'},
  atrasos:{id_rdo:'rdo'},paralisacoes:{id_rdo:'rdo'},'consumos-insumos':{id_rdo:'rdo',id_insumo:'cadastro_de_insumos'},
  'equipes-etapas':{id_equipe:'cadastro_de_equipes'},usuarios:{idconstrutora:'construtora'},
};
const entities={
  construtora:['id_construtora','id_construtora',null],usuario:['id_usuario','idconstrutora',null],obra:['id_obra','id_construtora','id_obra'],
  cadastro_de_equipes:['id_cadastro_equipes','idobra','obra'],cadastro_de_insumos:['id_insumos','idobra','obra'],cadastro_de_maquinario:['id_maquina','idobra','obra'],
  atividade_eap:['id_atividade','idx_obra','obra'],diario_obra:['id_diario','obrax_id','obra'],etapa:['id_etapa','id_obra','obra'],rdo:['id_rdo','id_obra','obra'],
};
async function reference(table,value,tenant) {
  const [pk,column,parent]=entities[table];
  const [rows]=await pool.query(`SELECT ${column} owner FROM ${table} WHERE ${pk}=?`,[id(value)]);
  if(!rows.length)fail(400,'Referência inexistente.');
  if(parent==='obra')return reference('obra',rows[0].owner,tenant);
  if(Number(rows[0].owner)!==Number(tenant))fail(403,'Referência de outra construtora.');
  return table==='obra'?id(value):null;
}
module.exports=async function escopo(req,res,next) {
  // Express aceita URLs sem distinguir maiúsculas: autorização usa a mesma regra.
  const resource=req.path.split('/')[2]?.toLowerCase();
  if(resource==='operacional')return next();
  if(resource==='health' || req.path==='/api/usuarios/login' || req.path==='/api/usuarios/reset-password' || req.path==='/api/usuarios/logout' || req.path==='/api/usuarios/session' || (req.method==='POST' && req.path==='/api/usuarios/insert' && process.env.REGISTRATION_MODE !== 'office' && !req.headers.authorization))return next();
  try {
    const [users]=await pool.query("SELECT id_usuario,idconstrutora,ambiente FROM usuario WHERE id_usuario=? AND status='Ativo'",[id(req.usuario?.id_usuario)]);
    const actor=users[0];if(!actor?.idconstrutora)fail(403,'Usuário sem acesso ativo à construtora.');
    req.acesso=actor;
    actor.equipesDisponibilidade=await require('../utils/equipesDisponibilidade').enabled();
    if (resource === 'cargos' && !['GET','HEAD'].includes(req.method)) fail(403,'O catálogo global de cargos não pode ser alterado pela API de construtoras.');
    if (resource === 'usuarios' && !['GET','HEAD'].includes(req.method)) {
      const office=String(actor.ambiente || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()==='escritorio';
      if (!office) {
        const ownProfile=req.method==='PUT' && Number(req.path.split('/').at(-1))===actor.id_usuario;
        const safeFields=Object.keys(req.body || {}).every(k=>['nome','email','senha','ocupacao'].includes(k));
        if(!ownProfile || !safeFields)fail(403,'Somente o Escritório pode administrar usuários da própria construtora.');
      }
    }
    if (resource!=='usuarios' && !['GET','HEAD'].includes(req.method)) {
      const office=String(actor.ambiente || '').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase()==='escritorio';
      if(!office)fail(403,'Somente o Escritório pode administrar estes recursos.');
    }
    if(['POST','PUT'].includes(req.method) && references[resource]) {
      let effective=req.body || {};
      if(req.method==='PUT') {
        // Valida também as referências mantidas numa edição parcial.
        const tableMap={obras:['obra','id_obra'],equipes:['cadastro_de_equipes','id_cadastro_equipes'],insumos:['cadastro_de_insumos','id_insumos'],maquinarios:['cadastro_de_maquinario','id_maquina'],'equipes-terceirizadas':['cadastro_de_equipes_terceirizadas','id_equipe_terceirizada'],'atividades-eap':['atividade_eap','id_atividade'],'diarios-obra':['diario_obra','id_diario'],'apontamentos-fisicos':['apontamento_fisico','id_apontamento'],apropriacoes:['apropriacao','id_apropriacao'],'custos-planejados':['custo_planejado','id_custo_planejado'],'custos-realizados':['custo_realizado','id_custo_realizado'],etapas:['etapa','id_etapa'],'historico-obras':['historico_obras','id_historico'],'metricas-eva':['metricas_eva','id_metrica'],'projecoes-financeiras':['projecao_financeira','id_projecao'],rdo:['rdo','id_rdo'],'registro-relatorios':['registro_relatorios','id_registro_relatorio'],'orcamentos-previstos':['orcamento_previsto','id_orcamento'],'rdo-equipes':['rdo_equipe','id_rdo_equipe'],'rdo-maquinarios':['rdo_maquinario','id_rdo_maquinario'],atrasos:['atraso','id_atraso'],paralisacoes:['paralisacao','id_paralisacao'],'consumos-insumos':['consumo_insumo','id_consumo'],'equipes-etapas':['equipe_etapa','id_equipe_etapa'],usuarios:['usuario','id_usuario']};
        const target=tableMap[resource];
        if(target){
          const rows=await context.run(actor,()=>new Promise((resolve,reject)=>scoped.query(`SELECT * FROM ${target[0]} WHERE ${target[1]}=?`,[id(req.path.split('/').at(-1))],(err,result)=>err?reject(err):resolve(result))));
          if(!rows.length)fail(404,'Registro não encontrado.');
          effective={...rows[0],...effective};
        }
      }
      const works=[];
      for(const [field,table] of Object.entries(references[resource])) {
        const value=effective[field];
        if(value!==null && value!==undefined && value!=='') { const work=await reference(table,value,actor.idconstrutora);if(work)works.push(work); }
      }
      if(new Set(works).size>1)fail(400,'Os recursos precisam pertencer à mesma obra.');
      if(resource==='custos-realizados' && effective.id_origem!=null){
        const origin={Insumo:'cadastro_de_insumos',Equipe:'cadastro_de_equipes',Maquinario:'cadastro_de_maquinario','Maquinário':'cadastro_de_maquinario'}[effective.origem_custo];
        if(!origin)fail(400,'Origem do custo inválida.');
        const work=await reference(origin,effective.id_origem,actor.idconstrutora);
        if(works.some(value=>value!==work))fail(400,'A origem do custo deve pertencer à mesma obra.');
      }
      if(resource==='diarios-obra' && req.method==='POST')req.body.usuario_id=actor.id_usuario;
      if(resource==='apropriacoes' && req.method==='POST')req.body.id_usuario=actor.id_usuario;
      if(resource==='historico-obras' && req.method==='POST')req.body.usuario_id=actor.id_usuario;
    }
    if(!['GET','HEAD'].includes(req.method))actor.auditoria={
      id:Number(req.path.split('/').at(-1))||null,
      evento:({POST:'Cadastro criado',PUT:'Cadastro atualizado',DELETE:'Cadastro excluído'})[req.method]||'Cadastro alterado',
      detalhes:Object.fromEntries(['status','ambiente','idobra','id_obra','id_equipe','id_construtora'].filter(k=>req.body?.[k]!==undefined).map(k=>[k,req.body[k]]))
    };
    context.run(actor,next);
  }catch(e){errors(e,req,res,next);}
};
