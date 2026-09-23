const express = require("express");
const router = express.Router();
const apontamentoFisicoController = require("../controllers/apontamentoFisicoController");

// Endpoints da API para controle de apontamentos físicos diários
router.get("/", apontamentoFisicoController.listarPorDiario);
router.get("/:id", apontamentoFisicoController.buscarPorId);
router.delete("/del/:id", apontamentoFisicoController.deletar);
router.post("/insert", apontamentoFisicoController.criar);
router.put("/insert/:id", apontamentoFisicoController.atualizar);

module.exports = router;