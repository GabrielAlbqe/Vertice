
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
  etapas: [],
  atividades: []
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
    "Execução cancelada: banco incorreto."
  );
}

function autenticado(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function prepararAmbiente() {
  const empresa = await sql(
    "INSERT INTO construtora (cnpj, razao_social) VALUES (?, ?)",
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste EAP"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  const email =
    `eap_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste EAP",
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
      "Obra Temporaria EAP",
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
    ["atividade_eap", "id_atividade", ids.atividades],
    ["etapa", "id_etapa", ids.etapas],
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

test("VERTICE - EAP e etapas", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idObra } = await prepararAmbiente();

    let idEtapa;
    let idAtividade;

    await t.test("Cadastrar etapa", async () => {
      const resposta = await autenticado(
        request(app).post("/api/etapas/insert"),
        token
      ).send({
        id_obra: idObra,
        nome_etapa: "Infraestrutura",
        descricao: "Fundacoes da obra"
      });

      verificar(resposta, 201);

      idEtapa = resposta.body.insertId;
      assert.ok(idEtapa > 0);
      ids.etapas.push(idEtapa);
    });

    await t.test("Consultar etapa", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/etapas/${idEtapa}`),
        token
      );

      verificar(resposta, 200);
      assert.equal(resposta.body.nome_etapa, "Infraestrutura");
    });

    await t.test("Filtrar etapas por obra", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/etapas?id_obra=${idObra}`),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          etapa => Number(etapa.id_etapa) === idEtapa
        )
      );
    });

    await t.test("Atualizar etapa", async () => {
      const resposta = await autenticado(
        request(app).put(`/api/etapas/insert/${idEtapa}`),
        token
      ).send({
        id_obra: idObra,
        nome_etapa: "Instalações",
        descricao: "Instalacoes da obra"
      });

      verificar(resposta, 200);

      const consulta = await autenticado(
        request(app).get(`/api/etapas/${idEtapa}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(consulta.body.nome_etapa, "Instalações");
    });

    await t.test("Cadastrar atividade EAP", async () => {
      const resposta = await autenticado(
        request(app).post("/api/atividades-eap/insert"),
        token
      ).send({
        descricao: "Preparar fundacoes",
        id_obra: idObra
      });

      verificar(resposta, 201);

      idAtividade = resposta.body.insertId;
      assert.ok(idAtividade > 0);
      ids.atividades.push(idAtividade);
    });

    await t.test("Consultar atividade EAP", async () => {
      const resposta = await autenticado(
        request(app).get(`/api/atividades-eap/${idAtividade}`),
        token
      );

      verificar(resposta, 200);
      assert.equal(resposta.body.descricao, "Preparar fundacoes");
    });

    await t.test("Listar atividades da obra", async () => {
      const resposta = await autenticado(
        request(app).get(
          `/api/atividades-eap?id_obra=${idObra}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          atividade =>
            Number(atividade.id_atividade) === idAtividade
        )
      );
    });

    await t.test("Atualizar atividade EAP", async () => {
      const resposta = await autenticado(
        request(app).put(
          `/api/atividades-eap/insert/${idAtividade}`
        ),
        token
      ).send({
        descricao: "Executar fundacoes",
        id_obra: idObra
      });

      verificar(resposta, 200);

      const consulta = await autenticado(
        request(app).get(
          `/api/atividades-eap/${idAtividade}`
        ),
        token
      );

      verificar(consulta, 200);
      assert.equal(
        consulta.body.descricao,
        "Executar fundacoes"
      );
    });

    await t.test("Excluir atividade EAP", async () => {
      const resposta = await autenticado(
        request(app).delete(
          `/api/atividades-eap/del/${idAtividade}`
        ),
        token
      );

      verificar(resposta, 200);
      ids.atividades = ids.atividades.filter(
        id => id !== idAtividade
      );
    });

    await t.test("Excluir etapa", async () => {
      const resposta = await autenticado(
        request(app).delete(`/api/etapas/del/${idEtapa}`),
        token
      );

      verificar(resposta, 200);
      ids.etapas = ids.etapas.filter(id => id !== idEtapa);
    });

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise(resolve => connection.end(resolve));
    }
  }
});
