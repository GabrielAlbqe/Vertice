
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
const ids = { construtoras: [], usuarios: [] };

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
    `HTTP esperado: ${esperado}; recebido: ${resposta.status}. ` +
      JSON.stringify(resposta.body)
  );
}

async function conferirBanco() {
  const resultado = await sql("SELECT DATABASE() AS banco");

  assert.equal(
    resultado[0].banco,
    "valen_testes",
    "Execução cancelada: banco incorreto."
  );
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

function autenticado(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

test("VÉRTICE - gerenciamento de usuários", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const empresa = await sql(
      `INSERT INTO construtora (cnpj, razao_social)
       VALUES (?, ?)`,
      [
        randomBytes(7).toString("hex"),
        "Construtora Teste Usuários"
      ]
    );

    ids.construtoras.push(empresa.insertId);

    const emailAdmin =
      `admin_${randomBytes(8).toString("hex")}@vertice.local`;

    const hash = await bcrypt.hash(senha, 10);

    const admin = await sql(
      `INSERT INTO usuario
       (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        "Administrador Teste",
        emailAdmin,
        hash,
        "Ativo",
        "Gerência",
        "Escritório",
        empresa.insertId
      ]
    );

    ids.usuarios.push(admin.insertId);

    let token;
    let idUsuario;

    const email =
      `usuario_${randomBytes(8).toString("hex")}@vertice.local`;

    await t.test("Realizar login", async () => {
      const resposta = await request(app)
        .post("/api/usuarios/login")
        .send({
          email: emailAdmin,
          senha
        });

      verificar(resposta, 200);

      assert.ok(resposta.body.token);
      assert.ok(resposta.body.usuario);
      assert.equal(resposta.body.usuario.senha, undefined);

      token = resposta.body.token;
    });

    await t.test("Cadastrar usuário", async () => {
      const resposta = await request(app)
        .post("/api/usuarios/insert")
        .send({
          nome: "Usuário Automatizado",
          email,
          senha,
          ocupacao: "Gerência",
          ambiente: "Escritório",
          status: "Ativo",
          idconstrutora: empresa.insertId
        });

      verificar(resposta, 201);

      idUsuario = resposta.body.insertId;
      assert.ok(Number.isSafeInteger(idUsuario) && idUsuario > 0);

      ids.usuarios.push(idUsuario);
    });

    await t.test("Consultar usuário por ID", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/usuarios/${idUsuario}`),
        token
      );

      verificar(resposta, 200);
      assert.equal(resposta.body.nome, "Usuário Automatizado");
      assert.equal(resposta.body.senha, undefined);
    });

    await t.test("Listar usuários", async () => {
      const resposta = await autenticado(
        request(app).get("/api/usuarios"),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          (usuario) => Number(usuario.id_usuario) === idUsuario
        )
      );
    });

    await t.test("Filtrar usuários por construtora", async () => {
      const resposta = await autenticado(
        request(app).get(
          `/api/usuarios?idconstrutora=${empresa.insertId}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          (usuario) => Number(usuario.id_usuario) === idUsuario
        )
      );

      assert.ok(
        resposta.body.every(
          (usuario) =>
            Number(usuario.idconstrutora) === empresa.insertId
        )
      );
    });

    await t.test("Atualizar usuário", async () => {
      const resposta = await autenticado(
        request(app).put(`/api/usuarios/insert/${idUsuario}`),
        token
      ).send({
        nome: "Usuário Atualizado"
      });

      verificar(resposta, 200);

      const consulta = await autenticado(
        request(app).get(`/api/usuarios/${idUsuario}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.nome, "Usuário Atualizado");
    });

    await t.test("Rejeitar login incorreto", async () => {
      const resposta = await request(app)
        .post("/api/usuarios/login")
        .send({
          email,
          senha: "senha-incorreta"
        });

      verificar(resposta, 401);
    });

    await t.test("Excluir usuário", async () => {
      const resposta = await autenticado(
        request(app).delete(`/api/usuarios/del/${idUsuario}`),
        token
      );

      verificar(resposta, 200);

      ids.usuarios = ids.usuarios.filter(
        (id) => id !== idUsuario
      );
    });

    await t.test("Consultar usuário excluído", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/usuarios/${idUsuario}`),
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
