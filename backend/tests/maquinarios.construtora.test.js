
const { test } = require("node:test");
const assert = require("node:assert/strict");
const { randomBytes } = require("node:crypto");
const bcrypt = require("bcryptjs");

// Configuração obrigatória do ambiente de testes.
process.env.NODE_ENV = "test";
process.env.DB_NAME = "valen_testes";

const request = require("supertest");
const connection = require("../config/connection");
const app = require("../app");

const stamp = Date.now();
const senha = randomBytes(18).toString("hex");

const ids = {
  construtoras: [],
  usuarios: [],
  obras: [],
  maquinarios: []
};

function query(sql, parametros = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, parametros, (erro, resultado) => {
      if (erro) return reject(erro);
      resolve(resultado);
    });
  });
}

async function conferirBanco() {
  const resultado = await query(
    "SELECT DATABASE() AS banco"
  );

  assert.equal(
    resultado[0].banco,
    "valen_testes",
    "Banco incorreto: testes cancelados."
  );
}

function verificar(resposta, esperado) {
  assert.equal(
    resposta.status,
    esperado,
    `Esperado HTTP ${esperado}, recebido ` +
    `${resposta.status}: ${JSON.stringify(resposta.body)}`
  );
}

function auth(requisicao, token) {
  return requisicao.set(
    "Authorization",
    `Bearer ${token}`
  );
}

async function criarConstrutora(numero) {
  const cnpj =
    String(stamp).slice(-12).padStart(12, "0") +
    String(numero).repeat(2);

  const resultado = await query(
    `INSERT INTO construtora
     (cnpj, razao_social)
     VALUES (?, ?)`,
    [
      cnpj,
      `Construtora Maquinarios ${stamp} ${numero}`
    ]
  );

  ids.construtoras.push(resultado.insertId);
  return resultado.insertId;
}

async function criarUsuario(idConstrutora, numero) {
  const email =
    `maq_${stamp}_${numero}@vertice.local`;

  const hash = await bcrypt.hash(senha, 10);

  const resultado = await query(
    `INSERT INTO usuario
     (
       nome, email, senha, status,
       ocupacao, ambiente, idconstrutora
     )
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      `Teste Maquinarios ${numero}`,
      email,
      hash,
      "Ativo",
      "Gerência",
      "Escritório",
      idConstrutora
    ]
  );

  ids.usuarios.push(resultado.insertId);

  const login = await request(app)
    .post("/api/usuarios/login")
    .send({ email, senha });

  verificar(login, 200);
  assert.ok(login.body.token);

  return login.body.token;
}

async function criarObra(idConstrutora, numero) {
  const resultado = await query(
    `INSERT INTO obra
     (
       nome, status, id_construtora,
       categoria, numero_pavimentos,
       data_inicio_planejada,
       data_termino_planejada,
       orcamento_planejado
     )
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      `Obra Maquinarios ${stamp} ${numero}`,
      "Em Andamento",
      idConstrutora,
      "Residencial",
      2,
      "2026-10-01",
      "2027-10-01",
      100000
    ]
  );

  ids.obras.push(resultado.insertId);
  return resultado.insertId;
}

async function limpar() {
  await conferirBanco();

  const registros = [
    ["cadastro_de_maquinario", "id_maquina", ids.maquinarios],
    ["obra", "id_obra", ids.obras],
    ["usuario", "id_usuario", ids.usuarios],
    ["construtora", "id_construtora", ids.construtoras]
  ];

  for (const [tabela, coluna, lista] of registros) {
    for (const id of [...lista].reverse()) {
      await query(
        `DELETE FROM ${tabela} WHERE ${coluna} = ?`,
        [id]
      );
    }
  }
}

const cadastro = {
  nome: "Betoneira Automatica",
  quantidade: 1,
  etapa_atuacao: "Infraestrutura",
  custo_diario: 120,
  status: "Ativo",
  idobra: null
};

