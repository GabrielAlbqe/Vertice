
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

process.env.NODE_ENV = "test";
process.env.DB_NAME = "valen_testes";

const request = require("supertest");
const connection = require("../config/connection");
const app = require("../app");

const ids = {
  construtoras: [],
  usuarios: [],
  obras: [],
  rdos: []
};

function sql(comando, parametros = []) {
  return new Promise((resolve, reject) => {
    connection.query(comando, parametros, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });
}

function verificar(resposta, esperado) {
  assert.equal(
    resposta.status,
    esperado,
    `Esperado HTTP ${esperado}, recebido ${resposta.status}: ` +
      JSON.stringify(resposta.body)
  );
}

async function conferirBanco() {
  const resultado = await sql("SELECT DATABASE() AS banco");

  assert.equal(
    resultado[0].banco,
    "valen_testes",
    "Operação cancelada: banco incorreto."
  );
}

function autenticado(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function prepararAmbiente() {
  const empresa = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste RDO"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  const email =
    `rdo_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste RDO",
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      empresa.insertId
    ]
  );

  ids.usuarios.push(usuario.insertId);

  const obra = await sql(
    `INSERT INTO obra
     (nome, status, id_construtora, categoria,
      numero_pavimentos, data_inicio_planejada,
      data_termino_planejada, orcamento_planejado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Obra Temporaria RDO",
      "Em Andamento",
      empresa.insertId,
      "Residencial",
      3,
      "2026-10-01",
      "2027-10-01",
      150000
    ]
  );

  ids.obras.push(obra.insertId);

  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(login, 200);
  assert.ok(login.body.token);

  return {
    token: login.body.token,
    idObra: obra.insertId
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["rdo", "id_rdo", ids.rdos],
    ["obra", "id_obra", ids.obras],
    ["usuario", "id_usuario", ids.usuarios],
    ["construtora", "id_construtora", ids.construtoras]
  ];

  for (const [tabela, coluna, valores] of tabelas) {
    for (const id of [...valores].reverse()) {
      await sql(
        `DELETE FROM ${tabela} WHERE ${coluna} = ?`,
        [id]
      );
    }
  }
}

test("VERTICE - gerenciamento de RDO", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idObra } = await prepararAmbiente();

    let idRdo;

    const dadosRdo = {
      id_obra: idObra,
      data_rdo: "2026-10-21",
      turno: "Manhã",
      clima: "Ensolarado"
    };

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app).get("/api/rdo");

      verificar(resposta, 401);
    });

    await t.test("Exigir ID da obra na listagem", async () => {
      const resposta = await autenticado(
        request(app).get("/api/rdo"),
        token
      );

      verificar(resposta, 400);
    });

    await t.test("Cadastrar RDO", async () => {
      const resposta = await autenticado(
        request(app).post("/api/rdo/insert"),
        token
      ).send(dadosRdo);

      verificar(resposta, 201);

      idRdo = resposta.body.insertId;

      assert.ok(
        Number.isSafeInteger(idRdo) && idRdo > 0
      );

      ids.rdos.push(idRdo);
    });

    await t.test("Consultar RDO por ID", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/rdo/${idRdo}`),
        token
      );

      verificar(resposta, 200);

      assert.equal(resposta.body.turno, "Manhã");
      assert.equal(resposta.body.clima, "Ensolarado");
      assert.equal(Number(resposta.body.id_obra), idObra);
    });

    await t.test("Listar RDOs da obra", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/rdo?id_obra=${idObra}`),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          rdo => Number(rdo.id_rdo) === idRdo
        )
      );
    });

    await t.test("Atualizar RDO", async () => {
      const resposta = await autenticado(
        request(app).put(`/api/rdo/insert/${idRdo}`),
        token
      ).send({
        ...dadosRdo,
        turno: "Tarde",
        clima: "Nublado"
      });

      verificar(resposta, 200);

      const consulta = await autenticado(
        request(app).get(`/api/rdo/${idRdo}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.turno, "Tarde");
      assert.equal(consulta.body.clima, "Nublado");
    });

    await t.test("Rejeitar dados inválidos", async () => {
      const resposta = await autenticado(
        request(app).post("/api/rdo/insert"),
        token
      ).send({
        ...dadosRdo,
        turno: "Turno Inválido"
      });

      verificar(resposta, 400);
    });

    await t.test("Excluir RDO", async () => {
      const resposta = await autenticado(
        request(app).delete(`/api/rdo/del/${idRdo}`),
        token
      );

      verificar(resposta, 200);

      ids.rdos = ids.rdos.filter(id => id !== idRdo);
    });

    await t.test("Consultar RDO excluído", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/rdo/${idRdo}`),
        token
      );

      verificar(resposta, 404);
    });

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise(resolve => connection.end(resolve));
    }
  }
});
