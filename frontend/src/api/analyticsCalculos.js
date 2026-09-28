export const ETAPAS = ['Mobilização', 'Infraestrutura', 'Supraestrutura e Alvenaria', 'Instalações', 'Revestimentos', 'Acabamento'];
export const ORIGENS = { equipe: 'Equipes', insumo: 'Insumos', maquinario: 'Maquinários' };
export const FILTROS_VAZIOS = { inicio: '', fim: '', etapa: '', origem: '', recurso: '' };
const DIA = 86400000;
const texto = valor => String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
export function numero(valor) {
  if (valor === null || valor === undefined || valor === '') return null;
  const resultado = Number(valor);
  return Number.isFinite(resultado) && resultado >= 0 ? resultado : null;
}
export function dataISO(valor) {
  const data = String(valor || '').slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data)) return '';
  const instante = Date.parse(`${data}T00:00:00Z`);
  return Number.isFinite(instante) && new Date(instante).toISOString().slice(0, 10) === data ? data : '';
}
export function hojeLocal() {
  const hoje = new Date();
  return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, '0')}-${String(hoje.getDate()).padStart(2, '0')}`;
}
const instante = data => Date.parse(`${data}T00:00:00Z`);
const diasEntre = (inicio, fim) => Math.max(0, Math.round((instante(fim) - instante(inicio)) / DIA));
const soma = lista => lista.reduce((total, item) => total + (item.valor ?? 0), 0);
const percentual = (valor, base) => valor !== null && base > 0 ? valor / base * 100 : null;
function etapaNome(valor) {
  const nome = texto(valor);
  if (nome === 'acabamentos') return 'Acabamento';
  if (nome === 'alvenaria/supraestrutura') return ETAPAS[2];
  return ETAPAS.find(item => texto(item) === nome) || 'Sem etapa identificada';
}
function origemNome(valor) {
  const nome = texto(valor);
  return nome.startsWith('equip') ? 'equipe' : nome.startsWith('insum') ? 'insumo' : nome.startsWith('maquin') ? 'maquinario' : 'outros';
}
function produto(...valores) {
  const numeros = valores.map(numero);
  return numeros.includes(null) ? null : numeros.reduce((total, valor) => total * valor, 1);
}

// Preparado para dados enriquecidos: não presume se duracao está em horas/dias,
// nem que todos os recursos de uma etapa foram afetados. Nunca entra no realizado.
export function estimarImpacto({ dias_atraso, origem, quantidade, custo_diario }) {
  if (origem === 'equipe') return produto(dias_atraso, custo_diario);
  if (origem === 'maquinario') return produto(dias_atraso, quantidade, custo_diario);
  return null;
}

export function normalizarAnalytics(dados) {
  const avisos = [...(dados.avisos || [])];
  const usarLivro = Boolean(dados.realizados?.length);
  const fontes = usarLivro ? dados.realizados : dados.usos || [];
  const registros = fontes.map(item => {
    const origem = usarLivro ? origemNome(item.origem_custo) : item.origem;
    const id = usarLivro ? item.id_origem : item.id_equipe ?? item.id_insumo ?? item.id_maquinario;
    const chave = id ? `${origem}:${id}` : '';
    const recurso = dados.recursos?.[chave];
    const etapa = usarLivro ? dados.etapas?.find(etapa => Number(etapa.id_etapa) === Number(item.id_etapa))?.nome_etapa : item.etapa;
    let valor;
    if (usarLivro) valor = numero(item.valor_total) ?? produto(item.quantidade, item.custo_unitario);
    else if (origem === 'equipe') valor = produto(item.dias_atuacao, recurso?.custo_diario);
    else if (origem === 'maquinario') valor = produto(item.quantidade_utilizada, item.tempo_utilizacao, recurso?.custo_diario);
    else {
      const lote = numero(recurso?.quantidade_lote);
      const unitarioLote = lote > 0 && numero(recurso?.valor_lote) !== null ? numero(recurso.valor_lote) / lote : null;
      // Consumo guarda preço histórico. Estoque atual não é consumo nem lote.
      valor = numero(item.custo_total) ?? produto(item.quantidade_consumida, numero(item.custo_unitario) ?? unitarioLote);
    }
    return { origem, chave, nome: recurso?.nome_equipe || recurso?.nome || `${ORIGENS[origem] || 'Recurso'} #${id || '?'}`, etapa: etapaNome(etapa), data: dataISO(item.data), valor };
  });
  const planejados = (dados.planejados || []).map(item => ({
    etapa: etapaNome(item.etapa), origem: origemNome(item.origem_custo), valor: numero(item.valor_planejado),
    inicio: dataISO(item.data_inicio_prevista), fim: dataISO(item.data_fim_prevista),
  }));
  if (!usarLivro && registros.length) avisos.push('Realizado calculado a partir dos usos registrados em RDO. Equipes e máquinas usam as diárias atuais; tempo de máquina é interpretado em dias. Não há histórico de tarifas/unidade de tempo nesses registros.');
  if (registros.some(item => !item.data || item.valor === null || item.etapa === 'Sem etapa identificada' || item.origem === 'outros')) avisos.push('Há lançamentos incompletos. Valores sem base de cálculo não são tratados como zero; classificações ausentes são mostradas separadamente.');
  return { ...dados, registros, planos: planejados, avisos, fonte: usarLivro ? 'Custos realizados registrados' : 'Usos registrados em RDO' };
}