test(
  "VERTICE - isolamento de maquinarios por construtora",
  { timeout: 60000 },
  async (t) => {
    try {
      await conferirBanco();

      const empresaA = await criarConstrutora(1);
      const empresaB = await criarConstrutora(2);

      const tokenA = await criarUsuario(empresaA, 1);
      const tokenB = await criarUsuario(empresaB, 2);

      const obraA = await criarObra(empresaA, 1);
      const outraObraA = await criarObra(empresaA, 3);
      const obraB = await criarObra(empresaB, 2);

      let idMaquinario;

      await t.test("Bloquear acesso sem JWT", async () => {
        const resposta = await request(app)
          .get("/api/maquinarios");

        verificar(resposta, 401);
      });

      await t.test(
        "Cadastrar maquinario na empresa A",
        async () => {
          const resposta = await auth(
            request(app).post("/api/maquinarios/insert"),
            tokenA
          ).send({
            ...cadastro,
            id_construtora: empresaB
          });

          verificar(resposta, 201);

          idMaquinario = resposta.body.insertId;
          assert.ok(idMaquinario);

          ids.maquinarios.push(idMaquinario);

          const registros = await query(
            `SELECT idobra, id_construtora
             FROM cadastro_de_maquinario
             WHERE id_maquina = ?`,
            [idMaquinario]
          );

          assert.equal(registros[0].idobra, null);
          assert.equal(
            registros[0].id_construtora,
            empresaA
          );
        }
      );

      await t.test(
        "Empresa B nao consulta maquinario A",
        async () => {
          const resposta = await auth(
            request(app).get(
              `/api/maquinarios/${idMaquinario}`
            ),
            tokenB
          );

          verificar(resposta, 404);
        }
      );

      await t.test(
        "Empresa B nao visualiza maquinario A na lista",
        async () => {
          const resposta = await auth(
            request(app).get("/api/maquinarios"),
            tokenB
          );

          verificar(resposta, 200);
          assert.ok(Array.isArray(resposta.body));

          assert.equal(
            resposta.body.some(
              (item) =>
                Number(item.id_maquina) === idMaquinario
            ),
            false
          );
        }
      );

      await t.test(
        "Empresa B nao altera maquinario A",
        async () => {
          const resposta = await auth(
            request(app).patch(
              `/api/maquinarios/${idMaquinario}/obra`
            ),
            tokenB
          ).send({ idobra: obraB });

          verificar(resposta, 404);
        }
      );

      await t.test(
        "Empresa A nao utiliza obra da empresa B",
        async () => {
          const resposta = await auth(
            request(app).patch(
              `/api/maquinarios/${idMaquinario}/obra`
            ),
            tokenA
          ).send({ idobra: obraB });

          verificar(resposta, 404);
        }
      );

      await t.test(
        "Atribuir maquinario a obra da empresa A",
        async () => {
          const resposta = await auth(
            request(app).patch(
              `/api/maquinarios/${idMaquinario}/obra`
            ),
            tokenA
          ).send({ idobra: obraA });

          verificar(resposta, 200);

          const consulta = await auth(
            request(app).get(
              `/api/maquinarios/${idMaquinario}`
            ),
            tokenA
          );

          verificar(consulta, 200);

          assert.equal(
            Number(consulta.body.idobra),
            obraA
          );
        }
      );

      await t.test(
        "Transferir entre obras da mesma construtora",
        async () => {
          const resposta = await auth(
            request(app).patch(
              `/api/maquinarios/${idMaquinario}/obra`
            ),
            tokenA
          ).send({ idobra: outraObraA });

          verificar(resposta, 200);

          const consulta = await auth(
            request(app).get(
              `/api/maquinarios/${idMaquinario}`
            ),
            tokenA
          );

          verificar(consulta, 200);

          assert.equal(
            Number(consulta.body.idobra),
            outraObraA
          );
        }
      );

      await t.test(
        "Desatribuir preservando a construtora",
        async () => {
          const resposta = await auth(
            request(app).patch(
              `/api/maquinarios/${idMaquinario}/obra`
            ),
            tokenA
          ).send({ idobra: null });

          verificar(resposta, 200);

          const registros = await query(
            `SELECT idobra, id_construtora
             FROM cadastro_de_maquinario
             WHERE id_maquina = ?`,
            [idMaquinario]
          );

          assert.equal(registros[0].idobra, null);

          assert.equal(
            registros[0].id_construtora,
            empresaA
          );
        }
      );

      await t.test(
        "Empresa B nao edita cadastro do maquinario A",
        async () => {
          const resposta = await auth(
            request(app).put(
              `/api/maquinarios/insert/${idMaquinario}`
            ),
            tokenB
          ).send(cadastro);

          verificar(resposta, 404);
        }
      );

      await t.test(
        "Empresa B nao exclui maquinario A",
        async () => {
          const resposta = await auth(
            request(app).delete(
              `/api/maquinarios/del/${idMaquinario}`
            ),
            tokenB
          );

          verificar(resposta, 404);

          const registros = await query(
            `SELECT id_maquina
             FROM cadastro_de_maquinario
             WHERE id_maquina = ?`,
            [idMaquinario]
          );

          assert.equal(registros.length, 1);
        }
      );
    } finally {
      try {
        await limpar();
      } finally {
        await new Promise((resolve) => {
          connection.end(resolve);
        });
      }
    }
  }
);
