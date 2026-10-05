// Verificação somente de leitura. Requer API local e seed_analytics_teste.sql executado.
// Executar em frontend/: node tests/analytics.real.mjs
import assert from "node:assert/strict";
import { carregarAnalytics } from "../src/api/analytics.js";
import { normalizarAnalytics, calcularAnalytics, FILTROS_VAZIOS } from "../src/api/analyticsCalculos.js";

const resposta = await fetch("http://localhost:3000/api/obras?id_construtora=1");
assert.equal(resposta.status, 200);
const obras = (await resposta.json()).filter(o => o.nome.startsWith("Vértice Teste -"));
assert.equal(obras.length, 6, "Execute o seed antes desta verificação.");
const resultados = [];
for (const obra of obras) {
  const dados = normalizarAnalytics(await carregarAnalytics(obra.id_obra));
  assert.deepEqual(dados.avisos, [], "Falha ou dados incompletos na API real");
  const total = calcularAnalytics(dados, FILTROS_VAZIOS, "2026-10-04");
  assert.equal(total.planejado, Number(obra.orcamento_planejado));
  assert.ok(total.realizado > 0);
  assert.ok(total.projetado !== null);
  assert.ok(total.pontos.length > 2);
  assert.equal(total.etapas.length, 6);
  assert.equal(total.origens.length, 3);
  assert.ok(Math.abs(total.origens.reduce((s, o) => s + o.valor, 0) - total.realizado) < .01);
  const mensal = calcularAnalytics(dados, { ...FILTROS_VAZIOS, inicio: "2026-09-01", fim: "2026-09-30" }, "2026-10-04");
  assert.ok(mensal.quantidade <= total.quantidade);
  const insumos = calcularAnalytics(dados, { ...FILTROS_VAZIOS, origem: "insumo" }, "2026-10-04");
  assert.ok(insumos.realizado > 0 && insumos.realizado < total.realizado);
  const etapa = calcularAnalytics(dados, { ...FILTROS_VAZIOS, etapa: "Infraestrutura" }, "2026-10-04");
  assert.ok(etapa.planejado > 0 && etapa.planejado < total.planejado);
  resultados.push({ obra: obra.nome, planejado: total.planejado, realizado: total.realizado, desvio: total.desvio, lancamentos: total.quantidade, setembro: mensal.quantidade, pontos: total.pontos.length });
}
const buscar = nome => resultados.find(r => r.obra.endsWith(nome));
assert.ok(buscar("Residencial Aurora").desvio < 0);
assert.ok(Math.abs(buscar("Centro Empresarial").desvio / buscar("Centro Empresarial").planejado) < .02);
assert.ok(buscar("Galpão Industrial").desvio > 0);
assert.ok(buscar("Residencial Horizonte").realizado / buscar("Residencial Horizonte").planejado < .05);
console.table(resultados);
console.log("PASSOU: seis obras pela API real, sem gravações; totais, etapas, origens, evolução e filtros.");
