const { test, beforeEach } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
process.env.NODE_ENV = 'test'; process.env.DB_NAME = 'valen_testes'; process.env.JWT_SECRET = randomBytes(48).toString('hex');
const jwt = require('jsonwebtoken'), request = require('supertest');
const calls = [];
const { AsyncLocalStorage } = require('node:async_hooks');
let role, ambiente, status, tenant, companyStatus, failure;
const docs = [{ id_registro: 'rdo:1', id_obra: 1, data: '2026-10-01', turno: 'Manhã', clima: 'Chuvoso' }];
const events = [{ id: 'atraso:1', id_registro: 'rdo:1', id_obra: 1, data: '2026-10-01', turno: 'Manhã', clima: 'Chuvoso', etapa: 'Infraestrutura', tipo: 'atraso', origem: 'Equipes', duracao: '1.50', descricao: null }];
const mock = { context: new AsyncLocalStorage(), getConnection(cb) { cb(null,{ release(){}, promise(){return {async beginTransaction(){},async commit(){},async rollback(){}};} }); }, query(sql, params, cb) {
  calls.push({ sql, params });
  queueMicrotask(() => {
    if (failure) return cb(new Error('Informação SQL privada'));
    if (sql.startsWith('SELECT u.id_usuario')) return cb(null, [{ id_usuario: 1, idconstrutora: tenant, status, ocupacao: role, ambiente, status_construtora: companyStatus }]);
    if (sql.startsWith('SELECT id_obra,nome FROM obra WHERE id_obra')) return cb(null, params[0] === 1 && params[1] === 1 ? [{ id_obra: 1, nome: 'Obra A' }] : []);
    if (sql.startsWith('SELECT id_obra,nome FROM obra WHERE id_construtora')) return cb(null, params[0] === 1 ? [{ id_obra: 1, nome: 'Obra A' }] : []);
    if (sql.startsWith('SELECT b.*')) return cb(null, docs);
    if (sql.startsWith('SELECT ev.*')) return cb(null, events);
    if (sql.startsWith('SELECT DISTINCT')) return cb(null, [{ origem: 'Equipes' }]);
    if (sql.includes('FROM cadastro_de_')) return cb(null, [{ id: 1, nome: 'Recurso A' }]);
    cb(new Error('Consulta não prevista'));
  });
} };
require.cache[require.resolve('../../config/connection')] = { id: require.resolve('../../config/connection'), filename: require.resolve('../../config/connection'), loaded: true, exports: mock };
const app = require('../../app');
beforeEach(() => { calls.length = 0; role = 'Gerência'; ambiente = 'Escritório'; status = 'Ativo'; tenant = 1; companyStatus = 'Ativo'; failure = false; });
const token = (company = 1) => jwt.sign({ id_usuario: 1, idconstrutora: company }, process.env.JWT_SECRET, { algorithm: 'HS256', expiresIn: '1h' });
const get = (query = 'id_obra=1&fonte=rdo') => request(app).get('/api/inteligencia-operacional?' + query).set('Authorization', 'Bearer ' + token());
test('Inteligência sem JWT é bloqueada antes do banco', async () => { assert.equal((await request(app).get('/api/inteligencia-operacional?id_obra=1')).status, 401); assert.equal(calls.length, 0); });
test('JWT inválido é bloqueado', async () => { assert.equal((await request(app).get('/api/inteligencia-operacional?id_obra=1').set('Authorization', 'Bearer invalido')).status, 401); });
test('Obra de outra empresa não é acessível', async () => { const r = await get('id_obra=2'); assert.equal(r.status, 404); assert.ok(!calls.some(c => c.sql.startsWith('SELECT ev.*'))); });
test('Usuário de outra empresa não acessa a obra A', async () => { tenant = 2; const r = await request(app).get('/api/inteligencia-operacional?id_obra=1').set('Authorization', 'Bearer ' + token(2)); assert.equal(r.status, 404); });
test('Token com vínculo antigo perde acesso', async () => { tenant = 2; assert.equal((await get()).status, 403); });
for (const change of ['perfil', 'ambiente', 'inativo', 'empresa']) test('Bloqueia acesso sem permissão: ' + change, async () => {
  if (change === 'perfil') role = 'Operacional'; if (change === 'ambiente') ambiente = 'Canteiro'; if (change === 'inativo') status = 'Inativo'; if (change === 'empresa') companyStatus = 'Inativo';
  assert.equal((await get()).status, 403);
});
test('Gerência do escritório recebe cálculos e apenas a obra autorizada', async () => {
  const r = await get(); assert.equal(r.status, 200, JSON.stringify(r.body)); assert.equal(r.body.resumo.total_ocorrencias, 1); assert.equal(r.body.resumo.duracao_acumulada, 1.5);
  const queries = calls.filter(c => c.sql.startsWith('SELECT b.*') || c.sql.startsWith('SELECT ev.*'));
  assert.equal(queries.length, 2);
  assert.ok(queries.every(c => c.sql.includes('o.id_construtora=?') && c.params[0] === 1 && c.params[1] === 1));
  assert.ok(queries.every(c => !c.sql.includes('JOIN rdo_equipe') && !c.sql.includes('JOIN rdo_maquinario')));
});
test('Filtros combinados são aplicados no SQL com parâmetros', async () => {
  const r = await get('id_obra=1&fonte=rdo&inicio=2026-10-01&fim=2026-10-28&etapa=Infraestrutura&turno=Manh%C3%A3&clima=Chuvoso&tipo=atraso');
  assert.equal(r.status, 200); const q = calls.find(c => c.sql.startsWith('SELECT ev.*'));
  for (const condition of ['ev.data>=?', 'ev.data<=?', 'ev.etapa=?', 'ev.tipo=?']) assert.ok(q.sql.includes(condition));
  for (const value of ['2026-10-01', '2026-10-28', 'Infraestrutura', 'Manhã', 'Chuvoso', 'atraso']) assert.ok(q.params.includes(value));
});
test('Origem textual não é interpolada em SQL', async () => {
  const text = "' OR 1=1 --"; const r = await get('id_obra=1&fonte=rdo&origem_atraso=' + encodeURIComponent(text));
  assert.equal(r.status, 200); const q = calls.find(c => c.sql.startsWith('SELECT ev.*')); assert.ok(!q.sql.includes(text)); assert.ok(q.params.includes(text));
});
test('Metadados e opções estão restritos à construtora da sessão', async () => {
  const r = await request(app).get('/api/inteligencia-operacional/filtros?id_obra=1&fonte=rdo').set('Authorization', 'Bearer ' + token());
  assert.equal(r.status, 200, JSON.stringify(r.body)); assert.deepEqual(r.body.obras.map(o => o.id_obra), [1]); assert.equal(r.body.recursos_disponiveis, false);
  assert.ok(calls.filter(c => c.sql.includes('FROM cadastro_de_')).every(c => c.sql.includes('id_construtora=?') && c.params[0] === 1));
});
test('Filtro por recurso sem vínculo retorna 422', async () => { const r = await get('id_obra=1&id_equipe=1'); assert.equal(r.status, 422); assert.match(r.body.message, /vínculo direto/); });
test('Dados de outra empresa nos metadados são bloqueados', async () => { assert.equal((await request(app).get('/api/inteligencia-operacional/filtros?id_obra=2').set('Authorization', 'Bearer ' + token())).status, 404); });
test('Erro interno não revela SQL', async () => { failure = true; const r = await get(); assert.equal(r.status, 500); assert.ok(!JSON.stringify(r.body).includes('privada')); });
test('Rotas não permitem escrita', async () => { const r = await request(app).post('/api/inteligencia-operacional').set('Authorization', 'Bearer ' + token()).send({}); assert.equal(r.status, 405); assert.equal(r.headers.allow, 'GET'); assert.ok(!calls.some(c=>/^\s*(INSERT|UPDATE|DELETE)/.test(c.sql))); });
