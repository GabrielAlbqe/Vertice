const express = require("express");
const cors = require("cors");

// Inicialização do aplicativo Express
const app = express();

// =============================================================
// MIDDLEWARES GLOBAIS
// =============================================================
app.use(cors()); // Permite que o Front-End se comunique com a API
app.use(express.json()); // Habilita o recebimento de dados em formato JSON no corpo das requisições

// =============================================================
// IMPORTAÇÃO DAS ROTAS (Sincronizado exatamente com a pasta /routes)
// =============================================================
const apontamentoFisicoRoutes = require("./routes/apontamentoFisicoRoutes");
const apropriacaoRoutes = require("./routes/apropriacaoRoutes");
const atividadeEapRoutes = require("./routes/atividadeEapRoutes");
const cargoRoutes = require("./routes/cargoRoutes");
const construtoraRoutes = require("./routes/construtoraRoutes");
const diarioObraRoutes = require("./routes/diarioObraRoutes");
const equipeRoutes = require("./routes/equipeRoutes");
const historicoObrasRoutes = require("./routes/historicoObrasRoutes");
const insumoRoutes = require("./routes/insumoRoutes");
const maquinarioRoutes = require("./routes/maquinarioRoutes");
const metricaEvaRoutes = require("./routes/metricaEvaRoutes");
const obraRoutes = require("./routes/obraRoutes");
const orcamentoPrevistoRoutes = require("./routes/orcamentoPrevistoRoutes");
const registroRelatoriosRoutes = require("./routes/registroRelatoriosRoutes");
const usuarioRoutes = require("./routes/usuarioRoutes");

// Novas Rotas Adicionadas:
const equipeTerceirizadaRoutes = require("./routes/equipeTerceirizadaRoutes");
const equipeEtapaRoutes = require("./routes/equipeEtapaRoutes");
const custoPlanejadoRoutes = require("./routes/custoPlanejadoRoutes");
const etapaRoutes = require("./routes/etapaRoutes");

// =============================================================
// VINCULAÇÃO DOS ENDPOINTS DA API
// =============================================================
app.use("/api/apontamentos-fisicos", apontamentoFisicoRoutes);
app.use("/api/apropriacoes", apropriacaoRoutes);
app.use("/api/atividades-eap", atividadeEapRoutes);
app.use("/api/cargos", cargoRoutes);
app.use("/api/construtoras", construtoraRoutes); 
app.use("/api/diarios-obra", diarioObraRoutes);
app.use("/api/equipes", equipeRoutes);
app.use("/api/historico-obras", historicoObrasRoutes);
app.use("/api/insumos", insumoRoutes);
app.use("/api/maquinarios", maquinarioRoutes);
app.use("/api/metricas-eva", metricaEvaRoutes);
app.use("/api/obras", obraRoutes);
app.use("/api/orcamentos-previstos", orcamentoPrevistoRoutes);
app.use("/api/registro-relatorios", registroRelatoriosRoutes);
app.use("/api/usuarios", usuarioRoutes);

// Vinculação das Novas Rotas:
app.use("/api/equipes-terceirizadas", equipeTerceirizadaRoutes);
app.use("/api/equipes-etapas", equipeEtapaRoutes);
app.use("/api/custos-planejados", custoPlanejadoRoutes);
app.use("/api/etapas", etapaRoutes);

// Rota padrão para teste de integridade da API
app.get("/api/health", (req, res) => {
  res.status(200).json({
    status: "online",
    timestamp: new Date(),
    banco_dados: "conectado"
  });
});

// =============================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================
if (process.env.NODE_ENV !== 'test') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`====================================================`);
    console.log(`🚀 Servidor rodando com sucesso na porta ${PORT}`);
    console.log(`🔗 Link de teste: http://localhost:${PORT}/api/health`);
    console.log(`====================================================`);
  });
}

module.exports = app;