export function calcularAnalytics(dados, filtros = FILTROS_VAZIOS, hoje = hojeLocal()) {
  const avisos = [...dados.avisos];
  const inicio = dataISO(filtros.inicio);
  const fim = dataISO(filtros.fim);
  const limiteReal = fim && fim < hoje ? fim : hoje;
  const classifica = item => (!filtros.etapa || item.etapa === filtros.etapa) && (!filtros.origem || item.origem === filtros.origem);
  const registros = dados.registros.filter(item => classifica(item) && (!filtros.recurso || item.chave === filtros.recurso) &&
    (!inicio || (item.data && item.data >= inicio)) && (!fim || (item.data && item.data <= fim)) && (!item.data || item.data <= hoje));
  if (dados.registros.some(item => item.data > hoje)) avisos.push('Lançamentos com data futura não entram no realizado.');
  const baseDisponivel = dados.realizados !== null && (dados.realizados.length > 0 || dados.usosCompletos);
  const realizado = baseDisponivel && registros.every(item => item.valor !== null) ? soma(registros) : null;
  let planos = dados.planos.filter(classifica);
  let planejado = null;
  let usaOrcamento = false;
  if (filtros.recurso) {
    avisos.push('O planejamento não identifica recursos individuais. Planejado e desvios ficam indisponíveis neste filtro.');
    planos = [];
  } else if (dados.planejados !== null && dados.planos.length) {
    let datasValidas = true;
    planos = planos.map(item => {
      if (!inicio && !fim) return item;
      if (!item.inicio || !item.fim || item.fim < item.inicio) { datasValidas = false; return item; }
      const de = inicio && inicio > item.inicio ? inicio : item.inicio;
      const ate = fim && fim < item.fim ? fim : item.fim;
      return { ...item, valor: item.valor === null ? null : item.valor * (ate < de ? 0 : (diasEntre(de, ate) + 1) / (diasEntre(item.inicio, item.fim) + 1)) };
    });
    planejado = datasValidas && planos.every(item => item.valor !== null) ? soma(planos) : null;
    if (inicio || fim) avisos.push('Planejado do período distribuído proporcionalmente aos dias previstos de cada lançamento.');
    if (!datasValidas) avisos.push('Planejamento sem datas válidas: não é possível calcular o valor deste período.');
  } else if (dados.planejados !== null && !filtros.etapa && !filtros.origem && !inicio && !fim) {
    planejado = numero(dados.obra.orcamento_planejado);
    usaOrcamento = planejado !== null;
    if (usaOrcamento) avisos.push('Planejado usa o orçamento global da obra. Ainda não há distribuição por etapa ou origem.');
  } else if (dados.planejados !== null) avisos.push('Não há planejamento detalhado disponível para este recorte.');
  const diasEfetivos = new Set(registros.filter(item => item.data && item.data <= limiteReal && item.valor !== null).map(item => item.data)).size;
  const terminoObra = dataISO(dados.obra.data_termino_planejada);
  const termino = fim && terminoObra ? (fim < terminoObra ? fim : terminoObra) : terminoObra;
  const diasRestantes = termino ? diasEntre(limiteReal, termino) : null;
  const media = realizado !== null && diasEfetivos > 0 && registros.every(item => item.data) ? realizado / diasEfetivos : null;
  const projetado = media !== null && diasRestantes !== null ? realizado + media * diasRestantes : null;
  const desvio = realizado !== null && planejado !== null ? realizado - planejado : null;
  const desvioProjetado = projetado !== null && planejado !== null ? projetado - planejado : null;
  const nomesEtapas = [...ETAPAS, ...new Set([...registros, ...planos].map(item => item.etapa).filter(item => !ETAPAS.includes(item)))];
  const etapas = nomesEtapas.map(nome => ({ nome,
    planejado: planejado !== null && !usaOrcamento ? soma(planos.filter(item => item.etapa === nome)) : null,
    realizado: realizado !== null ? soma(registros.filter(item => item.etapa === nome)) : null,
  }));
  const origens = [...Object.entries(ORIGENS), ...(registros.some(item => item.origem === 'outros') ? [['outros', 'Sem origem identificada']] : [])].map(([id, nome]) => {
    const valor = realizado !== null ? soma(registros.filter(item => item.origem === id)) : null;
    return { id, nome, valor, percentual: percentual(valor, realizado) ?? (realizado === 0 ? 0 : null) };
  });
  const ocorrencias = dados.ocorrencias.filter(item => {
    const data = dataISO(item.data);
    return (!inicio || data >= inicio) && (!fim || data <= fim) && data <= hoje && (!filtros.etapa || etapaNome(item.etapa) === filtros.etapa) &&
      (!filtros.origem || origemNome(item.origem_atraso) === filtros.origem) && !filtros.recurso;
  });
  // A API atual informa duracao sem unidade nem id do recurso afetado:
  // o impacto monetário não é inferido nem somado ao realizado/projetado.
  const datas = registros.map(item => item.data).filter(Boolean).sort();
  const inicioSerie = inicio || dataISO(dados.obra.data_inicio_planejada) || datas[0];
  const fimSerie = termino && termino > limiteReal ? termino : limiteReal;
  const pontos = [];
  if (inicioSerie && inicioSerie <= fimSerie && realizado !== null && registros.every(item => item.data)) {
    const marcos = new Set([inicioSerie, fimSerie]);
    if (limiteReal >= inicioSerie && limiteReal <= fimSerie) marcos.add(limiteReal);
    let mes = new Date(`${inicioSerie.slice(0, 7)}-01T00:00:00Z`);
    // Em obras muito longas, agrega o eixo para limitar o custo de renderização.
    const passo = Math.max(1, Math.ceil(diasEntre(inicioSerie, fimSerie) / 3650));
    while (mes.toISOString().slice(0, 10) <= fimSerie) {
      const data = new Date(Date.UTC(mes.getUTCFullYear(), mes.getUTCMonth() + 1, 0)).toISOString().slice(0, 10);
      if (data >= inicioSerie && data <= fimSerie) marcos.add(data);
      mes.setUTCMonth(mes.getUTCMonth() + passo);
    }
    [...marcos].sort().forEach(data => {
      const acumulado = soma(registros.filter(item => item.data <= data));
      pontos.push({ data, realizado: data <= limiteReal ? acumulado : null, projetado: data >= limiteReal && projetado !== null ? realizado + media * diasEntre(limiteReal, data) : null });
    });
  }
  return { planejado, realizado, projetado, desvio, desvioPercentual: percentual(desvio, planejado), desvioProjetado, desvioProjetadoPercentual: percentual(desvioProjetado, planejado), realizadoPercentual: percentual(realizado, planejado), etapas, origens, pontos, diasEfetivos, diasRestantes, media, ocorrencias, avisos: [...new Set(avisos)], quantidade: registros.length, usaOrcamento };
}
