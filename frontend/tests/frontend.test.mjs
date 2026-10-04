import test from "node:test";
import assert from "node:assert/strict";
import { listarEquipes, buscarCatalogoRecursos, atribuirEquipe } from "../src/api/recursos.js";
import { calcularAnalytics, normalizarAnalytics, FILTROS_VAZIOS } from "../src/api/analyticsCalculos.js";
import { usuarioCanteiro } from "../src/canteiro/sessao.js";

test("ambiente explícito prevalece sobre ocupação e tamanho da tela", () => {
  assert.equal(usuarioCanteiro({ ambiente: "Escritório", ocupacao: "Operacional" }), false);
  assert.equal(usuarioCanteiro({ ambiente: "Canteiro" }), true);
  assert.equal(usuarioCanteiro({ ocupacao: "Operacional" }), true);
});

test("catálogo consulta insumos e máquinas por obra e isola equipes", async () => {
  const anterior = globalThis.fetch, chamadas = [];
  globalThis.fetch = async (url, options) => {
    const rota = new URL(url); chamadas.push({ rota, options });
    let dados = [];
    if (rota.pathname === "/api/equipes") dados = [{ id_cadastro_equipes: 1, idobra: 1 }, { id_cadastro_equipes: 2, idobra: 2 }];
    if (/\/(insumos|maquinarios)$/.test(rota.pathname)) {
      assert.equal(rota.searchParams.get("idobra"), "1");
      dados = [{ id_insumos: 1, id_maquina: 1, idobra: 1 }];
    }
    return new Response(JSON.stringify(dados), { status: 200 });
  };
  try {
    assert.equal((await listarEquipes(1)).length, 1);
    const catalogo = await buscarCatalogoRecursos([{ id_obra: 1 }]);
    assert.equal(catalogo.equipes.length, 1);
    assert.equal(catalogo.insumos.length, 1);
    const antes = chamadas.length;
    assert.deepEqual(await buscarCatalogoRecursos([]), { equipes: [], insumos: [], maquinarios: [] });
    assert.equal(chamadas.length, antes);
    await atribuirEquipe({ id_cadastro_equipes: 1, nome_equipe: "Equipe", idobra: 1, custo_mensal: 100, custo_diario: 10, quantidade_profissionais: 2, etapa_atuacao: "Instalações" }, 2);
    assert.equal(JSON.parse(chamadas.at(-1).options.body).idobra, 2);
  } finally { globalThis.fetch = anterior; }
});

const base = () => ({ obra: { orcamento_planejado: 1000, data_inicio_planejada: "2026-09-01", data_termino_planejada: "2026-12-01" }, realizados: [], planejados: [], usos: [], usosCompletos: true, etapas: [{ id_etapa: 1, nome_etapa: "Instalações" }], ocorrencias: [], recursos: {}, avisos: [] });
test("Analytics usa lançamentos reais, sem somar novamente o RDO", () => {
  const dados = base();
  dados.realizados = [{ origem_custo: "Insumos", id_origem: 3, id_etapa: 1, data: "2026-09-30", quantidade: "2", custo_unitario: "100" }];
  dados.usos = [{ origem: "insumo", custo_total: 900, data: "2026-09-30" }];
  const normal = normalizarAnalytics(dados);
  assert.equal(calcularAnalytics(normal, FILTROS_VAZIOS, "2026-10-01").realizado, 200);
  const filtrado = calcularAnalytics(normal, { ...FILTROS_VAZIOS, recurso: "insumo:3" }, "2026-10-01");
  assert.equal(filtrado.realizado, 200);
  assert.equal(filtrado.planejado, null);
  assert.equal(calcularAnalytics(normal, { ...FILTROS_VAZIOS, origem: "equipe" }, "2026-10-01").realizado, 0);
});
test("Analytics diferencia erro, ausência e valores inválidos sem NaN", () => {
  assert.deepEqual(calcularAnalytics(normalizarAnalytics(base()), FILTROS_VAZIOS).pontos, []);
  const dados = base(); dados.realizados = null; dados.usosCompletos = false;
  assert.equal(calcularAnalytics(normalizarAnalytics(dados), FILTROS_VAZIOS).realizado, null);
  dados.realizados = [{ quantidade: "inválido", custo_unitario: 100 }];
  const resultado = calcularAnalytics(normalizarAnalytics(dados), FILTROS_VAZIOS);
  assert.equal(resultado.realizado, null);
  assert.ok(!JSON.stringify(resultado).includes("NaN"));
});
