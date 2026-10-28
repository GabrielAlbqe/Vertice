const db = require('../config/connection');
const { error } = require('../config/inteligenciaOperacional');
const { temOcorrencia } = require('../services/inteligenciaOperacional');
const query = (sql, params = []) => new Promise((resolve, reject) => db.query(sql, params, (err, rows) => err ? reject(err) : resolve(rows)));
const LIMIT = 50000;
async function usuario(id) {
  const rows = await query('SELECT u.id_usuario,u.idconstrutora,u.status,u.ocupacao,u.ambiente,c.status AS status_construtora FROM usuario u JOIN construtora c ON c.id_construtora=u.idconstrutora WHERE u.id_usuario=?', [id]);
  return rows[0];
}
async function obra(id, tenant) {
  const rows = await query('SELECT id_obra,nome FROM obra WHERE id_obra=? AND id_construtora=?', [id, tenant]);
  if (!rows.length) throw error(404, 'Obra não encontrada ou não autorizada.');
  return rows[0];
}
function conditions(f, alias) {
  const clauses = [], params = [];
  for (const [field, op] of [['inicio', '>='], ['fim', '<=']]) if (f[field]) { clauses.push(alias + '.data' + op + '?'); params.push(f[field]); }
  for (const field of ['turno', 'clima']) if (f[field]) { clauses.push('COALESCE(' + alias + '.' + field + ", 'Não informado')=?"); params.push(f[field]); }
  return { clauses, params };
}
async function dados(f, tenant) {
  const diary = f.fonte === 'diario';
  const base = diary ?
    "SELECT CONCAT('diario:',d.id_diario) id_registro,d.obrax_id id_obra,d.data,d.turno,d.clima FROM diario_obra d JOIN obra o ON o.id_obra=d.obrax_id WHERE o.id_construtora=? AND o.id_obra=?" :
    "SELECT CONCAT('rdo:',r.id_rdo) id_registro,r.id_obra,r.data_rdo data,r.turno,r.clima FROM rdo r JOIN obra o ON o.id_obra=r.id_obra WHERE o.id_construtora=? AND o.id_obra=?";
  const c = conditions(f, 'b');
  const registros = await query('SELECT b.* FROM (' + base + ') b' + (c.clauses.length ? ' WHERE ' + c.clauses.join(' AND ') : '') + ' ORDER BY b.data,b.id_registro LIMIT 50001', [tenant, f.id_obra, ...c.params]);
  let sources;
  if (diary) sources = [
    "SELECT CONCAT('diario-atraso:',d.id_diario) id,CONCAT('diario:',d.id_diario) id_registro,d.obrax_id id_obra,d.data,d.turno,d.clima,CASE WHEN d.etapa_atuacao='Acabamentos' THEN 'Acabamento' ELSE COALESCE(d.etapa_atuacao,'Não informado') END etapa,'atraso' tipo,COALESCE(NULLIF(TRIM(d.origem_atrasos),''),'Não informada') origem,NULL duracao,d.atrasos descricao FROM diario_obra d JOIN obra o ON o.id_obra=d.obrax_id WHERE o.id_construtora=? AND o.id_obra=? AND d.atrasos IS NOT NULL",
    "SELECT CONCAT('diario-paralisacao:',d.id_diario) id,CONCAT('diario:',d.id_diario) id_registro,d.obrax_id id_obra,d.data,d.turno,d.clima,CASE WHEN d.etapa_atuacao='Acabamentos' THEN 'Acabamento' ELSE COALESCE(d.etapa_atuacao,'Não informado') END etapa,'paralisacao' tipo,COALESCE(NULLIF(TRIM(d.origem_paralisacoes),''),'Não informada') origem,NULL duracao,d.paralisacoes descricao FROM diario_obra d JOIN obra o ON o.id_obra=d.obrax_id WHERE o.id_construtora=? AND o.id_obra=? AND d.paralisacoes IS NOT NULL"
  ];
  else sources = [
    "SELECT CONCAT('atraso:',a.id_atraso) id,CONCAT('rdo:',r.id_rdo) id_registro,r.id_obra,r.data_rdo data,r.turno,r.clima,a.etapa,'atraso' tipo,a.origem_atraso origem,a.duracao,a.descricao FROM atraso a JOIN rdo r ON r.id_rdo=a.id_rdo JOIN obra o ON o.id_obra=r.id_obra WHERE o.id_construtora=? AND o.id_obra=?",
    "SELECT CONCAT('paralisacao:',a.id_paralisacao) id,CONCAT('rdo:',r.id_rdo) id_registro,r.id_obra,r.data_rdo data,r.turno,r.clima,a.etapa,'paralisacao' tipo,a.origem_paralisacao origem,a.duracao,a.descricao FROM paralisacao a JOIN rdo r ON r.id_rdo=a.id_rdo JOIN obra o ON o.id_obra=r.id_obra WHERE o.id_construtora=? AND o.id_obra=?"
  ];
  const ec = conditions(f, 'ev');
  for (const field of ['etapa', 'tipo']) if (f[field]) { ec.clauses.push('ev.' + field + '=?'); ec.params.push(f[field]); }
  for (const [field, type] of [['origem_atraso', 'atraso'], ['origem_paralisacao', 'paralisacao']]) if (f[field]) {
    ec.clauses.push('ev.tipo=? AND ev.origem=?'); ec.params.push(type, f[field]);
  }
  const events = await query('SELECT ev.* FROM (' + sources.join(' UNION ALL ') + ') ev' + (ec.clauses.length ? ' WHERE ' + ec.clauses.join(' AND ') : '') + ' ORDER BY ev.data,ev.id LIMIT 50001',
    [tenant, f.id_obra, tenant, f.id_obra, ...ec.params]);
  if (registros.length > LIMIT || events.length > LIMIT) throw error(422, 'Muitos registros. Reduza o período da análise.');
  // Structured RDO occurrences exist even when descricao is empty.
  return { registros, ocorrencias: events.filter(e => !diary || temOcorrencia(e.descricao)).map(e => ({ ...e,
    turno: e.turno || 'Não informado', clima: e.clima || 'Não informado',
    descricao: diary ? e.descricao : e.descricao || 'Ocorrência estruturada' })) };
}
async function filtros(f, tenant) {
  const obras = await query('SELECT id_obra,nome FROM obra WHERE id_construtora=? ORDER BY nome,id_obra', [tenant]);
  if (f.id_obra) await obra(f.id_obra, tenant);
  const recursos = {};
  for (const [key, table, pk, name] of [['equipes', 'cadastro_de_equipes', 'id_cadastro_equipes', 'nome_equipe'],
    ['maquinarios', 'cadastro_de_maquinario', 'id_maquina', 'nome'], ['insumos', 'cadastro_de_insumos', 'id_insumos', 'nome']]) {
    recursos[key] = await query('SELECT ' + pk + ' id,' + name + ' nome FROM ' + table + ' WHERE id_construtora=?' +
      (f.id_obra ? ' AND (idobra=? OR idobra IS NULL)' : '') + ' ORDER BY ' + pk, f.id_obra ? [tenant, f.id_obra] : [tenant]);
  }
  const origens = { atraso: [], paralisacao: [] };
  if(f.id_obra) {
    for(const [type,table,origin,text] of (f.fonte==='diario' ? [['atraso','diario_obra','origem_atrasos','atrasos'],['paralisacao','diario_obra','origem_paralisacoes','paralisacoes']] : [['atraso','atraso','origem_atraso',null],['paralisacao','paralisacao','origem_paralisacao',null]])) {
      const joins=f.fonte==='diario' ? 'JOIN obra o ON o.id_obra=t.obrax_id' : 'JOIN rdo r ON r.id_rdo=t.id_rdo JOIN obra o ON o.id_obra=r.id_obra';
      const rows=await query("SELECT DISTINCT COALESCE(NULLIF(TRIM(t."+origin+"),''),'Não informada') origem FROM "+table+' t '+joins+' WHERE o.id_construtora=? AND o.id_obra=?'+(text?' AND t.'+text+" IS NOT NULL AND TRIM(t."+text+")<>''":'')+' ORDER BY origem',[tenant,f.id_obra]);
      origens[type]=rows.map(r=>r.origem);
    }
  }
  return { obras, recursos, origens };
}
module.exports = { usuario, obra, dados, filtros };
