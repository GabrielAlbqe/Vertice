
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
  maquinarios: [],
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
  const empresa = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      "Construtora Teste RDO Maquinarios"
    ]
  );

  ids.construtoras.push(empresa.insertId);

  const email =
    `rdomaq_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
     (nome, email, senha, status, ocupacao, ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Usuario Teste RDO Maquinarios",
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
      "Obra Temporaria RDO Maquinarios",
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

  const maquinario = await sql(
    `INSERT INTO cadastro_de_maquinario
     (nome, quantidade, etapa_atuacao,
      custo_diario, status, idobra, id_construtora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      "Betoneira Temporaria RDO",
      2,
      "Infraestrutura",
      120,
      "Ativo",
      obra.insertId,
      empresa.insertId
    ]
  );

  ids.maquinarios.push(maquinario.insertId);

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

  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(login, 200);
  assert.ok(login.body.token);

  return {
    token: login.body.token,
    idRdo: rdo.insertId,
    idMaquinario: maquinario.insertId
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["rdo_maquinario", "id_rdo_maquinario", ids.registros],
    ["rdo", "id_rdo", ids.rdos],
    ["cadastro_de_maquinario", "id_maquina", ids.maquinarios],
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

test("VERTICE - maquinarios vinculados ao RDO", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const { token, idRdo, idMaquinario } =
      await prepararAmbiente();

    let idRegistro;

    const dados = {
      id_rdo: idRdo,
      id_maquinario: idMaquinario,
      etapa: "Infraestrutura",
      quantidade_utilizada: 1,
      tempo_utilizacao: 4
    };

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get(`/api/rdo-maquinarios?id_rdo=${idRdo}`);

      verificar(resposta, 401);
    });

    await t.test("Exigir ID do RDO", async () => {
      const resposta = await autenticar(
        request(app).get("/api/rdo-maquinarios"),
        token
      );

      verificar(resposta, 400);
    });

    await t.test("Vincular maquinario ao RDO", async () => {
      const resposta = await autenticar(
        request(app).post("/api/rdo-maquinarios/insert"),
        token
      ).send(dados);

      verificar(resposta, 201);

      idRegistro = resposta.body.insertId;

      assert.ok(
        Number.isSafeInteger(idRegistro) && idRegistro > 0,
        "O cadastro precisa retornar insertId."
      );

      ids.registros.push(idRegistro);
    });

    await t.test("Consultar vinculo pelo ID", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/rdo-maquinarios/${idRegistro}`
        ),
        token
      );

      verificar(resposta, 200);

      assert.equal(
        Number(resposta.body.id_maquinario),
        idMaquinario
      );

      assert.equal(Number(resposta.body.id_rdo), idRdo);
    });

    await t.test("Listar maquinarios do RDO", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/rdo-maquinarios?id_rdo=${idRdo}`
        ),
        token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          item =>
            Number(item.id_rdo_maquinario) === idRegistro
        )
      );
    });

    await t.test("Atualizar utilizacao", async () => {
      const resposta = await autenticar(
        request(app).put(
          `/api/rdo-maquinarios/insert/${idRegistro}`
        ),
        token
      ).send({
        ...dados,
        quantidade_utilizada: 2,
        tempo_utilizacao: 6
      });

      verificar(resposta, 200);

      const consulta = await autenticar(
        request(app).get(
          `/api/rdo-maquinarios/${idRegistro}`
        ),
        token
      );

      verificar(consulta, 200);

      assert.equal(
        Number(consulta.body.quantidade_utilizada),
        2
      );

      assert.equal(
        Number(consulta.body.tempo_utilizacao),
        6
      );
    });

    await t.test("Rejeitar tempo invalido", async () => {
      const resposta = await autenticar(
        request(app).post("/api/rdo-maquinarios/insert"),
        token
      ).send({
        ...dados,
        tempo_utilizacao: -1
      });

      verificar(resposta, 400);
    });

    await t.test("Excluir vinculo", async () => {
      const resposta = await autenticar(
        request(app).delete(
          `/api/rdo-maquinarios/del/${idRegistro}`
        ),
        token
      );

      verificar(resposta, 200);

      ids.registros = ids.registros.filter(
        id => id !== idRegistro
      );
    });

    await t.test("Consultar vinculo excluido", async () => {
      const resposta = await autenticar(
        request(app).get(
          `/api/rdo-maquinarios/${idRegistro}`
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
