const express = require("express");
const router = express.Router();
const etapaController = require("../controllers/etapaController");

// Endpoints da API para controle de Etapas
router.get("/", etapaController.listarPorObra);
router.get("/:id", etapaController.buscarPorId);
router.delete("/del/:id", etapaController.deletar);
router.post("/insert", etapaController.criar);
router.put("/insert/:id", etapaController.atualizar);

module.exports = router;