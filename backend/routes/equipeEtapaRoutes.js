const express = require("express");
const router = express.Router();
const equipeEtapaController = require("../controllers/equipeEtapaController");

// Endpoints da API para controle de Etapas das Equipes
router.get("/", equipeEtapaController.listarPorEquipe);
router.get("/:id", equipeEtapaController.buscarPorId);
router.delete("/del/:id", equipeEtapaController.deletar);
router.post("/insert", equipeEtapaController.criar);
router.put("/insert/:id", equipeEtapaController.atualizar);

module.exports = router;