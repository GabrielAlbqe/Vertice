// Read-only checks. Never creates tables or migrates an application database.
const definitions={
 pessoas:{5:{profissional:['id_profissional','id_construtora','codigo','nome','cargo','equipe_id','terceirizada_id','ativo']}},
 resumo:{2:{apropriacao_registro:['apropriacao_id','registrado_em'],ocorrencia_obra:['id_ocorrencia','obra_id','usuario_id','status','prioridade','registrado_em'],diario_equipe_presente:['diario_id','equipe_id'],diario_terceirizada_presente:['diario_id','equipe_id'],diario_maquinario_utilizado:['diario_id','maquinario_id']},3:{ocorrencia_obra:['classificacao','responsavel_id','prazo_previsto']}}
};
async function inspectSchema(pool,modules=Object.keys(definitions)){
 const tables=[...new Set(modules.flatMap(module=>Object.values(definitions[module]).flatMap(group=>Object.keys(group))))];
 const [rows]=await pool.query('SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME IN ('+tables.map(()=>'?').join(',')+')',tables);
 const present=new Set(rows.map(row=>row.TABLE_NAME+'.'+row.COLUMN_NAME));
 return Object.fromEntries(modules.map(module=>{const migrations=[],missing=[];for(const [migration,tables]of Object.entries(definitions[module])){let absent=false;for(const [table,columns]of Object.entries(tables))for(const column of columns)if(!present.has(table+'.'+column)){missing.push(table+'.'+column);absent=true;}if(absent)migrations.push(Number(migration));}return [module,{ready:!missing.length,migrations,missing}];}));
}
async function requireSchema(pool,module){
 const state=(await inspectSchema(pool,[module]))[module];
 if(!state.ready)throw Object.assign(new Error('Database update required'),{status:503,code:'SCHEMA_NOT_READY',module,migrations:state.migrations});
}
module.exports={inspectSchema,requireSchema};
