const { dataValida } = require('../utils/analyticalValidation');
const { cents } = require('../utils/financeiro');
const round = n => Math.round((n + Number.EPSILON) * 100) / 100;
const percent = (n, d) => d > 0 ? round(n / d * 100) : null;
function numero(value) {
  if (!['number', 'string'].includes(typeof value) || String(value).trim() === '') return null;
  const n = Number(value);
  return Number.isFinite(n) && n >= 0 ? n : null;
}
function temOcorrencia(value) {
  const t = String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
  return Boolean(t && !/^(nenhum(a)?(\s+(atrasos?|paralisacao|paralisacoes|ocorrencias?))?|n\/a|nao|sem (atrasos?|paralisacao|paralisacoes|ocorrencias?)|0|-)\.?$/.test(t));
}
function periodo(data, agrupamento) {
  if (!dataValida(data)) return null;
  if (agrupamento === 'mes') return data.slice(0, 7) + '-01';
  if (agrupamento === 'semana') {
    const d = new Date(data + 'T00:00:00Z');
    d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
    return d.toISOString().slice(0, 10);
  }
  return data;
}
function proximoPeriodo(data, agrupamento) {
  const d = new Date(data + 'T00:00:00Z');
  if (agrupamento === 'mes') d.setUTCMonth(d.getUTCMonth() + 1);
  else d.setUTCDate(d.getUTCDate() + (agrupamento === 'semana' ? 7 : 1));
  return d.toISOString().slice(0, 10);
}
function duracao(eventos, observado = true) {
  if (!eventos.length) return { acumulada: observado ? 0 : null, media: null, conhecida: 0, invalidas: 0 };
  const values = eventos.map(e => numero(e.duracao));
  const valid = values.filter(v => v !== null);
  const total = round(valid.reduce((s, v) => s + v, 0));
  return { acumulada: valid.length === values.length ? total : null, media: valid.length === values.length ? round(total / values.length) : null, conhecida: total, invalidas: values.length - valid.length };
}
function variacao(atual, anterior) {
  if (atual === null || anterior === null) return { absoluta: null, percentual: null };
  return { absoluta: round(atual - anterior), percentual: anterior > 0 ? round((atual - anterior) / anterior * 100) : null };
}
function taxaExposicao(quantidade, exposicao, unidade) {
  const n = numero(quantidade), d = numero(exposicao);
  return n !== null && d > 0 && unidade ? round(n / d) : null;
}
// Only usable with an explicit occurrence/resource link and known duration units.
// Existing SQL records do not provide these prerequisites; production returns null.
function estimarImpacto({ vinculoComprovado, tempo, unidade, horasPorDia, custoDiario, quantidade = 1 }) {
  if (!vinculoComprovado || !['dia', 'hora'].includes(unidade)) return null;
  const t = numero(tempo), q = numero(quantidade), h = numero(horasPorDia);
  if (t === null || q === null || q <= 0 || (unidade === 'hora' && !(h > 0))) return null;
  try {
    const cost = cents(custoDiario);
    if (cost < 0) return null;
    const total = Math.round((unidade === 'dia' ? t : t / h) * q * cost);
    return Number.isSafeInteger(total) ? total / 100 : null;
  } catch { return null; }
}
function classificar(serie, campo, agrupamento) {
  const last = serie.slice(-3);
  if (last.length < 3 || last.some(p => p[campo] === null)) return 'Dados insuficientes';
  if (last.some((p, i) => i && proximoPeriodo(last[i - 1].periodo, agrupamento) !== p.periodo)) return 'Dados insuficientes';
  const v = last.map(p => p[campo]);
  if (v[0] === v[1] && v[1] === v[2]) return 'Estável';
  if (v[0] < v[1] && v[1] < v[2]) return 'Crescente';
  if (v[0] > v[1] && v[1] > v[2]) return 'Decrescente';
  return 'Oscilante';
}
function calcular({ registros, ocorrencias }, filtros) {
  const agrupamento = filtros.agrupamento || 'dia';
  const coverage = new Map();
  for (const r of registros) {
    const key = periodo(r.data, agrupamento);
    if (key) { if (!coverage.has(key)) coverage.set(key, []); coverage.get(key).push(r); }
  }
  const ids = new Set(registros.map(r => r.id_registro));
  const unique = new Map();
  let descartadas = 0;
  for (const e of ocorrencias) {
    if (!ids.has(e.id_registro) || !dataValida(e.data) || (filtros.fonte === 'diario' && !temOcorrencia(e.descricao))) { descartadas++; continue; }
    unique.set(e.id, e);
  }
  const eventos = [...unique.values()];
  const byType = type => eventos.filter(e => e.tipo === type);
  const totalTipo = { atraso: byType('atraso').length, paralisacao: byType('paralisacao').length };
  const periods = [...coverage.keys()].sort();
  const groups = new Map();
  for (const e of eventos) {
    const key = JSON.stringify([e.id_obra, e.etapa, e.origem, e.tipo, e.turno]);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(e);
  }
  const padroes = [...groups.entries()].map(([id, es]) => {
    const first = es[0], d = duracao(es);
    return { id, id_obra: first.id_obra, etapa: first.etapa, origem: first.origem, tipo: first.tipo, turno: first.turno,
      quantidade: es.length, frequencia: percent(es.length, totalTipo[first.tipo]),
      recorrencia: percent(new Set(es.map(e => periodo(e.data, agrupamento))).size, periods.length),
      duracao_acumulada: d.acumulada, duracao_media: d.media, duracoes_ausentes: d.invalidas };
  }).sort((a, b) => b.quantidade - a.quantidade || (b.recorrencia || 0) - (a.recorrencia || 0) || a.id.localeCompare(b.id));
  const associacoes = [];
  for (const pattern of padroes) {
    const es = groups.get(pattern.id);
    for (const fator of ['turno', 'clima', 'etapa', 'periodo']) {
      const factors = new Map();
      for (const e of es) {
        const value = fator === 'periodo' ? periodo(e.data, agrupamento) : e[fator];
        if (!value || value === 'Não informado') continue;
        if (!factors.has(value)) factors.set(value, new Set());
        factors.get(value).add(e.id);
      }
      for (const [valor, occurrences] of factors) associacoes.push({ padrao_id: pattern.id, etapa: pattern.etapa,
        origem: pattern.origem, tipo: pattern.tipo, fator, valor, quantidade: occurrences.size,
        taxa_associacao: percent(occurrences.size, es.length), taxa_exposicao: null,
        evidencia: 'Registrado na ocorrência ou no documento de origem; não indica causalidade.' });
    }
  }
  const byPeriod = new Map();
  for(const e of eventos){const p=periodo(e.data,agrupamento);if(!byPeriod.has(p))byPeriod.set(p,[]);byPeriod.get(p).push(e);}
  const serie = periods.map(p => {
    const es = byPeriod.get(p) || [];
    return { periodo: p, registros: coverage.get(p).length, atrasos: es.filter(e => e.tipo === 'atraso').length,
      paralisacoes: es.filter(e => e.tipo === 'paralisacao').length, quantidade: es.length,
      duracao: duracao(es).acumulada, recorrencia: percent(new Set(es.map(e => e.data)).size, new Set(coverage.get(p).map(r => r.data)).size),
      impacto_estimado: null };
  });
  let lacunas = 0;
  const from = filtros.inicio ? periodo(filtros.inicio, agrupamento) : periods[0];
  const to = filtros.fim ? periodo(filtros.fim, agrupamento) : periods.at(-1);
  if (from && to && from <= to) {
    const days=(Date.parse(to+'T00:00:00Z')-Date.parse(from+'T00:00:00Z'))/86400000;
    const expected=agrupamento==='mes'?(Number(to.slice(0,4))-Number(from.slice(0,4)))*12+Number(to.slice(5,7))-Number(from.slice(5,7))+1:Math.floor(days/(agrupamento==='semana'?7:1))+1;
    lacunas=Math.max(0,expected-periods.filter(p=>p>=from&&p<=to).length);
  }
  const last = serie.at(-1), previous = serie.at(-2);
  const adjacent = last && previous && proximoPeriodo(previous.periodo, agrupamento) === last.periodo;
  const comparacoes = Object.fromEntries(['atrasos', 'paralisacoes', 'quantidade', 'duracao', 'recorrencia', 'impacto_estimado'].map(campo =>
    [campo, { ...variacao(adjacent ? last[campo] : null, adjacent ? previous[campo] : null), classificacao: classificar(serie, campo, agrupamento) }]));
  const etapas = [...new Set(eventos.map(e => e.etapa))].map(etapa => {
    const es = eventos.filter(e => e.etapa === etapa);
    return { etapa, quantidade: es.length, duracao: duracao(es).acumulada, impacto_estimado: null, participacao_impacto: null };
  });
  const byOrigin=new Map();for(const e of eventos)byOrigin.set(e.origem,(byOrigin.get(e.origem)||0)+1);
  const origens=[...byOrigin].map(([origem,quantidade])=>({origem,quantidade}));
  const d = duracao(eventos, registros.length > 0);
  const avisos = [
    'Associação não significa causalidade. Fatores podem aparecer no mesmo evento; suas taxas não devem ser somadas.',
    'Durações do RDO não têm unidade definida no banco. Valores são exibidos na unidade registrada; não são horas nem dias confirmados.',
    'Não existe vínculo direto de ocorrência com equipe, máquina ou insumo. Participação no RDO não prova associação.',
    'Impacto financeiro: Dados insuficientes. Faltam vínculo direto, tempo improdutivo por recurso e conversão para a unidade do custo.',
    'Recorrência considera períodos com documentos registrados. Períodos sem documentos não recebem zeros.',
    'Diários e RDOs são analisados separadamente: o esquema não permite deduplicar um mesmo evento entre as duas fontes.'
  ];
  if (filtros.fonte === 'diario') avisos.push('Ocorrências textuais do diário não possuem duração; a análise quantitativa de duração fica indisponível.');
  if (lacunas) avisos.push(lacunas + ' período(s) sem documentos: não há dados para afirmar ausência de ocorrências.');
  if (d.invalidas) avisos.push(d.invalidas + ' ocorrência(s) sem duração válida. Totais incompletos não são tratados como completos.');
  return { filtros, resumo: { registros: registros.length, periodos_analisados: periods.length, total_ocorrencias: eventos.length,
    atrasos: totalTipo.atraso, paralisacoes: totalTipo.paralisacao,
    duracao_atrasos: duracao(byType('atraso'), registros.length>0).acumulada,
    duracao_paralisacoes: duracao(byType('paralisacao'), registros.length>0).acumulada, duracao_acumulada: d.acumulada, duracao_media: d.media,
    duracao_conhecida: d.conhecida, duracoes_ausentes: d.invalidas,
    recorrencia: percent(new Set(eventos.map(e => periodo(e.data, agrupamento))).size, periods.length), impacto_estimado: null },
    padroes, associacoes, impactos: { equipe: null, maquinario: null, total: null, etapas },
    tendencias: { serie, comparacoes, lacunas, periodo_atual: last?.periodo || null, periodo_anterior: adjacent ? previous.periodo : null },
    etapas, origens, qualidade: { descartadas, unidade_duracao: null, vinculo_recurso: false }, avisos };
}
module.exports = { calcular, periodo, proximoPeriodo, duracao, variacao, taxaExposicao, estimarImpacto, classificar, percent, temOcorrencia };
