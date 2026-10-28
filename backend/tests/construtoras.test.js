
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

process.env.NODE_ENV = "test";
process.env.DB_NAME = "valen_testes";

const request = require("supertest");
const connection = require("../config/connection");
const app = require("../app");

const senha = randomBytes(18).toString("hex");

const ids = {
  construtoras: [],
  usuarios: []
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
    "Operação cancelada: banco de testes não selecionado."
  );
}

async function criarUsuarioTeste(idConstrutora) {
  const email = `construtora_${randomBytes(8).toString("hex")}@vertice.local`;
  const hash = await bcrypt.hash(senha, 10);

  const resultado = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuário Teste Construtoras",
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      idConstrutora
    ]
  );

  ids.usuarios.push(resultado.insertId);

  const resposta = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(resposta, 200);
  assert.ok(resposta.body.token);

  return resposta.body.token;
}

function autenticar(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function limpar() {
  await conferirBanco();

  for (const id of [...ids.usuarios].reverse()) {
    await sql("DELETE FROM usuario WHERE id_usuario = ?", [id]);
  }

  for (const id of [...ids.construtoras].reverse()) {
    await sql(
      "DELETE FROM construtora WHERE id_construtora = ?",
      [id]
    );
  }
}

test("VÉRTICE - gerenciamento de construtoras", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const empresaBase = await sql(
      `INSERT INTO construtora (cnpj, razao_social)
       VALUES (?, ?)`,
      [
        randomBytes(7).toString("hex"),
        "Construtora Base Teste"
      ]
    );

    ids.construtoras.push(empresaBase.insertId);

    const token = await criarUsuarioTeste(empresaBase.insertId);

    let idConstrutora;
    const cnpj = randomBytes(7).toString("hex");

    await t.test("Listar construtoras", async () => {
      const resposta = await autenticar(
        request(app).get("/api/construtoras"),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));
    });

    await t.test("Cadastrar construtora", async () => {
      const resposta = await autenticar(
        request(app).post("/api/construtoras/insert"),
        token
      ).send({
        cnpj,
        razao_social: "Construtora Automatizada"
      });

      verificar(resposta, 201);

      idConstrutora = resposta.body.insertId;
      assert.ok(Number.isSafeInteger(idConstrutora) && idConstrutora > 0);

      ids.construtoras.push(idConstrutora);
    });

    await t.test("Consultar construtora por ID", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/construtoras/${idConstrutora}`),
        token
      );

      verificar(resposta, 200);
      assert.equal(
        resposta.body.razao_social,
        "Construtora Automatizada"
      );
    });

    await t.test("Atualizar construtora", async () => {
      const resposta = await autenticar(
        request(app).put(`/api/construtoras/insert/${idConstrutora}`),
        token
      ).send({
        cnpj,
        razao_social: "Construtora Atualizada"
      });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(`/api/construtoras/${idConstrutora}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(
        consulta.body.razao_social,
        "Construtora Atualizada"
      );
    });

    await t.test("Excluir construtora", async () => {
      const resposta = await autenticar(
        request(app).delete(`/api/construtoras/del/${idConstrutora}`),
        token
      );

      verificar(resposta, 200);

      ids.construtoras = ids.construtoras.filter(
        (id) => id !== idConstrutora
      );
    });

    await t.test("Consultar construtora excluída", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/construtoras/${idConstrutora}`),
        token
      );

      verificar(resposta, 404);
    });

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise((resolve) => connection.end(resolve));
    }
  }
});
