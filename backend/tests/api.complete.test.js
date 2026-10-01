const request = require("supertest");
const app = require("../app");
const connection = require("../config/connection");

jest.setTimeout(30000);

const ids = {};
const stamp = Date.now();

function dbQuery(sql, params = []) {
  return new Promise((resolve, reject) => {
    connection.query(sql, params, (err, results) => {
      if (err) return reject(err);
      resolve(results);
    });
  });
}

async function lastInsertId() {
  const rows = await dbQuery("SELECT LAST_INSERT_ID() AS id");
  return rows[0].id;
}

function expectNoServerError(res) {
  expect(res.statusCode).toBeLessThan(500);
}

function normalizeForComparison(value) {
  if (value === null || value === undefined) return value;

  if (typeof value === "number") return value;

  const text = String(value);

  // Normaliza DECIMAL retornado pelo mysql2: "20.50" === 20.5
  if (/^-?\d+(?:\.\d+)?$/.test(text)) {
    const number = Number(text);
    if (Number.isFinite(number)) return number;
  }

  // Normaliza DATE retornado como ISO: 2026-10-12T03:00:00.000Z === 2026-10-12
  const dateMatch = text.match(/^(\d{4}-\d{2}-\d{2})(?:T.*)?$/);
  if (dateMatch) return dateMatch[1];

  return text;
}

