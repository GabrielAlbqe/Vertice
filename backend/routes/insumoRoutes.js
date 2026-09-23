const express = require("express");
const router = express.Router();
const insumosController = require("../controllers/insumosController");

// Endpoints da API para controle de Insumos
router.get("/", insumosController.listarPorObra);
router.get("/:id", insumosController.buscarPorId);
router.delete("/del/:id", insumosController.deletar);
router.post("/insert", insumosController.criar);
router.put("/insert/:id", insumosController.atualizar);

module.exports = router;