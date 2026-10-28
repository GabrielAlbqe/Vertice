import { requisitar } from './api.js';
export const FILTROS_OPERACIONAIS = { id_obra: '', fonte: 'diario', inicio: '', fim: '', etapa: '', turno: '', clima: '', origem_atraso: '', origem_paralisacao: '', tipo: '', agrupamento: 'dia' };
export function parametrosOperacionais(filtros) {
  return new URLSearchParams(Object.entries(filtros).filter(([, value]) => value !== '' && value !== undefined && value !== null)).toString();
}
export function validarPeriodoOperacional(filtros) {
  const valida = value => /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(value + 'T00:00:00Z')) && new Date(value + 'T00:00:00Z').toISOString().slice(0, 10) === value;
  for (const campo of ['inicio', 'fim']) if (filtros[campo] && !valida(filtros[campo])) return 'Informe datas válidas.';
  if (filtros.inicio && filtros.fim && filtros.inicio > filtros.fim) return 'A data final deve ser igual ou posterior à inicial.';
  if (filtros.origem_atraso && filtros.origem_paralisacao) return 'Selecione uma origem de ocorrência por análise.';
  if ((filtros.tipo === 'atraso' && filtros.origem_paralisacao) || (filtros.tipo === 'paralisacao' && filtros.origem_atraso)) return 'O tipo e a origem selecionados são incompatíveis.';
  return '';
}
export const carregarFiltrosOperacionais = (filtros, signal) => requisitar('/inteligencia-operacional/filtros?' + parametrosOperacionais({ id_obra: filtros.id_obra, fonte: filtros.fonte }), { signal });
export const carregarInteligenciaOperacional = (filtros, signal) => requisitar('/inteligencia-operacional?' + parametrosOperacionais(filtros), { signal });

export function periodoRelativoOperacional(dias, fim) {
  if (!Number.isInteger(dias) || dias < 1) throw new Error('Quantidade de dias inválida.');
  if (!fim) {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(new Date()).map(p => [p.type, p.value]));
    fim = parts.year + '-' + parts.month + '-' + parts.day;
  }
  const date = new Date(fim + 'T00:00:00Z');
  if (Number.isNaN(date.valueOf()) || date.toISOString().slice(0, 10) !== fim) throw new Error('Data inválida.');
  date.setUTCDate(date.getUTCDate() - dias + 1);
  return { inicio: date.toISOString().slice(0, 10), fim };
}
