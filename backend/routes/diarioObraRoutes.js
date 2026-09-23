const express = require("express");
const router = express.Router();
const diarioObraController = require("../controllers/diarioObraController");

// Endpoints da API para controle de Diários de Obra
router.get("/", diarioObraController.listarPorObra);
router.get("/:id", diarioObraController.buscarPorId);
router.delete("/del/:id", diarioObraController.deletar);
router.post("/insert", diarioObraController.criar);
router.put("/insert/:id", diarioObraController.atualizar);

module.exports = router;