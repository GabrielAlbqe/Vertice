const schema = require('../config/schema.json');
const idValido = value => (typeof value === 'string' || typeof value === 'number') && /^\d+$/.test(String(value)) && Number.isSafeInteger(Number(value)) && Number(value) > 0;
function dataValida(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + 'T00:00:00Z');
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}
function validar(table, body, creating) {
  for (const [field, definition] of Object.entries(schema[table])) {
    if (/GENERATED|AUTO_INCREMENT/.test(definition)) continue;
    const value = body[field];
    if (value === undefined) {
      if (creating && /NOT NULL/.test(definition) && !/DEFAULT/.test(definition)) return field + ' é obrigatório.';
      continue;
    }
    if (value === null) {
      if (/NOT NULL/.test(definition)) return field + ' não pode ser nulo.';
      continue;
    }
    if (/^(?:int|decimal|float)/.test(definition)) {
      if (!['number','string'].includes(typeof value) || String(value).trim() === '' || !Number.isFinite(Number(value))) return field + ' deve ser numérico.';
      const n = Number(value);
      if (n < 0 && !field.startsWith('desvio_')) return field + ' deve ser positivo ou zero.';
      if (/^int/.test(definition) && (!Number.isSafeInteger(n) || n > 2147483647)) return field + ' deve ser inteiro válido.';
      const decimal = definition.match(/^decimal\((\d+),(\d+)\)/);
      if (decimal) {
        const scale = 10 ** Number(decimal[2]);
        if (Math.abs(n) >= 10 ** (Number(decimal[1]) - Number(decimal[2])) || Math.abs(n * scale - Math.round(n * scale)) > 0.00001) return field + ' excede a precisão permitida.';
      }
    }
    if (/^(?:date |date$)/.test(definition) && !dataValida(value)) return field + ' deve ser uma data válida AAAA-MM-DD.';
    if (/^(?:datetime|timestamp)/.test(definition) && (typeof value !== 'string' || !dataValida(value.slice(0,10)) || !/^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}:\d{2}$/.test(value) || Number(value.slice(11,13)) > 23 || Number(value.slice(14,16)) > 59 || Number(value.slice(17,19)) > 59)) return field + ' deve conter data e horário válidos.';
    const enumeration = definition.match(/^enum\((.*?)\)/);
    if (enumeration && ![...enumeration[1].matchAll(/'([^']*)'/g)].map(m=>m[1]).includes(value)) return field + ' inválido.';
    const text = definition.match(/^varchar\((\d+)\)/);
    if (/^(?:varchar|text)/.test(definition) && (typeof value !== 'string' || (text && [...value].length > Number(text[1])) || (/NOT NULL/.test(definition) && !value.trim()))) return field + ' inválido.';
  }
  for (const field of ['quantidade_consumida','quantidade_utilizada','tempo_utilizacao','dias_atuacao','duracao']) if (body[field] !== undefined && Number(body[field]) <= 0) return field + ' deve ser maior que zero.';
  if (body.percentual_dia !== undefined && Number(body.percentual_dia) > 100) return 'Percentual deve estar entre 0 e 100.';
  for (const [start,end] of [['data_inicio','data_fim'],['data_inicio_prevista','data_fim_prevista'],['data_inicio_planejada','data_termino_planejada'],['data_atribuicao','data_fim']]) if(body[start] && body[end] && String(body[start]).slice(0,10) > String(body[end]).slice(0,10)) return 'Data final anterior à inicial.';
  for (const [q,c] of [['quantidade','custo_unitario'],['quantidade_consumida','custo_unitario']]) if(body[q] !== undefined && body[c] !== undefined && Number(body[q])*Number(body[c]) >= 1e10) return 'Valor total excede a precisão permitida.';
  if (table === 'usuario' && body.email !== undefined && (typeof body.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email))) return 'E-mail inválido.';
  return null;
}
module.exports = { validar, idValido, dataValida };
