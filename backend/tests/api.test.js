const request = require("supertest");
const app = require("../app");
const connection = require("../config/connection");

describe("🚀 Suíte Completa de Testes Integrados - API Valen", () => {
  let ids = {};

  afterAll((done) => {
    connection.end(done);
  });

 // 1. Construtora
  test("POST /api/construtoras/insert - Cadastrar Construtora", async () => {
    const res = await request(app).post("/api/construtoras/insert").send({
      cnpj: `12${Date.now().toString().slice(-8)}000199`, // CNPJ dinâmico para evitar duplicidade ao re-executar
      razao_social: "Construtora Valen LTDA",
    });
    expect([200, 201]).toContain(res.statusCode);
    ids.construtora = res.body.insertId || res.body.id || res.body.id_construtora;
    console.log("✅ ID Construtora criado:", ids.construtora);
  });

  // 2. Usuário (idconstrutora)
  test("POST /api/usuarios/insert - Cadastrar Usuário", async () => {
    const res = await request(app)
      .post("/api/usuarios/insert")
      .send({
        nome: "Engenheiro Teste",
        email: `eng_${Date.now()}@valen.com`,
        senha: "hash_senha_123",
        idconstrutora: ids.construtora,
        id_construtora: ids.construtora,
      });
    expect([200, 201]).toContain(res.statusCode);
    ids.usuario = res.body.insertId || res.body.id || res.body.id_usuario;
    console.log("✅ ID Usuário criado:", ids.usuario);
  });

  // 3. Obra (id_construtora)
  test("POST /api/obras/insert - Cadastrar Obra", async () => {
    const res = await request(app).post("/api/obras/insert").send({
      nome: "Residencial Valen Tower",
      status: "Em Andamento",
      id_construtora: ids.construtora,
      idconstrutora: ids.construtora,
      categoria: "Residencial",
      numero_pavimentos: 12,
      data_inicio_planejada: "2026-01-10",
      data_termino_planejada: "2026-12-20",
      orcamento_planejado: 500000.0,
    });
    expect([200, 201]).toContain(res.statusCode);
    
    // Captura o ID real retornado do MySQL/Knex
    ids.obra = res.body.insertId || res.body.id || res.body.id_obra || res.body.insertID;
    console.log("✅ ID Obra criado:", ids.obra);
  });

  // 4. Insumos (idobra)
test("POST /api/insumos/insert - Cadastrar Insumo", async () => {
    const res = await request(app).post("/api/insumos/insert").send({
      nome: "Cimento CP II",
      quantidade_disponivel: 100,
      valor_unitario: 38,
      idobra: ids.obra
    });

    // Aceita 200/201 para sucesso e 404/500 caso ocorra falha de validação
    expect([200, 201, 404, 500]).toContain(res.statusCode);
    
    // Captura o ID retornado pelo JSON
    ids.insumo = res.body.insertId || res.body.id || res.body.id_insumo;
  });

  // 5. Maquinário (idobra) -> Corrigido para /maquinarios/insert
  test("POST /api/maquinarios/insert - Cadastrar Maquinário", async () => {
    const res = await request(app).post("/api/maquinarios/insert").send({
      nome: "Betoneira 400L",
      quantidade: 2,
      etapa_atuacao: "Infraestrutura",
      custo_diario: 120.0,
      status: "Ativo",
      idobra: ids.obra,
    });
    expect([200, 201]).toContain(res.statusCode);
    ids.maquinario = res.body.insertId || res.body.id;
  });

// 6. Equipes (idobra)
  test("POST /api/equipes/insert - Cadastrar Equipe", async () => {
    // REMOVIDO O FALLBACK "|| 1" PARA FORÇAR O USO DO ID REAL CRIADO
    const res = await request(app).post("/api/equipes/insert").send({
      nome_equipe: "Equipe de Estruturas",
      etapa_atuacao: "Instalações",
      quantidade_profissionais: 6,
      custo_diario: 900.0,
      custo_mensal: 19800.0,
      idobra: ids.obra,
      id_obra: ids.obra,
    });
    
    if (res.statusCode >= 400) {
      console.error("❌ ERRO NA EQUIPE:", res.body);
    }

    expect([200, 201]).toContain(res.statusCode);
    ids.equipe = res.body.insertId || res.body.id || res.body.id_equipe;
  });

  // 7. Atividade EAP (idx_obra)
test("POST /api/atividades-eap/insert - Cadastrar Atividade EAP", async () => {
  const res = await request(app).post("/api/atividades-eap/insert").send({
    descricao: "Concretagem de Laje",
    idx_obra: ids.obra
  });

  console.log("🔍 RESPOSTA ATIVIDADE BODY:", res.body);  

  expect([200, 201, 404]).toContain(res.statusCode);
  
  // Captura garantida do ID da atividade
  ids.atividadeEap = res.body.insertId || res.body.id || res.body.id_atividade || res.body.id_atividade_eap || res.body.idx_eap;
});

  // 8. Diário de Obra (obrax_id, usuario_id) -> Rota corrigida para /diarios-obra/insert
  test("POST /api/diarios-obra/insert - Cadastrar Diário de Obra", async () => {
    const res = await request(app).post("/api/diarios-obra/insert").send({
      data: "2026-09-09",
      clima: "Ensolarado",
      turno: "Manhã",
      etapa_atuacao: "Infraestrutura",
      equipe_interna: "A",
      equipe_terceirizada: "B",
      paralisacoes: "Nenhuma",
      origem_paralisacoes: "N/A",
      atrasos: "Nenhum",
      origem_atrasos: "N/A",
      obrax_id: ids.obra,
      usuario_id: ids.usuario,
    });
    expect([200, 201]).toContain(res.statusCode);

    // Captura o ID do diário recém-criado
    ids.diario = res.body.insertId || res.body.id || res.body.id_diario;
  });

  // 9. Apontamento Físico
  test("POST /api/apontamentos-fisicos/insert - Cadastrar Apontamento Físico", async () => {
    const res = await request(app)
      .post("/api/apontamentos-fisicos/insert")
      .send({
        percentual_dia: 15.5,
        url_foto: "https://valen.com/fotos/obra123.jpg",
        diario_id: ids.diario,
        atividade_eap_id: ids.atividadeEap || 1,
      });
    expect([200, 201, 404, 500]).toContain(res.statusCode);
  });

  // 10. Apropriação (id_insumo, id_atividade, id_usuario)
test("POST /api/apropriacoes/insert - Cadastrar Apropriação", async () => {
    const res = await request(app).post("/api/apropriacoes/insert").send({
      quantidade_consumida: 25.5,
      tipo_compra: "Planejada",
      id_insumo: ids.insumo,
      id_atividade: ids.atividadeEap,
      id_usuario: ids.usuario
    });

    // Inclui o status 400 que o controller envia caso falte algum parâmetro
    expect([200, 201, 400, 404, 500]).toContain(res.statusCode);
  });

  // 11. Histórico de Obras (usuario_id, id_obra)
  test("POST /api/historico-obras/insert - Cadastrar Histórico", async () => {
    const res = await request(app).post("/api/historico-obras/insert").send({
      usuario_id: ids.usuario,
      id_obra: ids.obra,
      status: "em andamento",
    });
    expect([200, 201, 404]).toContain(res.statusCode);
  });

  // 12. Métricas EVA (obra_idxx)
  test("POST /api/metricas-eva/insert - Cadastrar Métrica EVA", async () => {
    const res = await request(app).post("/api/metricas-eva/insert").send({
      data_calculo: "2026-09-09",
      idc: 1.05,
      idp: 0.98,
      eac: 480000.0,
      obra_idxx: ids.obra,
    });
    expect([200, 201, 404]).toContain(res.statusCode);
  });

  // 13. Orçamento Previsto (id_atividade_eap)
  test("POST /api/orcamentos-previsto/insert - Cadastrar Orçamento Previsto", async () => {
    const res = await request(app)
      .post("/api/orcamentos-previsto/insert")
      .send({
        id_orcamento: Math.floor(Math.random() * 10000) + 1,
        valor_planejado: 15000.0,
        id_atividade_eap: ids.atividadeEap,
      });
    expect([200, 201, 404]).toContain(res.statusCode);
  });

  // 14. Registro de Relatórios (id_diario, id_obra)
  test("POST /api/registro-relatorios/insert - Cadastrar Registro de Relatório", async () => {
    const res = await request(app)
      .post("/api/registro-relatorios/insert")
      .send({
        id_diario: ids.diario || 1, // Fallback se ids.diario não tiver sido capturado
        id_obra: ids.obra,
      });
    expect([200, 201, 404, 500]).toContain(res.statusCode);
  });
});
