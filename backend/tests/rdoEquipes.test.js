
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

// Utilizar somente o banco de testes.
process.env.NODE_ENV = "test";
process.env.DB_NAME = "valen_testes";

const request = require("supertest");
const connection = require("../config/connection");
const app = require("../app");

const ids = {
  construtoras: [],
  usuarios: [],
  obras: [],
  equipes: [],
  rdos: [],
  registros: []
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

async function prepararAmbiente() {
  // Criar construtora temporária.
  const empresa = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste RDO Equipes"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  // Criar usuário temporário.
  const email =
    `rdoequipes_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste RDO Equipes",
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      empresa.insertId
    ]
  );

  ids.usuarios.push(usuario.insertId);

  // Criar obra temporária.
  const obra = await sql(
    `INSERT INTO obra
     (nome, status, id_construtora, categoria,
      numero_pavimentos, data_inicio_planejada,
      data_termino_planejada, orcamento_planejado)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      "Obra Temporaria RDO Equipes",
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

  // Criar equipe temporária.
  const equipe = await sql(
    `INSERT INTO cadastro_de_equipes
     (nome_equipe, etapa_atuacao, quantidade_profissionais,
      custo_diario, custo_mensal, idobra, id_construtora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Equipe Temporaria RDO",
      "Infraestrutura",
      5,
      700,
      15400,
      obra.insertId,
      empresa.insertId
    ]
  );

  ids.equipes.push(equipe.insertId);

  // Criar RDO temporário.
  const rdo = await sql(
    `INSERT INTO rdo (id_obra, data_rdo, turno, clima)
     VALUES (?, ?, ?, ?)`,
    [
      obra.insertId,
      "2026-10-21",
      "Manhã",
      "Ensolarado"
    ]
  );

  ids.rdos.push(rdo.insertId);

  // Autenticar usuário.
  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(login, 200);
  assert.ok(login.body.token);

  return {
    token: login.body.token,
    idRdo: rdo.insertId,
    idEquipe: equipe.insertId
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["rdo_equipe", "id_rdo_equipe", ids.registros],
    ["rdo", "id_rdo", ids.rdos],
    ["cadastro_de_equipes", "id_cadastro_equipes", ids.equipes],
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

test("VERTICE - equipes vinculadas ao RDO", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idRdo, idEquipe } =
      await prepararAmbiente();

    let idRegistro;

    const dados = {
      id_rdo: idRdo,
      id_equipe: idEquipe,
      etapa: "Infraestrutura",
      dias_atuacao: 1
    };

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get(`/api/rdo-equipes?id_rdo=${idRdo}`);

      verificar(resposta, 401);
    });

    await t.test("Exigir ID do RDO", async () => {
      const resposta = await autenticar(
        request(app).get("/api/rdo-equipes"),
        token
      );

      verificar(resposta, 400);
    });

    await t.test("Vincular equipe ao RDO", async () => {
      const resposta = await autenticar(
        request(app).post("/api/rdo-equipes/insert"),
        token
      ).send(dados);

      verificar(resposta, 201);

      idRegistro = resposta.body.insertId;

      assert.ok(
        Number.isSafeInteger(idRegistro) && idRegistro > 0
      );

      ids.registros.push(idRegistro);
    });

    await t.test("Consultar vínculo pelo ID", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/rdo-equipes/${idRegistro}`),
        token
      );

      verificar(resposta, 200);

      assert.equal(
        Number(resposta.body.id_equipe),
        idEquipe
      );

      assert.equal(
        Number(resposta.body.id_rdo),
        idRdo
      );
    });

    await t.test("Listar equipes do RDO", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/rdo-equipes?id_rdo=${idRdo}`),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          item => Number(item.id_rdo_equipe) === idRegistro
        )
      );
    });

    await t.test("Atualizar dias de atuação", async () => {
      const resposta = await autenticar(
        request(app).put(
          `/api/rdo-equipes/insert/${idRegistro}`
        ),
        token
      ).send({
        ...dados,
        dias_atuacao: 2
      });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(`/api/rdo-equipes/${idRegistro}`),
        token
      );

      verificar(consulta, 200);
      assert.equal(
        Number(consulta.body.dias_atuacao),
        2
      );
    });

    await t.test("Rejeitar dias de atuação inválidos", async () => {
      const resposta = await autenticar(
        request(app).post("/api/rdo-equipes/insert"),
        token
      ).send({
        ...dados,
        dias_atuacao: -1
      });

      verificar(resposta, 400);
    });

    await t.test("Excluir vínculo", async () => {
      const resposta = await autenticar(
        request(app).delete(
          `/api/rdo-equipes/del/${idRegistro}`
        ),
        token
      );

      verificar(resposta, 200);

      ids.registros = ids.registros.filter(
        id => id !== idRegistro
      );
    });

    await t.test("Consultar vínculo excluído", async () => {
      const resposta = await autenticar(
        request(app).get(`/api/rdo-equipes/${idRegistro}`),
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
