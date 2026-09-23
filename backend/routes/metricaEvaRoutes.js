const express = require("express");
const router = express.Router();
const metricasEvaController = require("../controllers/metricaEvaController");

// Endpoints da API para controle de Métricas EVA
router.get("/", metricasEvaController.listarPorObra);
router.get("/:id", metricasEvaController.buscarPorId);
router.delete("/del/:id", metricasEvaController.deletar);
router.post("/insert", metricasEvaController.criar);
router.put("/insert/:id", metricasEvaController.atualizar);

module.exports = router;