const resources = [
  {
    key: "construtora", base: "/api/construtoras", idColumn: "id_construtora",
    payload: () => ({ cnpj: String(stamp).slice(-14).padStart(14, "1"), razao_social: `Construtora Teste ${stamp}` }),
    update: () => ({ cnpj: String(stamp + 1).slice(-14).padStart(14, "2"), razao_social: `Construtora Atualizada ${stamp}` }),
    changedField: "razao_social"
  },
  {
    key: "cargo", base: "/api/cargos", idColumn: "id_cargo",
    payload: () => ({ nome_cargo: `Cargo ${stamp}`, descricao: "Cargo de teste integrado" }),
    update: () => ({ nome_cargo: `Cargo Atualizado ${stamp}`, descricao: "Cargo atualizado" }),
    changedField: "nome_cargo"
  },
  {
    key: "usuario", base: "/api/usuarios", idColumn: "id_usuario",
    payload: () => ({ nome: "Usuário Integração", email: `teste_${stamp}@vertice.local`, senha: "senha_teste_123", ocupacao: "Operacional", ambiente: "Canteiro", status: "Ativo", idconstrutora: ids.construtora }),
    update: () => ({ nome: "Usuário Integração Atualizado", email: `teste_${stamp}@vertice.local`, senha: "senha_teste_123", ocupacao: "Operacional", ambiente: "Canteiro", status: "Ativo", idconstrutora: ids.construtora }),
    changedField: "nome"
  },
  {
    key: "obra", base: "/api/obras", idColumn: "id_obra",
    payload: () => ({ nome: `Obra Teste ${stamp}`, status: "Em Andamento", id_construtora: ids.construtora, categoria: "Residencial", numero_pavimentos: 2, data_inicio_planejada: "2026-10-01", data_termino_planejada: "2027-10-01", orcamento_planejado: 100000 }),
    update: () => ({ nome: `Obra Atualizada ${stamp}`, status: "Em Andamento", id_construtora: ids.construtora, categoria: "Residencial", numero_pavimentos: 3, data_inicio_planejada: "2026-10-01", data_termino_planejada: "2027-10-01", orcamento_planejado: 120000 }),
    changedField: "nome"
  },
  {
    key: "atividadeEap", base: "/api/atividades-eap", idColumn: "id_atividade", listQuery: () => ({ idx_obra: ids.obra }),
    payload: () => ({ descricao: "Atividade teste", idx_obra: ids.obra }),
    update: () => ({ descricao: "Atividade atualizada", idx_obra: ids.obra }), changedField: "descricao"
  },
  {
    key: "insumo", base: "/api/insumos", idColumn: "id_insumos", listQuery: () => ({ idobra: ids.obra }),
    payload: () => ({ nome: "Cimento Teste", quantidade_disponivel: 100, valor_unitario: 40, idobra: ids.obra }),
    update: () => ({ nome: "Cimento Atualizado", quantidade_disponivel: 120, valor_unitario: 42, idobra: ids.obra }), changedField: "nome"
  },
  {
    key: "maquinario", base: "/api/maquinarios", idColumn: "id_maquina", listQuery: () => ({ idobra: ids.obra }),
    payload: () => ({ nome: "Betoneira Teste", quantidade: 1, etapa_atuacao: "Infraestrutura", custo_diario: 120, status: "Ativo", idobra: ids.obra }),
    update: () => ({ nome: "Betoneira Atualizada", quantidade: 2, etapa_atuacao: "Infraestrutura", custo_diario: 130, status: "Ativo", idobra: ids.obra }), changedField: "nome"
  },
  {
    key: "equipe", base: "/api/equipes", idColumn: "id_cadastro_equipes",
    payload: () => ({ nome_equipe: "Equipe Teste", etapa_atuacao: "Instalações", quantidade_profissionais: 4, custo_diario: 500, custo_mensal: 11000, idobra: ids.obra }),
    update: () => ({ nome_equipe: "Equipe Atualizada", etapa_atuacao: "Instalações", quantidade_profissionais: 5, custo_diario: 550, custo_mensal: 12100, idobra: ids.obra }), changedField: "nome_equipe"
  },
  {
    key: "equipeTerceirizada", base: "/api/equipes-terceirizadas", idColumn: "id_equipe_terceirizada", listQuery: () => ({ id_obra: ids.obra }), filterRequired: false,
    payload: () => ({ nome_equipe: "Terceirizada Teste", custo_diario_total: 700, id_obra: ids.obra }),
    update: () => ({ nome_equipe: "Terceirizada Atualizada", custo_diario_total: 750, id_obra: ids.obra }), changedField: "nome_equipe"
  },
  {
    key: "etapa", base: "/api/etapas", idColumn: "id_etapa", listQuery: () => ({ id_obra: ids.obra }), filterRequired: false,
    payload: () => ({ id_obra: ids.obra, nome_etapa: "Infraestrutura", descricao: "Etapa teste" }),
    update: () => ({ id_obra: ids.obra, nome_etapa: "Infraestrutura", descricao: "Etapa atualizada" }), changedField: "descricao"
  },
  {
    key: "rdo", base: "/api/rdo", idColumn: "id_rdo", listQuery: () => ({ id_obra: ids.obra }),
    payload: () => ({ id_obra: ids.obra, data_rdo: "2026-10-01", turno: "Integral", clima: "Ensolarado" }),
    update: () => ({ id_obra: ids.obra, data_rdo: "2026-10-02", turno: "Integral", clima: "Nublado" }), changedField: "clima"
  },
  {
    key: "diario", base: "/api/diarios-obra", idColumn: "id_diario", listQuery: () => ({ obrax_id: ids.obra }),
    payload: () => ({ data: "2026-10-01", clima: "Ensolarado", turno: "Manhã", etapa_atuacao: "Infraestrutura", equipe_interna: "A", equipe_terceirizada: "B", paralisacoes: "Nenhuma", origem_paralisacoes: "N/A", atrasos: "Nenhum", origem_atrasos: "N/A", obrax_id: ids.obra, usuario_id: ids.usuario }),
    update: () => ({ data: "2026-10-02", clima: "Chuvoso", turno: "Tarde", etapa_atuacao: "Infraestrutura", equipe_interna: "A", equipe_terceirizada: "B", paralisacoes: "Nenhuma", origem_paralisacoes: "N/A", atrasos: "Nenhum", origem_atrasos: "N/A", obrax_id: ids.obra, usuario_id: ids.usuario }), changedField: "clima"
  },
  {
    key: "apontamento", base: "/api/apontamentos-fisicos", idColumn: "id_apontamento", listQuery: () => ({ diario_id: ids.diario }),
    payload: () => ({ percentual_dia: 10.5, url_foto: "https://example.com/teste.jpg", diario_id: ids.diario, atividade_eap_id: ids.atividadeEap }),
    update: () => ({ percentual_dia: 20.5, url_foto: "https://example.com/atualizada.jpg", diario_id: ids.diario, atividade_eap_id: ids.atividadeEap }), changedField: "percentual_dia"
  },
  {
    key: "apropriacao", base: "/api/apropriacoes", idColumn: "id_apropriacao",
    payload: () => ({ quantidade_consumida: 5, tipo_compra: "Planejada", id_insumo: ids.insumo, id_atividade: ids.atividadeEap, id_usuario: ids.usuario }),
    update: () => ({ quantidade_consumida: 7, tipo_compra: "Emergencial", id_insumo: ids.insumo, id_atividade: ids.atividadeEap, id_usuario: ids.usuario }), changedField: "quantidade_consumida"
  },
  {
    key: "historico", base: "/api/historico-obras", idColumn: "id_historico", listQuery: () => ({ id_obra: ids.obra }),
    payload: () => ({ usuario_id: ids.usuario, id_obra: ids.obra, status: "em andamento", data_atribuicao: "2026-10-01 08:00:00", data_fim: null }),
    update: () => ({ usuario_id: ids.usuario, id_obra: ids.obra, status: "pausada", data_atribuicao: "2026-10-01 08:00:00", data_fim: null }), changedField: "status"
  },
  {
    key: "metrica", base: "/api/metricas-eva", idColumn: "id_metrica", listQuery: () => ({ obra_idxx: ids.obra }),
    payload: () => ({ data_calculo: "2026-10-01", idc: 1.05, idp: 0.98, eac: 90000, obra_idxx: ids.obra }),
    update: () => ({ data_calculo: "2026-10-02", idc: 1.08, idp: 1.01, eac: 88000, obra_idxx: ids.obra }), changedField: "eac"
  },
  {
    key: "orcamento", base: "/api/orcamentos-previstos", idColumn: "id_orcamento", listQuery: () => ({ id_atividade_eap: ids.atividadeEap }),
    payload: () => ({ id_orcamento: Number(String(stamp).slice(-8)), valor_planejado: 15000, id_atividade_eap: ids.atividadeEap }),
    update: () => ({ valor_planejado: 17500, id_atividade_eap: ids.atividadeEap }), changedField: "valor_planejado",
    explicitId: (payload) => payload.id_orcamento
  },
  {
    key: "registro", base: "/api/registro-relatorios", idColumn: "id_registro_relatorio", listQuery: () => ({ id_obra: ids.obra }),
    payload: () => ({ id_diario: ids.diario, id_obra: ids.obra, data_registro: "2026-10-01 09:00:00" }),
    update: () => ({ id_diario: ids.diario, id_obra: ids.obra, data_registro: "2026-10-02 09:00:00" }), changedField: "id_obra"
  },
  {
    key: "custoPlanejado", base: "/api/custos-planejados", idColumn: "id_custo_planejado", listQuery: () => ({ id_obra: ids.obra }), filterRequired: false,
    payload: () => ({ id_obra: ids.obra, etapa: "Infraestrutura", origem_custo: "Insumo", valor_planejado: 10000, data_inicio_prevista: "2026-10-01", data_fim_prevista: "2026-11-01" }),
    update: () => ({ id_obra: ids.obra, etapa: "Infraestrutura", origem_custo: "Insumo", valor_planejado: 12000, data_inicio_prevista: "2026-10-01", data_fim_prevista: "2026-11-01" }), changedField: "valor_planejado"
  },
  {
    key: "equipeEtapa", base: "/api/equipes-etapas", idColumn: "id_equipe_etapa", listQuery: () => ({ id_equipe: ids.equipe }), filterRequired: false,
    payload: () => ({ id_equipe: ids.equipe, etapa: "Instalações", data_inicio: "2026-10-01", data_fim: "2026-10-10" }),
    update: () => ({ id_equipe: ids.equipe, etapa: "Instalações", data_inicio: "2026-10-01", data_fim: "2026-10-12" }), changedField: "data_fim"
  },
  {
    key: "rdoEquipe", base: "/api/rdo-equipes", idColumn: "id_rdo_equipe", listQuery: () => ({ id_rdo: ids.rdo }),
    payload: () => ({ id_rdo: ids.rdo, id_equipe: ids.equipe, etapa: "Instalações", dias_atuacao: 1 }),
    update: () => ({ id_rdo: ids.rdo, id_equipe: ids.equipe, etapa: "Instalações", dias_atuacao: 2 }), changedField: "dias_atuacao"
  },
  {
    key: "rdoMaquinario", base: "/api/rdo-maquinarios", idColumn: "id_rdo_maquinario", listQuery: () => ({ id_rdo: ids.rdo }),
    payload: () => ({ id_rdo: ids.rdo, id_maquinario: ids.maquinario, etapa: "Infraestrutura", quantidade_utilizada: 1, tempo_utilizacao: 3 }),
    update: () => ({ id_rdo: ids.rdo, id_maquinario: ids.maquinario, etapa: "Infraestrutura", quantidade_utilizada: 2, tempo_utilizacao: 4 }), changedField: "quantidade_utilizada"
  },
  {
    key: "consumo", base: "/api/consumos-insumos", idColumn: "id_consumo", listQuery: () => ({ id_rdo: ids.rdo }),
    payload: () => ({ id_rdo: ids.rdo, id_insumo: ids.insumo, etapa: "Infraestrutura", quantidade_consumida: 3, custo_unitario: 40 }),
    update: () => ({ id_rdo: ids.rdo, id_insumo: ids.insumo, etapa: "Infraestrutura", quantidade_consumida: 4, custo_unitario: 40 }), changedField: "quantidade_consumida"
  },
  {
    key: "atraso", base: "/api/atrasos", idColumn: "id_atraso", listQuery: () => ({ id_rdo: ids.rdo }),
    payload: () => ({ id_rdo: ids.rdo, etapa: "Infraestrutura", origem_atraso: "Insumos", duracao: 2, descricao: "Atraso teste" }),
    update: () => ({ id_rdo: ids.rdo, etapa: "Infraestrutura", origem_atraso: "Insumos", duracao: 3, descricao: "Atraso atualizado" }), changedField: "duracao"
  },
  {
    key: "paralisacao", base: "/api/paralisacoes", idColumn: "id_paralisacao", listQuery: () => ({ id_rdo: ids.rdo }),
    payload: () => ({ id_rdo: ids.rdo, etapa: "Infraestrutura", origem_paralisacao: "Condições Climáticas", duracao: 1, descricao: "Paralisação teste" }),
    update: () => ({ id_rdo: ids.rdo, etapa: "Infraestrutura", origem_paralisacao: "Condições Climáticas", duracao: 2, descricao: "Paralisação atualizada" }), changedField: "duracao"
  },
  {
    key: "custoRealizado", base: "/api/custos-realizados", idColumn: "id_custo_realizado", listQuery: () => ({ id_obra: ids.obra }),
    payload: () => ({ id_obra: ids.obra, id_etapa: ids.etapa, id_rdo: ids.rdo, origem_custo: "Insumo", id_origem: ids.insumo, data: "2026-10-01", quantidade: 2, custo_unitario: 40 }),
    update: () => ({ id_obra: ids.obra, id_etapa: ids.etapa, id_rdo: ids.rdo, origem_custo: "Insumo", id_origem: ids.insumo, data: "2026-10-02", quantidade: 3, custo_unitario: 40 }), changedField: "quantidade"
  },
  {
    key: "projecao", base: "/api/projecoes-financeiras", idColumn: "id_projecao", listQuery: () => ({ id_obra: ids.obra }),
    payload: () => ({ id_obra: ids.obra, etapa: "Infraestrutura", data_projecao: "2026-10-01", custo_realizado: 1000, custo_restante_estimado: 9000, desvio_projetado: 0, desvio_projetado_percentual: 0 }),
    update: () => ({ id_obra: ids.obra, etapa: "Infraestrutura", data_projecao: "2026-10-02", custo_realizado: 2000, custo_restante_estimado: 8000, desvio_projetado: 0, desvio_projetado_percentual: 0 }), changedField: "custo_realizado"
  }
];

