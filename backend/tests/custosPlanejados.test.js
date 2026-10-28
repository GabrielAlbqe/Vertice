
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
  custos: []
};

function sql(comando, parametros = []) {
  return new Promise((resolve, reject) => {
    connection.query(
      comando,
      parametros,
      (erro, resultado) => {
        if (erro) return reject(erro);
        resolve(resultado);
      }
    );
  });
}

async function conferirBanco() {
  const resultado = await sql("SELECT DATABASE() AS banco");

  assert.equal(
    resultado[0].banco,
    "valen_testes",
    "Teste interrompido: banco incorreto."
  );
}

function verificar(resposta, esperado) {
  assert.equal(
    resposta.status,
    esperado,
    `Esperado HTTP ${esperado}, recebido ${resposta.status}: ` +
      JSON.stringify(resposta.body)
  );
}

function autenticado(requisicao, token) {
  return requisicao.set(
    "Authorization",
    `Bearer ${token}`
  );
}

async function criarEmpresa(letra) {
  const construtora = await sql(
    `INSERT INTO construtora (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      randomBytes(7).toString("hex"),
      `Construtora Teste Custos ${letra}`
    ]
  );

  ids.construtoras.push(construtora.insertId);

  const email =
    `custos_${letra}_${randomBytes(8).toString("hex")}@vertice.local`;

  const senha = randomBytes(18).toString("hex");
  const hash = await bcrypt.hash(senha, 10);

  const usuario = await sql(
    `INSERT INTO usuario
      (nome, email, senha, status, ocupacao,
       ambiente, idconstrutora)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `Usuario Custos ${letra}`,
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      construtora.insertId
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
      `Obra Temporaria Custos ${letra}`,
      "Em Andamento",
      construtora.insertId,
      "Residencial",
      3,
      "2026-10-01",
      "2027-10-01",
      200000
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

function dadosCusto(idObra, valor = 15000) {
  return {
    id_obra: idObra,
    etapa: "Infraestrutura",
    origem_custo: "Equipe",
    valor_planejado: valor,
    data_inicio_prevista: "2026-10-21",
    data_fim_prevista: "2026-11-21"
  };
}

async function limpar() {
  await conferirBanco();

  const tabelas = [
    ["custo_planejado", "id_custo_planejado", ids.custos],
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

test("VERTICE - custos planejados e isolamento", {
  timeout: 60000
}, async (t) => {
  try {
    await conferirBanco();

    const empresaA = await criarEmpresa("A");
    const empresaB = await criarEmpresa("B");

    let idCustoA;
    let idCustoB;

    await t.test("Bloquear acesso sem JWT", async () => {
      const resposta = await request(app)
        .get(
          `/api/custos-planejados?id_obra=${empresaA.idObra}`
        );

      verificar(resposta, 401);
    });

    await t.test("Exigir ID da obra", async () => {
      const resposta = await autenticado(
        request(app).get("/api/custos-planejados"),
        empresaA.token
      );

      verificar(resposta, 400);
    });

    await t.test("Cadastrar custo na empresa A", async () => {
      const resposta = await autenticado(
        request(app).post("/api/custos-planejados/insert"),
        empresaA.token
      ).send(dadosCusto(empresaA.idObra));

      verificar(resposta, 201);

      idCustoA = resposta.body.insertId;
      assert.ok(Number.isSafeInteger(idCustoA));

      ids.custos.push(idCustoA);
    });

    await t.test("Cadastrar custo na empresa B", async () => {
      const resposta = await autenticado(
        request(app).post("/api/custos-planejados/insert"),
        empresaB.token
      ).send(dadosCusto(empresaB.idObra, 28000));

      verificar(resposta, 201);

      idCustoB = resposta.body.insertId;
      assert.ok(Number.isSafeInteger(idCustoB));

      ids.custos.push(idCustoB);
    });

    await t.test(
      "Empresa A não cadastra custo na obra B",
      async () => {
        const resposta = await autenticado(
          request(app).post("/api/custos-planejados/insert"),
          empresaA.token
        ).send(dadosCusto(empresaB.idObra));

        verificar(resposta, 404);
      }
    );

    await t.test("Empresa A lista seus custos", async () => {
      const resposta = await autenticado(
        request(app).get(
          `/api/custos-planejados?id_obra=${empresaA.idObra}`
        ),
        empresaA.token
      );

      verificar(resposta, 200);
      assert.ok(Array.isArray(resposta.body));

      assert.ok(
        resposta.body.some(
          item => Number(item.id_custo_planejado) === idCustoA
        )
      );

      assert.ok(
        !resposta.body.some(
          item => Number(item.id_custo_planejado) === idCustoB
        )
      );
    });

    await t.test(
      "Empresa A não lista custos da obra B",
      async () => {
        const resposta = await autenticado(
          request(app).get(
            `/api/custos-planejados?id_obra=${empresaB.idObra}`
          ),
          empresaA.token
        );

        verificar(resposta, 200);
        assert.deepEqual(resposta.body, []);
      }
    );

    await t.test(
      "Empresa A não consulta custo B pelo ID",
      async () => {
        const resposta = await autenticado(
          request(app).get(
            `/api/custos-planejados/${idCustoB}`
          ),
          empresaA.token
        );

        verificar(resposta, 404);
      }
    );

    await t.test(
      "Empresa A não atualiza custo B",
      async () => {
        const resposta = await autenticado(
          request(app).put(
            `/api/custos-planejados/insert/${idCustoB}`
          ),
          empresaA.token
        ).send(dadosCusto(empresaA.idObra, 99999));

        verificar(resposta, 404);
      }
    );

    await t.test(
      "Empresa A não transfere custo para obra B",
      async () => {
        const resposta = await autenticado(
          request(app).put(
            `/api/custos-planejados/insert/${idCustoA}`
          ),
          empresaA.token
        ).send(dadosCusto(empresaB.idObra, 12000));

        verificar(resposta, 404);
      }
    );

    await t.test(
      "Empresa A não exclui custo B",
      async () => {
        const resposta = await autenticado(
          request(app).delete(
            `/api/custos-planejados/del/${idCustoB}`
          ),
          empresaA.token
        );

        verificar(resposta, 404);
      }
    );

    await t.test(
      "Custo B permanece preservado",
      async () => {
        const resposta = await autenticado(
          request(app).get(
            `/api/custos-planejados/${idCustoB}`
          ),
          empresaB.token
        );

        verificar(resposta, 200);

        assert.equal(
          Number(resposta.body.valor_planejado),
          28000
        );
      }
    );

    await t.test("Rejeitar valor negativo", async () => {
      const resposta = await autenticado(
        request(app).post("/api/custos-planejados/insert"),
        empresaA.token
      ).send(dadosCusto(empresaA.idObra, -100));

      verificar(resposta, 400);
    });

    await t.test(
      "Rejeitar data final anterior à inicial",
      async () => {
        const resposta = await autenticado(
          request(app).post("/api/custos-planejados/insert"),
          empresaA.token
        ).send({
          ...dadosCusto(empresaA.idObra),
          data_fim_prevista: "2026-09-01"
        });

        verificar(resposta, 400);
      }
    );

    await t.test(
      "Empresa A atualiza o próprio custo",
      async () => {
        const resposta = await autenticado(
          request(app).put(
            `/api/custos-planejados/insert/${idCustoA}`
          ),
          empresaA.token
        ).send(dadosCusto(empresaA.idObra, 17500));

        verificar(resposta, 200);

        const consulta = await autenticado(
          request(app).get(
            `/api/custos-planejados/${idCustoA}`
          ),
          empresaA.token
        );

        verificar(consulta, 200);

        assert.equal(
          Number(consulta.body.valor_planejado),
          17500
        );
      }
    );

    await t.test(
      "Empresa A exclui o próprio custo",
      async () => {
        const resposta = await autenticado(
          request(app).delete(
            `/api/custos-planejados/del/${idCustoA}`
          ),
          empresaA.token
        );

        verificar(resposta, 200);
      }
    );

    await t.test(
      "Custo excluído não pode ser consultado",
      async () => {
        const resposta = await autenticado(
          request(app).get(
            `/api/custos-planejados/${idCustoA}`
          ),
          empresaA.token
        );

        verificar(resposta, 404);
      }
    );

  } finally {
    try {
      await limpar();
    } finally {
      await new Promise(resolve => connection.end(resolve));
    }
  }
});
