
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

// Proteção: testes somente no banco separado.
process.env.NODE_ENV = "test";
process.env.DB_NAME = "valen_testes";

const request = require("supertest");
const connection = require("../config/connection");
const app = require("../app");

const identificador = Date.now();
const senha = randomBytes(18).toString("hex");

const ids = {
  construtoras: [],
  usuarios: [],
  obras: [],
  insumos: []
};

function sql(comando, parametros = []) {
  return new Promise((resolve, reject) => {
    connection.query(comando, parametros, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });
}

function verificar(resposta, status) {
  assert.equal(
    resposta.status,
    status,
    `Esperado HTTP ${status}, recebido ${resposta.status}: ` +
      JSON.stringify(resposta.body)
  );
}

async function protegerBanco() {
  const registros = await sql("SELECT DATABASE() AS banco");

  assert.equal(
    registros[0].banco,
    "valen_testes",
    "Execução bloqueada: banco diferente de valen_testes."
  );
}

async function criarConstrutora(numero) {
  const resultado = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      `${String(identificador).slice(-12).padStart(12, "0")}${numero}${numero}`,
      `Construtora Automática ${numero}`
    ]
  );

  ids.construtoras.push(resultado.insertId);
  return resultado.insertId;
}

async function criarUsuario(construtora, numero) {
  const email = `teste_${identificador}_${numero}@vertice.local`;
  const hash = await bcrypt.hash(senha, 10);

  const resultado = await sql(
    `INSERT INTO usuario
      (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `Usuário Teste ${numero}`,
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      construtora
    ]
  );

  ids.usuarios.push(resultado.insertId);
  return { email, senha };
}

async function criarObra(construtora, numero) {
  const resultado = await sql(
    `INSERT INTO obra
      (
        nome, status, id_construtora, categoria,
        numero_pavimentos, data_inicio_planejada,
        data_termino_planejada, orcamento_planejado
      )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `Obra Teste ${numero}`,
      "Em Andamento",
      construtora,
      "Residencial",
      2,
      "2026-10-01",
      "2027-10-01",
      100000
    ]
  );

  ids.obras.push(resultado.insertId);
  return resultado.insertId;
}

async function fazerLogin(credenciais) {
  const resposta = await request(app)
    .post("/api/usuarios/login")
    .send(credenciais);

  verificar(resposta, 200);
  assert.ok(resposta.body.token);

  return resposta.body.token;
}

function autenticar(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function limpar() {
  await protegerBanco();

  const tarefas = [
    ["cadastro_de_insumos", "id_insumos", ids.insumos],
    ["obra", "id_obra", ids.obras],
    ["usuario", "id_usuario", ids.usuarios],
    ["construtora", "id_construtora", ids.construtoras]
  ];

  for (const [tabela, coluna, valores] of tarefas) {
    for (const id of [...valores].reverse()) {
      await sql(
        `DELETE FROM ${tabela} WHERE ${coluna} = ?`,
        [id]
      );
    }
  }
}

test("VÉRTICE - Segurança de insumos por construtora", {
  timeout: 60000
}, async (t) => {
  try {
    await protegerBanco();

    // Duas empresas independentes.
    const empresaA = await criarConstrutora(1);
    const empresaB = await criarConstrutora(2);

    const credenciaisA = await criarUsuario(empresaA, 1);
    const credenciaisB = await criarUsuario(empresaB, 2);

    const obraA = await criarObra(empresaA, 1);
    const obraB = await criarObra(empresaB, 2);

    const tokenA = await fazerLogin(credenciaisA);
    const tokenB = await fazerLogin(credenciaisB);

    let idInsumo;

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get("/api/insumos");

      verificar(resposta, 401);
    });

    await t.test("Cadastrar insumo na empresa A", async () => {
      const resposta = await autenticar(
        request(app).post("/api/insumos/insert"),
        tokenA
      ).send({
        nome: "Cimento Automático",
        quantidade_disponivel: 100,
        valor_unitario: 40,
        idobra: null,

        // Tentativa de falsificar a proprietária.
        id_construtora: empresaB
      });

      verificar(resposta, 201);
      idInsumo = resposta.body.insertId;

      assert.ok(idInsumo);
      ids.insumos.push(idInsumo);

      const registros = await sql(
        `SELECT id_construtora, idobra
         FROM cadastro_de_insumos
         WHERE id_insumos = ?`,
        [idInsumo]
      );

      assert.equal(registros[0].id_construtora, empresaA);
      assert.equal(registros[0].idobra, null);
    });

    await t.test("Empresa B não pode consultar insumo A", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/insumos/${idInsumo}`),
        tokenB
      );

      verificar(resposta, 404);
    });

    await t.test("Empresa B não pode alterar insumo A", async () => {
      const resposta = await autenticar(
        request(app).patch(`/api/insumos/${idInsumo}/obra`),
        tokenB
      ).send({ idobra: obraB });

      verificar(resposta, 404);
    });

    await t.test("Empresa A não pode utilizar obra B", async () => {
      const resposta = await autenticar(
        request(app).patch(`/api/insumos/${idInsumo}/obra`),
        tokenA
      ).send({ idobra: obraB });

      verificar(resposta, 404);
    });

    await t.test("Empresa A pode atribuir à própria obra", async () => {
      const resposta = await autenticar(
        request(app).patch(`/api/insumos/${idInsumo}/obra`),
        tokenA
      ).send({ idobra: obraA });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(`/api/insumos/${idInsumo}`),
        tokenA
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.idobra, obraA);
    });

    await t.test("Desatribuir sem perder a propriedade", async () => {
      const resposta = await autenticar(
        request(app).patch(`/api/insumos/${idInsumo}/obra`),
        tokenA
      ).send({ idobra: null });

      verificar(resposta, 200);

      const registros = await sql(
        `SELECT idobra, id_construtora
         FROM cadastro_de_insumos
         WHERE id_insumos = ?`,
        [idInsumo]
      );

      assert.equal(registros[0].idobra, null);
      assert.equal(registros[0].id_construtora, empresaA);
    });

    await t.test("Listagem não revela recursos de outra empresa", async () => {
      const resposta = await autenticar(
        request(app).get("/api/insumos"),
        tokenB
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.equal(
        resposta.body.some(
          (insumo) => Number(insumo.id_insumos) === idInsumo
        ),
        false
      );
    });

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise((resolve) => connection.end(resolve));
    }
  }
});
