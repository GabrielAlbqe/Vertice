const express = require("express");
const router = express.Router();
const custoRealizadoController = require("../controllers/custoRealizadoController");

// Endpoints da API para Custo Realizado
router.get("/", custoRealizadoController.listar);
router.get("/:id", custoRealizadoController.buscarPorId);
router.delete("/del/:id", custoRealizadoController.deletar);
router.post("/insert", custoRealizadoController.criar);
router.put("/insert/:id", custoRealizadoController.atualizar);

module.exports = router;