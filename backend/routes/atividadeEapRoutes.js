const express = require("express");
const router = express.Router();
const atividadeEapController = require("../controllers/atividadeEapController");

// Endpoints da API para controle de Atividades EAP
router.get("/", atividadeEapController.listarPorObra);
router.get("/:id", atividadeEapController.buscarPorId);
router.delete("/del/:id", atividadeEapController.deletar);
router.post("/insert", atividadeEapController.criar);
router.put("/insert/:id", atividadeEapController.atualizar);

module.exports = router;