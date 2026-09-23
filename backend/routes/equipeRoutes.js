const express = require("express");
const router = express.Router();
const equipeController = require("../controllers/equipeController");

// Endpoints da API para controle de Cadastros de Equipes
router.get("/", equipeController.listarPorObra);
router.get("/:id", equipeController.buscarPorId);
router.delete("/del/:id", equipeController.deletar);
router.post("/insert", equipeController.criar);
router.put("/insert/:id", equipeController.atualizar);

module.exports = router;