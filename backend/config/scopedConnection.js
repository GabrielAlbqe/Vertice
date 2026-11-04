const { AsyncLocalStorage } = require('async_hooks');
const connection = require('./connection');
const context = new AsyncLocalStorage();
const direct = column => `${column} IN (SELECT id_obra FROM obra WHERE id_construtora = ?)`;
const activity = column => `${column} IN (SELECT id_atividade FROM atividade_eap WHERE ${direct('idx_obra')})`;
const diary = column => `${column} IN (SELECT id_diario FROM diario_obra WHERE ${direct('obrax_id')})`;
const rdo = column => `${column} IN (SELECT id_rdo FROM rdo WHERE ${direct('id_obra')})`;
const scopes = {
  obra: 'id_construtora = ?', usuario: 'idconstrutora = ?', construtora: 'id_construtora = ?',
  cadastro_de_equipes:direct('idobra'),cadastro_de_insumos:direct('idobra'),cadastro_de_maquinario:direct('idobra'),
  cadastro_de_equipes_terceirizadas:direct('id_obra'),atividade_eap:direct('idx_obra'),diario_obra:direct('obrax_id'),
  apontamento_fisico:diary('diario_id'),apropriacao:activity('id_atividade'),
  custo_planejado:direct('id_obra'),custo_realizado:direct('id_obra'),etapa:direct('id_obra'),historico_obras:direct('id_obra'),
  metricas_eva:direct('obra_idxx'),projecao_financeira:direct('id_obra'),rdo:direct('id_obra'),registro_relatorios:direct('id_obra'),
  orcamento_previsto:activity('id_atividade_eap'),rdo_equipe:rdo('id_rdo'),rdo_maquinario:rdo('id_rdo'),atraso:rdo('id_rdo'),paralisacao:rdo('id_rdo'),consumo_insumo:rdo('id_rdo'),
  equipe_etapa:`id_equipe IN (SELECT id_cadastro_equipes FROM cadastro_de_equipes WHERE ${direct('idobra')})`,
};
function prepare(sql, values=[]) {
  const tenant=context.getStore();
  if (tenant && typeof sql === 'string' && /^\s*(SELECT|UPDATE|DELETE)\b/i.test(sql)) {
    const table=sql.match(/^\s*(?:SELECT[\s\S]*?\bFROM|UPDATE|DELETE\s+FROM)\s+`?(\w+)`?/i)?.[1];
    const teamWork=table==='cadastro_de_equipes'?'idobra':table==='cadastro_de_equipes_terceirizadas'?'id_obra':null;
    const condition=tenant.equipesDisponibilidade&&teamWork?`COALESCE(id_construtora,(SELECT id_construtora FROM obra WHERE obra.id_obra=${table}.${teamWork})) = ?`:scopes[table];
    if (condition) {
      const suffix=sql.search(/\b(?:ORDER\s+BY|LIMIT)\b/i);
      let body=suffix<0?sql:sql.slice(0,suffix),tail=suffix<0?'':sql.slice(suffix);
      body=body.trim().replace(/;$/,'');
      // Todos os SQLs dos models são consultas simples, sem aliases/UNION.
      sql=body+(/\bWHERE\b/i.test(body)?' AND ':' WHERE ')+`(${condition}) `+tail;
      values=[...(values || []),tenant.idconstrutora];
    }
  }
  return {sql,values:values || []};
}
function query(sql,values,callback){
  if(typeof values==='function'){callback=values;values=[];}
  const prepared=prepare(sql,values);
  const actor=context.getStore(),audit=require('../utils/auditoria');
  if(actor?.auditoria&&audit.recursoLegado(sql)&&typeof callback==='function'){
    (async()=>{
      const c=await connection.promise().getConnection();
      try{
        await c.beginTransaction();const [result,fields]=await c.query(prepared.sql,prepared.values);
        if(await audit.disponivel(c))await audit.registrarLegado(c,actor,sql,result);
        await c.commit();return {result,fields};
      }catch(e){try{await c.rollback();}catch{}throw e;}finally{c.release();}
    })().then(({result,fields})=>callback(null,result,fields),callback);
    return;
  }
  return connection.query(prepared.sql,prepared.values,callback);
}
module.exports={query,context,prepare};
