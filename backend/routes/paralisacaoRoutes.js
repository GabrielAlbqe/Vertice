const express = require("express");
const router = express.Router();
const paralisacaoController = require("../controllers/paralisacaoController");

// Endpoints da API para Paralisações
router.get("/", paralisacaoController.listarPorRdo);
router.get("/:id", paralisacaoController.buscarPorId);
router.delete("/del/:id", paralisacaoController.deletar);
router.post("/insert", paralisacaoController.criar);
router.put("/insert/:id", paralisacaoController.atualizar);

module.exports = router;