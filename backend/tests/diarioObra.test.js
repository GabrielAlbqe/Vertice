
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
  diarios: []
};

function sql(comando, parametros = []) {
  return new Promise((resolve, reject) => {
    connection.query(comando, parametros, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });
}

function verificar(resposta, statusEsperado) {
  assert.equal(
    resposta.status,
    statusEsperado,
    `Esperado HTTP ${statusEsperado}, recebido ` +
      `${resposta.status}: ${JSON.stringify(resposta.body)}`
  );
}

async function conferirBanco() {
  const resultado = await sql("SELECT DATABASE() AS banco");

  assert.equal(
    resultado[0].banco,
    "valen_testes",
    "Teste interrompido: banco incorreto."
  );
}

function autenticar(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function prepararAmbiente() {
  const empresa = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste Diario de Obra"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  const email =
    `diario_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste Diario",
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
      "Obra Temporaria Diario",
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
    idObra: obra.insertId,
    idUsuario: usuario.insertId
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["diario_obra", "id_diario", ids.diarios],
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

test("VERTICE - gerenciamento de Diario de Obra", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idObra, idUsuario } =
      await prepararAmbiente();

    let idDiario;

    const dados = {
      data: "2026-10-21",
      clima: "Ensolarado",
      turno: "Manhã",
      etapa_atuacao: "Infraestrutura",
      equipe_interna: "A",
      equipe_terceirizada: "B",
      paralisacoes: "Nenhuma",
      origem_paralisacoes: null,
      atrasos: "Nenhum",
      origem_atrasos: null,
      id_obra: idObra,
      usuario_id: idUsuario
    };

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get(`/api/diarios-obra?id_obra=${idObra}`);

      verificar(resposta, 401);
    });

    await t.test("Exigir ID da obra", async () => {
      const resposta = await autenticar(
        request(app).get("/api/diarios-obra"),
        token
      );

      verificar(resposta, 400);
    });

    await t.test("Cadastrar Diario de Obra", async () => {
      const resposta = await autenticar(
        request(app).post("/api/diarios-obra/insert"),
        token
      ).send(dados);

      verificar(resposta, 201);

      idDiario = resposta.body.insertId;

      assert.ok(
        Number.isSafeInteger(idDiario) && idDiario > 0,
        "O cadastro deve retornar insertId."
      );

      ids.diarios.push(idDiario);
    });

    await t.test("Consultar diario por ID", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/diarios-obra/${idDiario}`),
        token
      );

      verificar(resposta, 200);

      assert.equal(
        Number(resposta.body.id_diario),
        idDiario
      );

      assert.equal(resposta.body.turno, "Manhã");

      assert.equal(
        Number(resposta.body.obrax_id),
        idObra
      );
    });

    await t.test("Listar diarios usando id_obra", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/diarios-obra?id_obra=${idObra}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          item => Number(item.id_diario) === idDiario
        )
      );
    });

    await t.test("Listar diarios usando obrax_id", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/diarios-obra?obrax_id=${idObra}`
        ),
        token
      );

      verificar(resposta, 200);

      assert.ok(
        resposta.body.some(
          item => Number(item.id_diario) === idDiario
        )
      );
    });

    await t.test("Atualizar Diario de Obra", async () => {
      const resposta = await autenticar(
        request(app).put(
          `/api/diarios-obra/insert/${idDiario}`
        ),
        token
      ).send({
        ...dados,
        clima: "Chuvoso",
        turno: "Tarde",
        atrasos: "Entrega de material atrasada"
      });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(`/api/diarios-obra/${idDiario}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.clima, "Chuvoso");
      assert.equal(consulta.body.turno, "Tarde");

      assert.equal(
        consulta.body.atrasos,
        "Entrega de material atrasada"
      );
    });

    await t.test("Rejeitar data invalida", async () => {
      const resposta = await autenticar(
        request(app).post("/api/diarios-obra/insert"),
        token
      ).send({
        ...dados,
        data: "2026-02-30"
      });

      verificar(resposta, 400);
    });

    await t.test("Rejeitar obra ausente", async () => {
      const resposta = await autenticar(
        request(app).post("/api/diarios-obra/insert"),
        token
      ).send({
        ...dados,
        id_obra: null
      });

      verificar(resposta, 400);
    });

    await t.test("Excluir Diario de Obra", async () => {
      const resposta = await autenticar(
        request(app).delete(
          `/api/diarios-obra/del/${idDiario}`
        ),
        token
      );

      verificar(resposta, 200);

      ids.diarios = ids.diarios.filter(
        id => id !== idDiario
      );
    });

    await t.test("Consultar diario excluido", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/diarios-obra/${idDiario}`),
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
