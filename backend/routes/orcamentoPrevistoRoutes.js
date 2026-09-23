const express = require("express");
const router = express.Router();
const orcamentoPrevistoController = require("../controllers/orcamentoPrevistoController");

// Endpoints da API para controle de Orçamento Previsto
router.get("/", orcamentoPrevistoController.listarPorAtividadeEap);
router.get("/:id", orcamentoPrevistoController.buscarPorId);
router.delete("/del/:id", orcamentoPrevistoController.deletar);
router.post("/insert", orcamentoPrevistoController.criar);
router.put("/insert/:id", orcamentoPrevistoController.atualizar);

module.exports = router;