describe("API Vértice - cobertura completa das 137 operações", () => {
  afterAll(async () => {
    await new Promise((resolve) => connection.end(() => resolve()));
  });

  test("GET /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.status).toBe("online");
  });

  describe("CREATE - 27 POST /insert", () => {
    for (const r of resources) {
      test(`POST ${r.base}/insert`, async () => {
        const payload = r.payload();
        const res = await request(app).post(`${r.base}/insert`).send(payload);
        expectNoServerError(res);
        expect(res.statusCode).toBe(201);
        ids[r.key] = r.explicitId ? r.explicitId(payload) : (res.body?.insertId || await lastInsertId());
        expect(ids[r.key]).toBeTruthy();
      });
    }
  });

  describe("LOGIN", () => {
    test("POST /api/usuarios/login - credenciais válidas", async () => {
      const res = await request(app).post("/api/usuarios/login").send({ email: `teste_${stamp}@vertice.local`, senha: "senha_teste_123" });
      expect(res.statusCode).toBe(200);
      expect(res.body.usuario).toBeTruthy();
    });

    test("POST /api/usuarios/login - senha inválida", async () => {
      const res = await request(app).post("/api/usuarios/login").send({ email: `teste_${stamp}@vertice.local`, senha: "errada" });
      expect(res.statusCode).toBe(401);
    });

    test("POST /api/usuarios/login - payload incompleto", async () => {
      const res = await request(app).post("/api/usuarios/login").send({ email: `teste_${stamp}@vertice.local` });
      expect(res.statusCode).toBe(400);
    });
  });

  describe("READ ALL - 27 GET /", () => {
    for (const r of resources) {
      test(`GET ${r.base}/`, async () => {
        let req = request(app).get(`${r.base}/`);
        if (r.listQuery) req = req.query(r.listQuery());
        const res = await req;
        expectNoServerError(res);
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
      });
    }
  });

  describe("READ ONE - 27 GET /:id", () => {
    for (const r of resources) {
      test(`GET ${r.base}/:id`, async () => {
        const res = await request(app).get(`${r.base}/${ids[r.key]}`);
        expectNoServerError(res);
        expect(res.statusCode).toBe(200);
      });

      test(`GET ${r.base}/999999999 - inexistente`, async () => {
        const res = await request(app).get(`${r.base}/999999999`);
        expectNoServerError(res);
        expect(res.statusCode).toBe(404);
      });
    }
  });

  describe("UPDATE - 27 PUT /insert/:id", () => {
    for (const r of resources) {
      test(`PUT ${r.base}/insert/:id + confirmação por GET`, async () => {
        const payload = r.update();
        const res = await request(app).put(`${r.base}/insert/${ids[r.key]}`).send(payload);
        expectNoServerError(res);
        expect(res.statusCode).toBe(200);

        const check = await request(app).get(`${r.base}/${ids[r.key]}`);
        expect(check.statusCode).toBe(200);
        if (r.changedField && Object.prototype.hasOwnProperty.call(payload, r.changedField)) {
          expect(normalizeForComparison(check.body[r.changedField])).toBe(normalizeForComparison(payload[r.changedField]));
        }
      });

      test(`PUT ${r.base}/insert/999999999 - inexistente`, async () => {
        const res = await request(app).put(`${r.base}/insert/999999999`).send(r.update());
        expectNoServerError(res);
        expect(res.statusCode).toBe(404);
      });
    }
  });

  describe("VALIDAÇÕES DE FILTROS OBRIGATÓRIOS", () => {
    const filtered = resources.filter((r) => r.listQuery && r.filterRequired !== false);
    for (const r of filtered) {
      test(`GET ${r.base}/ sem filtro deve retornar 400`, async () => {
        const res = await request(app).get(`${r.base}/`);
        expectNoServerError(res);
        expect(res.statusCode).toBe(400);
      });
    }
  });

  describe("ERROS DE FK REPRESENTATIVOS NÃO PODEM VIRAR 500", () => {
    test("POST atividade EAP com obra inexistente", async () => {
      const res = await request(app).post("/api/atividades-eap/insert").send({ descricao: "FK inválida", idx_obra: 999999999 });
      expectNoServerError(res);
      expect(res.statusCode).toBe(400);
    });

    test("POST RDO com obra inexistente", async () => {
      const res = await request(app).post("/api/rdo/insert").send({ id_obra: 999999999, data_rdo: "2026-10-01", turno: "Integral", clima: "Ensolarado" });
      expectNoServerError(res);
      expect(res.statusCode).toBe(400);
    });
  });

  describe("DELETE - 27 DELETE /del/:id em ordem reversa", () => {
    for (const r of [...resources].reverse()) {
      test(`DELETE ${r.base}/del/:id`, async () => {
        const res = await request(app).delete(`${r.base}/del/${ids[r.key]}`);
        expectNoServerError(res);
        expect(res.statusCode).toBe(200);

        const check = await request(app).get(`${r.base}/${ids[r.key]}`);
        expect(check.statusCode).toBe(404);
      });

      test(`DELETE ${r.base}/del/999999999 - inexistente`, async () => {
        const res = await request(app).delete(`${r.base}/del/999999999`);
        expectNoServerError(res);
        expect(res.statusCode).toBe(404);
      });
    }
  });
});
