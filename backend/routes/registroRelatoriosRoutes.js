const express = require("express");
const router = express.Router();
const registroRelatoriosController = require("../controllers/registroRelatoriosController");

// Endpoints da API para controle de Registro de Relatórios
router.get("/", registroRelatoriosController.listarPorObra);
router.get("/:id", registroRelatoriosController.buscarPorId);
router.delete("/del/:id", registroRelatoriosController.deletar);
router.post("/insert", registroRelatoriosController.criar);
router.put("/insert/:id", registroRelatoriosController.atualizar);

module.exports = router;