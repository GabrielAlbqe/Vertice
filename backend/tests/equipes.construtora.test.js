
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { randomBytes } = require('node:crypto');
const bcrypt = require('bcryptjs');

// Configurar antes de carregar o backend.
process.env.NODE_ENV = 'test';
process.env.DB_NAME = 'valen_testes';

const request = require('supertest');
const connection = require('../config/connection');
const app = require('../app');

const stamp = Date.now();
const senha = randomBytes(18).toString('hex');
const ids = { empresas: [], usuarios: [], obras: [], equipes: [] };

const query = (sql, values = []) => new Promise((resolve, reject) => {
  connection.query(sql, values, (err, rows) => err ? reject(err) : resolve(rows));
});

async function conferirBanco() {
  const rows = await query('SELECT DATABASE() AS banco');
  assert.equal(rows[0].banco, 'valen_testes', 'Banco de dados incorreto: operação cancelada');
}

function status(res, esperado) {
  assert.equal(res.status, esperado,
    `Esperado HTTP ${esperado}, recebido ${res.status}: ${JSON.stringify(res.body)}`);
}

async function empresa(n) {
  const r = await query('INSERT INTO construtora (cnpj, razao_social) VALUES (?, ?)', [
    String(stamp).slice(-12).padStart(12, '0') + String(n).repeat(2),
    `Construtora Teste Equipes ${stamp} ${n}`
  ]);
  ids.empresas.push(r.insertId);
  return r.insertId;
}

async function usuario(idEmpresa, n) {
  const email = `eq_${stamp}_${n}@vertice.local`;
  const hash = await bcrypt.hash(senha, 10);
  const r = await query(`INSERT INTO usuario
    (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [`Teste Equipes ${n}`, email, hash, 'Ativo', 'Gerência', 'Escritório', idEmpresa]);
  ids.usuarios.push(r.insertId);
  const login = await request(app).post('/api/usuarios/login').send({ email, senha });
  status(login, 200);
  assert.ok(login.body.token, 'Login não retornou token');
  return login.body.token;
}

async function obra(idEmpresa, n) {
  const r = await query(`INSERT INTO obra
    (nome, status, id_construtora, categoria, numero_pavimentos,
      data_inicio_planejada, data_termino_planejada, orcamento_planejado)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)`, [
      `Obra equipes teste ${stamp} ${n}`, 'Em Andamento', idEmpresa,
      'Residencial', 2, '2026-10-01', '2027-10-01', 100000
    ]);
  ids.obras.push(r.insertId);
  return r.insertId;
}

async function limpar() {
  await conferirBanco();
  for (const [tabela, coluna, valores] of [
    ['cadastro_de_equipes', 'id_cadastro_equipes', ids.equipes],
    ['obra', 'id_obra', ids.obras],
    ['usuario', 'id_usuario', ids.usuarios],
    ['construtora', 'id_construtora', ids.empresas]
  ]) {
    for (const id of [...valores].reverse()) {
      await query(`DELETE FROM ${tabela} WHERE ${coluna} = ?`, [id]);
    }
  }
}

const auth = (req, token) => req.set('Authorization', `Bearer ${token}`);
const cadastro = {
  nome_equipe: 'Equipe Automática',
  etapa_atuacao: 'Infraestrutura',
  quantidade_profissionais: 5,
  custo_diario: 700,
  custo_mensal: 15400,
  idobra: null
};

test('VÉRTICE - isolamento de equipes por construtora', { timeout: 60000 }, async t => {
  try {
    await conferirBanco();
    const a = await empresa(1);
    const b = await empresa(2);
    const tokenA = await usuario(a, 1);
    const tokenB = await usuario(b, 2);
    const obraA = await obra(a, 1);
    const obraB = await obra(b, 2);
    let idEquipe;

    await t.test('Negar acesso sem JWT', async () => {
      status(await request(app).get('/api/equipes'), 401);
    });

    await t.test('Cadastrar equipe com a construtora do JWT', async () => {
      const res = await auth(request(app).post('/api/equipes/insert'), tokenA)
        .send({ ...cadastro, id_construtora: b });
      status(res, 201);
      idEquipe = res.body.insertId;
      assert.ok(Number.isSafeInteger(idEquipe) && idEquipe > 0);
      ids.equipes.push(idEquipe);
      const rows = await query(
        'SELECT idobra, id_construtora FROM cadastro_de_equipes WHERE id_cadastro_equipes = ?',
        [idEquipe]
      );
      assert.equal(rows[0].idobra, null);
      assert.equal(rows[0].id_construtora, a);
    });

    await t.test('Empresa B não visualiza equipe A pelo ID', async () => {
      status(await auth(request(app).get(`/api/equipes/${idEquipe}`), tokenB), 404);
    });

    await t.test('Empresa B não visualiza equipe A na lista', async () => {
      const res = await auth(request(app).get('/api/equipes'), tokenB);
      status(res, 200);
      assert.ok(Array.isArray(res.body));
      assert.equal(res.body.some(x => Number(x.id_cadastro_equipes) === idEquipe), false);
    });

    await t.test('Empresa B não altera a equipe A', async () => {
      status(await auth(request(app).patch(`/api/equipes/${idEquipe}/obra`), tokenB)
        .send({ idobra: obraB }), 404);
    });

    await t.test('Empresa A não vincula equipe à obra B', async () => {
      status(await auth(request(app).patch(`/api/equipes/${idEquipe}/obra`), tokenA)
        .send({ idobra: obraB }), 404);
    });

    await t.test('Empresa A vincula equipe à própria obra', async () => {
      status(await auth(request(app).patch(`/api/equipes/${idEquipe}/obra`), tokenA)
        .send({ idobra: obraA }), 200);
      const res = await auth(request(app).get(`/api/equipes/${idEquipe}`), tokenA);
      status(res, 200);
      assert.equal(Number(res.body.idobra), obraA);
    });

    await t.test('Desatribuição preserva construtora proprietária', async () => {
      status(await auth(request(app).patch(`/api/equipes/${idEquipe}/obra`), tokenA)
        .send({ idobra: null }), 200);
      const rows = await query(
        'SELECT idobra, id_construtora FROM cadastro_de_equipes WHERE id_cadastro_equipes = ?',
        [idEquipe]
      );
      assert.equal(rows[0].idobra, null);
      assert.equal(rows[0].id_construtora, a);
    });

    await t.test('Empresa B não exclui equipe A', async () => {
      status(await auth(request(app).delete(`/api/equipes/del/${idEquipe}`), tokenB), 404);
      const rows = await query(
        'SELECT id_cadastro_equipes FROM cadastro_de_equipes WHERE id_cadastro_equipes = ?',
        [idEquipe]
      );
      assert.equal(rows.length, 1);
    });

    await t.test('Empresa B não edita cadastro da equipe A', async () => {
      status(await auth(request(app).put(`/api/equipes/insert/${idEquipe}`), tokenB)
        .send(cadastro), 404);
    });
  } finally {
    try {
      await limpar();
    } finally {
      await new Promise(resolve => connection.end(resolve));
    }
  }
});
