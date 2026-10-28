
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

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
  obras: []
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
    "Teste cancelado: banco diferente de valen_testes."
  );
}

async function criarConstrutora() {
  const cnpj = randomBytes(7).toString("hex");

  const resultado = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [cnpj, `Construtora Teste Obras ${identificador}`]
  );

  ids.construtoras.push(resultado.insertId);
  return resultado.insertId;
}

async function criarUsuario(idConstrutora) {
  const email = `obras_${identificador}@vertice.local`;
  const hash = await bcrypt.hash(senha, 10);

  const resultado = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Teste Automatizado Obras",
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

  for (const id of [...ids.obras].reverse()) {
    await sql("DELETE FROM obra WHERE id_obra = ?", [id]);
  }

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

test("VÉRTICE - gerenciamento de obras", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const idConstrutora = await criarConstrutora();
    const token = await criarUsuario(idConstrutora);

    const dadosObra = {
      nome: "Obra Automatizada",
      status: "Em Andamento",
      id_construtora: idConstrutora,
      categoria: "Residencial",
      numero_pavimentos: 5,
      data_inicio_planejada: "2026-10-01",
      data_termino_planejada: "2027-10-01",
      orcamento_planejado: 250000
    };

    let idObra;

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app).get("/api/obras");
      verificar(resposta, 401);
    });

    await t.test("Cadastrar obra", async () => {
      const resposta = await autenticar(
        request(app).post("/api/obras/insert"),
        token
      ).send(dadosObra);

      verificar(resposta, 201);

      idObra = resposta.body.insertId;
      assert.ok(Number.isSafeInteger(idObra) && idObra > 0);

      ids.obras.push(idObra);
    });

    await t.test("Consultar obra pelo ID", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/obras/${idObra}`),
        token
      );

      verificar(resposta, 200);
      assert.equal(resposta.body.nome, dadosObra.nome);
    });

    await t.test("Listar obras", async () => {
      const resposta = await autenticar(
        request(app).get("/api/obras"),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          (obra) => Number(obra.id_obra) === idObra
        )
      );
    });

    await t.test("Filtrar obras por construtora", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/obras?idconstrutora=${idConstrutora}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          (obra) => Number(obra.id_obra) === idObra
        )
      );

      assert.ok(
        resposta.body.every(
          (obra) =>
            Number(obra.id_construtora) === idConstrutora
        )
      );
    });

    await t.test("Atualizar obra", async () => {
      const novosDados = {
        ...dadosObra,
        nome: "Obra Atualizada",
        orcamento_planejado: 300000
      };

      const resposta = await autenticar(
        request(app).put(`/api/obras/insert/${idObra}`),
        token
      ).send(novosDados);

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(`/api/obras/${idObra}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.nome, "Obra Atualizada");
      assert.equal(
        Number(consulta.body.orcamento_planejado),
        300000
      );
    });

    await t.test("Rejeitar cadastro inválido", async () => {
      const resposta = await autenticar(
        request(app).post("/api/obras/insert"),
        token
      ).send({
        ...dadosObra,
        nome: ""
      });

      verificar(resposta, 400);
    });

    await t.test("Consultar obra inexistente", async () => {
      const resposta = await autenticar(
        request(app).get("/api/obras/999999999"),
        token
      );

      verificar(resposta, 404);
    });

    await t.test("Excluir obra", async () => {
      const resposta = await autenticar(
        request(app).delete(`/api/obras/del/${idObra}`),
        token
      );

      verificar(resposta, 200);
      ids.obras = ids.obras.filter((id) => id !== idObra);

      const consulta = await autenticar(
        request(app).get(`/api/obras/${idObra}`),
        token
      );

      verificar(consulta, 404);
    });

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise((resolve) => connection.end(resolve));
    }
  }
});
