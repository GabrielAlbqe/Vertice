const { idValido, dataValida } = require('../utils/validar');
const ETAPAS = ['Mobilização', 'Infraestrutura', 'Supraestrutura e Alvenaria', 'Instalações', 'Revestimentos', 'Acabamento'];
const TURNOS = ['Manhã', 'Tarde', 'Noite', 'Integral', 'Não informado'];
const CLIMAS = ['Ensolarado', 'Nublado', 'Chuvoso', 'Impraticável', 'Não informado'];
const RECURSOS = ['id_equipe', 'id_maquinario', 'id_insumo'];
const error = (status, message) => Object.assign(new Error(message), { status });
function validarFiltros(query, exigirObra = true) {
  const allowed = new Set(['id_obra', 'fonte', 'inicio', 'fim', 'etapa', 'turno', 'clima', 'origem_atraso', 'origem_paralisacao', 'tipo', 'agrupamento', ...RECURSOS]);
  const f = { fonte: 'diario', agrupamento: 'dia' };
  for (const [key, value] of Object.entries(query)) {
    if (!allowed.has(key)) throw error(400, 'Filtro desconhecido: ' + key + '.');
    if (typeof value !== 'string') throw error(400, 'Informe um único valor para ' + key + '.');
    if (value !== '') f[key] = value;
  }
  if ((exigirObra || f.id_obra !== undefined) && !idValido(f.id_obra)) throw error(400, 'Selecione uma obra válida.');
  if (!['diario', 'rdo'].includes(f.fonte)) throw error(400, 'Fonte inválida.');
  if (!['dia', 'semana', 'mes'].includes(f.agrupamento)) throw error(400, 'Agrupamento inválido.');
  for (const key of ['inicio', 'fim']) if (f[key] && !dataValida(f[key])) throw error(400, 'Data inválida: ' + key + '.');
  if (f.inicio && f.fim && f.inicio > f.fim) throw error(400, 'A data final deve ser igual ou posterior à inicial.');
  for (const [key, values] of [['etapa', ETAPAS], ['turno', TURNOS], ['clima', CLIMAS], ['tipo', ['atraso', 'paralisacao']]]) {
    if (f[key] && !values.includes(f[key])) throw error(400, 'Valor inválido para ' + key + '.');
  }
  for (const key of ['origem_atraso', 'origem_paralisacao']) if (f[key] && f[key].length > 255) throw error(400, 'Origem inválida.');
  if (f.origem_atraso && f.origem_paralisacao) throw error(400, 'Selecione uma origem de ocorrência por análise.');
  if ((f.tipo === 'atraso' && f.origem_paralisacao) || (f.tipo === 'paralisacao' && f.origem_atraso)) throw error(400, 'O tipo e a origem selecionados são incompatíveis.');
  for (const key of RECURSOS) if (f[key]) {
    if (!idValido(f[key])) throw error(400, 'Identificador de recurso inválido.');
    throw error(422, 'Filtro por recurso indisponível: o banco não registra vínculo direto entre a ocorrência e o recurso.');
  }
  if (f.id_obra) f.id_obra = Number(f.id_obra);
  return f;
}
module.exports = { ETAPAS, TURNOS, CLIMAS, RECURSOS, validarFiltros, error };
