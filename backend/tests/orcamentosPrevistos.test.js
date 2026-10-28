
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes, randomInt } = require("node:crypto");
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
  atividades: [],
  orcamentos: []
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
    "Teste cancelado: banco incorreto."
  );
}

function autenticar(requisicao, token) {
  return requisicao.set("Authorization", `Bearer ${token}`);
}

async function gerarIdOrcamento() {
  for (let tentativa = 0; tentativa < 30; tentativa++) {
    const id = randomInt(1000000000, 2000000000);

    const resultado = await sql(
      "SELECT id_orcamento FROM orcamento_previsto WHERE id_orcamento = ?",
      [id]
    );

    if (resultado.length === 0) return id;
  }

  throw new Error("Não foi possível encontrar um ID disponível.");
}

async function prepararAmbiente() {
  const empresa = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste Orcamentos"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  const email =
    `orcamento_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste Orcamentos",
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
      "Obra Temporaria Orcamentos",
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

  const atividade = await sql(
    `INSERT INTO atividade_eap (descricao, idx_obra)
     VALUES (?, ?)`,
    [
      "Atividade Temporaria Financeira",
      obra.insertId
    ]
  );

  ids.atividades.push(atividade.insertId);

  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(login, 200);
  assert.ok(login.body.token);

  return {
    token: login.body.token,
    idAtividade: atividade.insertId,
    idOrcamento: await gerarIdOrcamento()
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["orcamento_previsto", "id_orcamento", ids.orcamentos],
    ["atividade_eap", "id_atividade", ids.atividades],
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

test("VERTICE - orcamentos previstos", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idAtividade, idOrcamento } =
      await prepararAmbiente();

    const dados = {
      id_orcamento: idOrcamento,
      valor_planejado: 25000,
      id_atividade_eap: idAtividade
    };

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get(`/api/orcamentos-previstos?id_atividade_eap=${idAtividade}`);

      verificar(resposta, 401);
    });

    await t.test("Exigir atividade EAP na listagem", async () => {
      const resposta = await autenticar(
        request(app).get("/api/orcamentos-previstos"),
        token
      );

      verificar(resposta, 400);
    });

    await t.test("Cadastrar orcamento previsto", async () => {
      const resposta = await autenticar(
        request(app).post("/api/orcamentos-previstos/insert"),
        token
      ).send(dados);

      verificar(resposta, 201);

      assert.equal(
        Number(resposta.body.insertId),
        idOrcamento
      );

      ids.orcamentos.push(idOrcamento);
    });

    await t.test("Consultar orcamento por ID", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/orcamentos-previstos/${idOrcamento}`
        ),
        token
      );

      verificar(resposta, 200);

      assert.equal(
        Number(resposta.body.id_orcamento),
        idOrcamento
      );

      assert.equal(
        Number(resposta.body.valor_planejado),
        25000
      );
    });

    await t.test("Listar orcamentos da atividade", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/orcamentos-previstos?id_atividade_eap=${idAtividade}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          item => Number(item.id_orcamento) === idOrcamento
        )
      );
    });

    await t.test("Atualizar valor planejado", async () => {
      const resposta = await autenticar(
        request(app).put(
          `/api/orcamentos-previstos/insert/${idOrcamento}`
        ),
        token
      ).send({
        valor_planejado: 30000,
        id_atividade_eap: idAtividade
      });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(
          `/api/orcamentos-previstos/${idOrcamento}`
        ),
        token
      );

      verificar(consulta, 200);

      assert.equal(
        Number(consulta.body.valor_planejado),
        30000
      );
    });

    await t.test("Rejeitar valor negativo", async () => {
      const resposta = await autenticar(
        request(app).post("/api/orcamentos-previstos/insert"),
        token
      ).send({
        ...dados,
        valor_planejado: -100
      });

      verificar(resposta, 400);
    });

    await t.test("Rejeitar atividade ausente", async () => {
      const resposta = await autenticar(
        request(app).post("/api/orcamentos-previstos/insert"),
        token
      ).send({
        ...dados,
        id_atividade_eap: null
      });

      verificar(resposta, 400);
    });

    await t.test("Excluir orcamento", async () => {
      const resposta = await autenticar(
        request(app).delete(
          `/api/orcamentos-previstos/del/${idOrcamento}`
        ),
        token
      );

      verificar(resposta, 200);

      ids.orcamentos = ids.orcamentos.filter(
        id => id !== idOrcamento
      );
    });

    await t.test("Consultar orcamento excluido", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/orcamentos-previstos/${idOrcamento}`
        ),
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
