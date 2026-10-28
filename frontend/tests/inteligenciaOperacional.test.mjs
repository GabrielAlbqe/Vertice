import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parametrosOperacionais, validarPeriodoOperacional, carregarInteligenciaOperacional, FILTROS_OPERACIONAIS, periodoRelativoOperacional } from '../src/api/inteligenciaOperacional.js';
globalThis.localStorage ||= { getItem: () => 'token-teste' };
test('Parâmetros mantêm filtros combinados e codificam origem textual', () => {
  const q = new URLSearchParams(parametrosOperacionais({ id_obra: '1', fonte: 'diario', etapa: 'Infraestrutura', inicio: '2026-10-01', origem_atraso: 'Falta & atraso', fim: '' }));
  assert.equal(q.get('origem_atraso'), 'Falta & atraso'); assert.equal(q.get('inicio'), '2026-10-01'); assert.equal(q.has('fim'), false);
});
test('Cliente rejeita datas invertidas e inexistentes', () => {
  assert.ok(validarPeriodoOperacional({ inicio: '2026-02-30' }));
  assert.ok(validarPeriodoOperacional({ inicio: '2026-10-02', fim: '2026-10-01' }));
  assert.equal(validarPeriodoOperacional({ inicio: '2024-02-29', fim: '2024-03-01' }), '');
});
test('Combinações incompatíveis são explicadas antes do envio', () => {
  assert.ok(validarPeriodoOperacional({ tipo: 'atraso', origem_paralisacao: 'Clima' }));
  assert.ok(validarPeriodoOperacional({ origem_atraso: 'A', origem_paralisacao: 'B' }));
});
test('Fonte inicial usa os registros reais do Canteiro e não fixa obra', () => {
  assert.equal(FILTROS_OPERACIONAIS.fonte, 'diario'); assert.equal(FILTROS_OPERACIONAIS.id_obra, '');
});
test('API encaminha JWT e filtros e permite cancelamento', async () => {
  const old = globalThis.fetch; const controller = new AbortController();
  globalThis.fetch = async (url, options) => {
    assert.equal(new URL(url).searchParams.get('id_obra'), '1');
    assert.equal(options.headers.Authorization, 'Bearer token-teste'); assert.ok(options.signal);
    return new Response(JSON.stringify({ resumo: { total_ocorrencias: 0 } }));
  };
  try { assert.equal((await carregarInteligenciaOperacional({ id_obra: '1' }, controller.signal)).resumo.total_ocorrencias, 0); }
  finally { globalThis.fetch = old; }
});
test('Erro de permissão da API é preservado para a interface', async () => {
  const old = globalThis.fetch; globalThis.fetch = async () => new Response(JSON.stringify({ message: 'Perfil sem acesso.' }), { status: 403 });
  try { await assert.rejects(carregarInteligenciaOperacional({ id_obra: '1' }), /Perfil sem acesso/); } finally { globalThis.fetch = old; }
});

test('Períodos rápidos incluem o último dia sem erros na virada do mês',()=>{
 assert.deepEqual(periodoRelativoOperacional(7,'2026-10-28'),{inicio:'2026-10-22',fim:'2026-10-28'});
 assert.deepEqual(periodoRelativoOperacional(30,'2026-10-28'),{inicio:'2026-09-29',fim:'2026-10-28'});
 assert.deepEqual(periodoRelativoOperacional(1,'2026-10-28'),{inicio:'2026-10-28',fim:'2026-10-28'});
});
test('Período rápido rejeita referências ou quantidades inválidas',()=>{
 assert.throws(()=>periodoRelativoOperacional(0,'2026-10-28'));assert.throws(()=>periodoRelativoOperacional(7,'2026-02-30'));
});
