import { requisitar } from './api.js';

// Somente rotas GET existentes. Não há endpoint de orçamento por recurso,
// lotes de insumos ou duração de paralisação com unidade e recurso afetado.
// Essas lacunas são tratadas no cálculo, sem criar rotas ou gravar dados.
export async function carregarAnalytics(idObra, signal) {
  const avisos = [];
  async function consultar(rota, lista = true) {
    try {
      const limite = AbortSignal.timeout(15000);
      const dados = await requisitar(rota, { signal: signal ? AbortSignal.any([signal, limite]) : limite });
      if (lista && !Array.isArray(dados)) throw new Error('Formato de resposta inválido.');
      return dados;
    } catch (erro) {
      if (signal?.aborted) throw erro;
      avisos.push(`Não foi possível consultar ${rota}: ${erro.message}`);
      return null;
    }
  }
  const [obra, planejados, realizados, etapas, rdos] = await Promise.all([
    consultar(`/obras/${idObra}`, false),
    consultar(`/custos-planejados?id_obra=${idObra}`),
    consultar(`/custos-realizados?id_obra=${idObra}`),
    consultar(`/etapas?id_obra=${idObra}`),
    consultar(`/rdo?id_obra=${idObra}`),
  ]);
  if (!obra) throw new Error('Não foi possível carregar a obra. Tente atualizar os dados.');
  const daObra = lista => lista?.filter(item => Number(item.id_obra) === Number(idObra)) ?? null;
  const lancamentos = daObra(realizados);
  const diarios = daObra(rdos);
  const usos = [];
  const ocorrencias = [];
  let ocorrenciasCompletas = diarios !== null;
  let usosCompletos = diarios !== null;
  // Limita a concorrência para não disparar todas as consultas de RDO de uma vez.
  for (let index = 0; index < (diarios?.length || 0); index += 4) {
    await Promise.all(diarios.slice(index, index + 4).map(async rdo => {
      const id = rdo.id_rdo;
      const rotas = ['/atrasos', '/paralisacoes'];
      const respostas = await Promise.all(rotas.map(rota => consultar(`${rota}?id_rdo=${id}`)));
      if (respostas.some(lista => lista === null)) ocorrenciasCompletas = false;
      respostas.forEach((lista, i) => lista?.filter(item => Number(item.id_rdo) === Number(id)).forEach(item => ocorrencias.push({ ...item, data: rdo.data_rdo, tipo: rotas[i] })));
      // O livro de custos é autoritativo quando contém lançamentos: não soma
      // novamente os usos de RDO que podem já ter originado esses lançamentos.
      if (lancamentos?.length || lancamentos === null) return;
      const tipos = [['equipe', '/rdo-equipes'], ['insumo', '/consumos-insumos'], ['maquinario', '/rdo-maquinarios']];
      await Promise.all(tipos.map(async ([origem, rota]) => {
        const lista = await consultar(`${rota}?id_rdo=${id}`);
        if (lista === null) usosCompletos = false;
        lista?.filter(item => Number(item.id_rdo) === Number(id)).forEach(item => usos.push({ ...item, origem, data: rdo.data_rdo }));
      }));
    }));
  }
  const referencias = new Map();
  const tipoOrigem = valor => {
    const texto = String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
    return texto.startsWith('equip') ? 'equipe' : texto.startsWith('insum') ? 'insumo' : texto.startsWith('maquin') ? 'maquinario' : null;
  };
  for (const item of lancamentos || []) {
    const tipo = tipoOrigem(item.origem_custo);
    if (tipo && item.id_origem) referencias.set(`${tipo}:${item.id_origem}`, { tipo, id: item.id_origem });
  }
  for (const item of usos) {
    const id = item.id_equipe ?? item.id_insumo ?? item.id_maquinario;
    if (id) referencias.set(`${item.origem}:${id}`, { tipo: item.origem, id });
  }
  const recursos = {};
  const refs = [...referencias.entries()];
  for (let index = 0; index < refs.length; index += 6) {
    await Promise.all(refs.slice(index, index + 6).map(async ([chave, { tipo, id }]) => {
      const rota = { equipe: 'equipes', insumo: 'insumos', maquinario: 'maquinarios' }[tipo];
      // Consulta por ID também encontra recursos que foram transferidos após o RDO.
      recursos[chave] = await consultar(`/${rota}/${id}`, false);
    }));
  }
  return { obra, planejados: daObra(planejados), realizados: lancamentos, etapas: daObra(etapas), rdos: diarios, usos, usosCompletos, ocorrencias, ocorrenciasCompletas, recursos, avisos };
}
