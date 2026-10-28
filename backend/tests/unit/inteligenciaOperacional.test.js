const { test } = require('node:test');
const assert = require('node:assert/strict');
const { calcular, periodo, duracao, variacao, taxaExposicao, estimarImpacto, classificar, temOcorrencia } = require('../../services/inteligenciaOperacional');
const { validarFiltros } = require('../../config/inteligenciaOperacional');
const f = { fonte: 'rdo', agrupamento: 'dia' };
const records = () => [1, 2, 3].map(i => ({ id_registro: 'rdo:' + i, data: '2026-10-0' + i, turno: 'Manhã', clima: 'Chuvoso' }));
const event = (id, day = 1, extra = {}) => ({ id: 'atraso:' + id, id_registro: 'rdo:' + day, id_obra: 1, data: '2026-10-0' + day, tipo: 'atraso', etapa: 'Infraestrutura', origem: 'Equipes', turno: 'Manhã', clima: 'Chuvoso', duracao: '2.50', descricao: 'Atraso', ...extra });
const result = (events = [], docs = records(), filtros = f) => calcular({ registros: docs, ocorrencias: events }, filtros);
test('Contagens e duração acumulada/média usam ocorrências únicas', () => {
  const r = result([event(1), event(2, 2), event(1)]);
  assert.equal(r.resumo.total_ocorrencias, 2); assert.equal(r.resumo.duracao_acumulada, 5); assert.equal(r.resumo.duracao_media, 2.5);
});
test('Frequência usa o denominador do mesmo tipo, não o total misturado', () => {
  const r = result([event(1), event(2, 2), event(3, 3, { tipo: 'paralisacao', origem: 'Condições Climáticas' })]);
  assert.equal(r.padroes.find(p => p.tipo === 'atraso').frequencia, 100);
  assert.equal(r.padroes.find(p => p.tipo === 'paralisacao').frequencia, 100);
});
test('Frequência de dois padrões de um tipo soma 100%', () => {
  const r = result([event(1), event(2, 2), event(3, 3, { origem: 'Insumos' })]);
  assert.deepEqual(r.padroes.map(p => p.frequencia), [66.67, 33.33]);
});
test('Recorrência usa períodos com documentos e conta cada período uma vez', () => {
  const r = result([event(1), event(2), event(3, 2)]);
  assert.equal(r.padroes[0].recorrencia, 66.67);
  assert.equal(r.resumo.periodos_analisados, 3);
});
test('Dois documentos no mesmo dia não duplicam períodos', () => {
  const docs = [...records(), { id_registro: 'rdo:4', data: '2026-10-01' }];
  assert.equal(result([event(1)], docs).resumo.recorrencia, 33.33);
});
test('Semana começa na segunda-feira e respeita virada do ano', () => {
  assert.equal(periodo('2026-10-04', 'semana'), '2026-09-28');
  assert.equal(periodo('2026-01-01', 'semana'), '2025-12-29');
  assert.equal(periodo('2026-10-28', 'mes'), '2026-10-01');
});
test('Associação calcula percentual por padrão sem atribuir recursos presentes no RDO', () => {
  const r = result([event(1), event(2, 2, { clima: 'Ensolarado' })]);
  const climate = r.associacoes.filter(a => a.fator === 'clima');
  assert.deepEqual(climate.map(a => a.taxa_associacao), [50, 50]);
  assert.ok(!r.associacoes.some(a => ['equipe', 'maquinario', 'insumo'].includes(a.fator)));
  assert.ok(r.associacoes.every(a => a.taxa_exposicao === null));
});
test('Um evento pode estar associado a múltiplos fatores sem somá-los como exclusivos', () => {
  const r = result([event(1)]);
  assert.equal(r.associacoes.length, 4);
  assert.ok(r.associacoes.every(a => a.quantidade === 1 && a.taxa_associacao === 100));
  assert.equal(r.resumo.total_ocorrencias, 1);
});
test('Sem documentos não inventa ocorrência, recorrência ou duração zero', () => {
  const r = result([], []);
  assert.equal(r.resumo.total_ocorrencias, 0); assert.equal(r.resumo.recorrencia, null); assert.equal(r.resumo.duracao_acumulada, null);
  assert.deepEqual(r.tendencias.serie, []);
});
test('Documento sem ocorrência permite contagem observada igual a zero', () => {
  const r = result([], records());
  assert.equal(r.tendencias.serie[0].quantidade, 0); assert.equal(r.resumo.recorrencia, 0);
});
test('Não preenche intervalos não observados com zeros nem compara períodos não consecutivos', () => {
  const r = result([event(1), event(2, 3)], [records()[0], records()[2]]);
  assert.equal(r.tendencias.serie.length, 2); assert.equal(r.tendencias.lacunas, 1);
  assert.equal(r.tendencias.comparacoes.quantidade.absoluta, null);
});
test('Duração nula ou inválida mantém os totais incompletos como indisponíveis', () => {
  const r = result([event(1), event(2, 2, { duracao: null })]);
  assert.equal(r.resumo.duracao_acumulada, null); assert.equal(r.resumo.duracao_media, null);
  assert.equal(r.resumo.duracao_conhecida, 2.5); assert.equal(r.resumo.duracoes_ausentes, 1);
});
for (const value of [-1, 'abc', NaN, Infinity, true, '', null]) test('Duração inválida: ' + String(value), () => assert.equal(duracao([{ duracao: value }]).acumulada, null));
test('RDO estruturado sem descrição ainda é ocorrência válida', () => assert.equal(result([event(1, 1, { descricao: '' })]).resumo.total_ocorrencias, 1));
test('Ocorrência sem documento vinculado é descartada', () => assert.equal(result([event(1, 1, { id_registro: 'inexistente' })]).resumo.total_ocorrencias, 0));
test('Diário não conta campos textuais que declaram ausência de ocorrência', () => assert.equal(result([event(1, 1, { descricao: 'Nenhuma paralisação' })], records(), { ...f, fonte: 'diario' }).resumo.total_ocorrencias, 0));
for (const value of ['Nenhum', 'Nenhuma', 'Nenhum atraso', 'Sem atrasos', 'Sem paralisações', 'N/A', '-', '0', '']) test('Ausência textual: ' + value, () => assert.equal(temOcorrencia(value), false));
test('Texto livre de ocorrência é preservado', () => assert.equal(temOcorrencia('Faltou material para concretagem'), true));
test('Taxa por exposição exige denominador positivo e unidade conhecida', () => {
  assert.equal(taxaExposicao(3, 6, 'dia'), .5);
  assert.equal(taxaExposicao(3, 0, 'dia'), null); assert.equal(taxaExposicao(3, 6, null), null);
});
const financial = { vinculoComprovado: true, tempo: 1.5, unidade: 'dia', custoDiario: 100.25, quantidade: 2 };
test('Impacto financeiro comprovado usa dias × custo diário × quantidade', () => assert.equal(estimarImpacto(financial), 300.75));
test('Horas só são convertidas com jornada definida', () => {
  assert.equal(estimarImpacto({ ...financial, tempo: 4, unidade: 'hora', horasPorDia: 8 }), 100.25);
  assert.equal(estimarImpacto({ ...financial, unidade: 'hora' }), null);
});
test('Não estima impacto sem vínculo direto ou unidade', () => {
  assert.equal(estimarImpacto({ ...financial, vinculoComprovado: false }), null);
  assert.equal(estimarImpacto({ ...financial, unidade: null }), null);
  assert.equal(result([event(1)]).impactos.total, null);
});
test('Financeiro arredonda em centavos sem duplicar custos', () => assert.equal(estimarImpacto({ ...financial, tempo: 3, quantidade: 1, custoDiario: .1 }), .3));
test('Variação absoluta e percentual', () => assert.deepEqual(variacao(15, 10), { absoluta: 5, percentual: 50 }));
test('Anterior zero mantém percentual nulo', () => assert.deepEqual(variacao(3, 0), { absoluta: 3, percentual: null }));
test('Ausência mantém variações indisponíveis', () => assert.deepEqual(variacao(null, 10), { absoluta: null, percentual: null }));
test('Classificação exige três períodos consecutivos', () => {
  const s = [1, 2, 3].map((n, i) => ({ periodo: '2026-10-0' + (i + 1), quantidade: n }));
  assert.equal(classificar(s, 'quantidade', 'dia'), 'Crescente');
  assert.equal(classificar(s.slice(1), 'quantidade', 'dia'), 'Dados insuficientes');
  assert.equal(classificar(s.map(p => ({ ...p, quantidade: 2 })), 'quantidade', 'dia'), 'Estável');
  assert.equal(classificar(s.map((p, i) => ({ ...p, quantidade: 3 - i })), 'quantidade', 'dia'), 'Decrescente');
  assert.equal(classificar(s.map((p, i) => ({ ...p, quantidade: [1, 3, 2][i] })), 'quantidade', 'dia'), 'Oscilante');
});
for (const query of [{}, { id_obra: '0' }, { id_obra: '1 OR 1=1' }, { id_obra: ['1', '2'] }, { id_obra: '1', inicio: '2026-02-30' }, { id_obra: '1', inicio: '2026-10-02', fim: '2026-10-01' }, { id_obra: '1', fonte: 'fake' }, { id_obra: '1', agrupamento: 'ano' }, { id_obra: '1', etapa: 'fake' }, { id_obra: '1', turno: 'fake' }, { id_obra: '1', clima: 'fake' }, { id_obra: '1', tipo: 'fake' }, { id_obra: '1', origem_atraso: 'A', origem_paralisacao: 'B' }, { id_obra: '1', tipo: 'atraso', origem_paralisacao: 'B' }, { id_obra: '1', id_construtora: '2' }]) test('Filtro inválido: ' + JSON.stringify(query), () => assert.throws(() => validarFiltros(query), { status: 400 }));
for (const key of ['id_equipe', 'id_maquinario', 'id_insumo']) test('Filtro sem relacionamento explícito: ' + key, () => assert.throws(() => validarFiltros({ id_obra: '1', [key]: '1' }), { status: 422 }));
test('Filtros combinados válidos preservam valores reais', () => assert.deepEqual(validarFiltros({ id_obra: '1', fonte: 'rdo', inicio: '2026-10-01', fim: '2026-10-28', tipo: 'atraso', turno: 'Manhã' }), { id_obra: 1, fonte: 'rdo', agrupamento: 'dia', inicio: '2026-10-01', fim: '2026-10-28', tipo: 'atraso', turno: 'Manhã' }));
