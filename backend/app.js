require('./config/env');

const express = require("express");
const cors = require("cors");

const autenticar = require("./middlewares/autenticar");

// Inicialização do aplicativo Express
const app = express();

// =============================================================
// MIDDLEWARES GLOBAIS
// =============================================================
const origins = (process.env.CORS_ORIGINS || 'http://localhost:5173,http://127.0.0.1:5173').split(',').map(s => s.trim());
app.use(cors({ origin(origin, callback) { callback(null, !origin || origins.includes(origin)); } })); // Permite que o Front-End se comunique com a API
app.use(express.json({ limit: "1mb" }));
app.use(require("./middlewares/respostas"));
app.use("/api/usuarios/login", require("./middlewares/limitarLogin")); // Habilita o recebimento de dados em formato JSON no corpo das requisições

app.use((req, res, next) => {
  const rotaPublica =
    (req.method === "POST" && req.path === "/api/usuarios/login") ||
    (req.method === "POST" && req.path === "/api/usuarios/insert") ||
    (req.method === "GET" && req.path === "/api/health");

  if (req.method === 'POST' && req.path === '/api/usuarios/insert' && req.headers.authorization) {
    return autenticar(req, res, () => require('./middlewares/seguranca')(req, res, next));
  }
  if (rotaPublica) {
    return next();
  }

  return autenticar(req, res, () => require("./middlewares/seguranca")(req, res, next));
});

// =============================================================
// IMPORTAÇÃO DAS ROTAS (Em ordem alfabética)
// =============================================================
const apontamentoFisicoRoutes = require("./routes/apontamentoFisicoRoutes");
const apropriacaoRoutes = require("./routes/apropriacaoRoutes");
const atividadeEapRoutes = require("./routes/atividadeEapRoutes");
const cargoRoutes = require("./routes/cargoRoutes");
const construtoraRoutes = require("./routes/construtoraRoutes");
const custoPlanejadoRoutes = require("./routes/custoPlanejadoRoutes");
const diarioObraRoutes = require("./routes/diarioObraRoutes");
const equipeEtapaRoutes = require("./routes/equipeEtapaRoutes");
const equipeRoutes = require("./routes/equipeRoutes");
const equipeTerceirizadaRoutes = require("./routes/equipeTerceirizadaRoutes");
const etapaRoutes = require("./routes/etapaRoutes");
const historicoObrasRoutes = require("./routes/historicoObrasRoutes");
const insumoRoutes = require("./routes/insumoRoutes");
const maquinarioRoutes = require("./routes/maquinarioRoutes");
const metricaEvaRoutes = require("./routes/metricaEvaRoutes");
const obraRoutes = require("./routes/obraRoutes");
const orcamentoPrevistoRoutes = require("./routes/orcamentoPrevistoRoutes");
const rdoEquipeRoutes = require("./routes/rdoEquipeRoutes");
const rdoMaquinarioRoutes = require("./routes/rdoMaquinarioRoutes");
const rdoRoutes = require("./routes/rdoRoutes");
const registroRelatoriosRoutes = require("./routes/registroRelatoriosRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");
const consumoInsumoRoutes = require("./routes/consumoInsumoRoutes");
const atrasoRoutes = require("./routes/atrasoRoutes");
const paralisacaoRoutes = require("./routes/paralisacaoRoutes");
const custoRealizadoRoutes = require("./routes/custoRealizadoRoutes");
const projecaoFinanceiraRoutes = require("./routes/projecaoFinanceiraRoutes");

// =============================================================
// VINCULAÇÃO DOS ENDPOINTS DA API
// =============================================================
// Módulos Gerais e Estruturais
app.use("/api/obras", obraRoutes);
app.use("/api/equipes", equipeRoutes);
app.use("/api/apontamentos-fisicos", apontamentoFisicoRoutes);
app.use("/api/apropriacoes", apropriacaoRoutes);
app.use("/api/atividades-eap", atividadeEapRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/construtoras", construtoraRoutes);
app.use("/api/custos-planejados", custoPlanejadoRoutes);
app.use("/api/diarios-obra", diarioObraRoutes);
app.use("/api/equipes-etapas", equipeEtapaRoutes);
app.use("/api/equipes-terceirizadas", equipeTerceirizadaRoutes);
app.use("/api/etapas", etapaRoutes);
app.use("/api/historico-obras", historicoObrasRoutes);
app.use("/api/insumos", insumoRoutes);
app.use("/api/maquinarios", maquinarioRoutes);
app.use("/api/metricas-eva", metricaEvaRoutes);
app.use("/api/orcamentos-previstos", orcamentoPrevistoRoutes);
app.use("/api/registro-relatorios", registroRelatoriosRoutes);
app.use("/api/usuarios", usuarioRoutes);
app.use("/api/consumos-insumos", consumoInsumoRoutes);
app.use("/api/atrasos", atrasoRoutes);
app.use("/api/paralisacoes", paralisacaoRoutes);
app.use("/api/custos-realizados", custoRealizadoRoutes);
app.use("/api/projecoes-financeiras", projecaoFinanceiraRoutes);

// Módulo RDO (Relatório Diário de Obra)
app.use("/api/rdo", rdoRoutes);
app.use("/api/rdo-equipes", rdoEquipeRoutes);
app.use("/api/rdo-maquinarios", rdoMaquinarioRoutes);

// Rota padrão para teste de integridade da API
app.use('/api/inteligencia-operacional', require('./routes/inteligenciaOperacionalRoutes'));
app.use('/api/historico-preditivo', require('./routes/historicoPreditivoRoutes'));

app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date(),
    banco_dados: "não verificado",
  });
});

// =============================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================
app.use((req, res) => res.status(404).json({ message: "Rota não encontrada." }));
app.use((err, req, res, next) => {
  if (res.headersSent) return next(err);
  const status = err.type === "entity.parse.failed" ? 400 : err.status || 500;
  res.status(status).json({ message: err.type === "entity.parse.failed" ? "JSON inválido." : status === 413 ? "Corpo da requisição excede o limite permitido." : status < 500 ? err.message : "Erro ao processar requisição." });
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
    console.log(`🔗 Link de teste: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;
