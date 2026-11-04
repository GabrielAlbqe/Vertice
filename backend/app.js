const path = require("path");

require("dotenv").config({
  path: path.join(__dirname, ".env"),
  quiet: true,
});

const express = require("express");
const cors = require("cors");

const autenticar = require("./middlewares/autenticar");

// Inicialização do aplicativo Express
const app = express();

// =============================================================
// MIDDLEWARES GLOBAIS
// =============================================================
require('./middlewares/http').configure(app);
if(process.env.NODE_ENV==='production')app.use('/api',require('./middlewares/http').loginLimit({limit:600,windowMs:60000,namespace:'api'}));
app.use('/api/usuarios/login',require('./middlewares/http').loginLimit());
app.use(express.json()); // Habilita o recebimento de dados em formato JSON no corpo das requisições
app.use(require('./middlewares/http').validateInput);
app.use('/api/usuarios/insert',require('./middlewares/http').loginLimit({limit:30,namespace:'registration'}));
app.use('/api/usuarios/reset-password',require('./middlewares/http').loginLimit({limit:10,namespace:'reset'}));

app.use((req, res, next) => {
  const rotaPublica =
    (req.method === "POST" && req.path === "/api/usuarios/login") ||
    (req.method === "POST" && req.path === "/api/usuarios/reset-password") ||
    (req.method === "POST" && req.path === "/api/usuarios/insert" && process.env.REGISTRATION_MODE !== 'office' && !req.headers.authorization) ||
    (req.method === "GET" && req.path === "/api/health");

  if (rotaPublica) {
    return next();
  }

  return autenticar(req, res, next);
});

// =============================================================
// IMPORTAÇÃO DAS ROTAS (Em ordem alfabética)
// =============================================================
const apontamentoFisicoRoutes = require("./routes/apontamentoFisicoRoutes");
// Carrega e valida a configuração antes do pool operacional.
require("./config/connection");
app.use(require("./middlewares/escopoConstrutora"));
app.use("/api/operacional", require("./routes/operacionalRoutes"));
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
app.get("/api/health", (req, res) => {
  const connection = require("./config/connection");
  connection.query("SELECT 1", (err) => {
    res.status(err ? 503 : 200).json({
      status: err ? "indisponivel" : "online",
      timestamp: new Date(),
      banco_dados: err ? "desconectado" : "conectado",
      cadastro_publico: false,
    });
  });
});

// =============================================================
// INICIALIZAÇÃO DO SERVIDOR
// =============================================================
app.use((req,res)=>res.status(404).json({message:'Recurso não encontrado.'}));
app.use(require('./utils/operacional').errors);
module.exports = app;
if (require.main === module && process.env.NODE_ENV !== "test") require('./server');
