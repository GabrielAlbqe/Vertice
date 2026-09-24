const express = require("express");
const router = express.Router();
const consumoInsumoController = require("../controllers/consumoInsumoController");

// Endpoints da API para Consumo de Insumos
router.get("/", consumoInsumoController.listarPorRdo);
router.get("/:id", consumoInsumoController.buscarPorId);
router.delete("/del/:id", consumoInsumoController.deletar);
router.post("/insert", consumoInsumoController.criar);
router.put("/insert/:id", consumoInsumoController.atualizar);

module.exports = router;