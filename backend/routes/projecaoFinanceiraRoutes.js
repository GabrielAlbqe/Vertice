const express = require("express");
const router = express.Router();
const projecaoFinanceiraController = require("../controllers/projecaoFinanceiraController");

// Endpoints da API para Projeção Financeira
router.get("/", projecaoFinanceiraController.listarPorObra);
router.get("/:id", projecaoFinanceiraController.buscarPorId);
router.delete("/del/:id", projecaoFinanceiraController.deletar);
router.post("/insert", projecaoFinanceiraController.criar);
router.put("/insert/:id", projecaoFinanceiraController.atualizar);

module.exports = router;