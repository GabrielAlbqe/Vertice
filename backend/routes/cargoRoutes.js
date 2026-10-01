const express = require("express");
const router = express.Router();
const cargoController = require("../controllers/cargoController");

// Endpoints da API para controle de Cargos
router.get("/", cargoController.listarTodos);
router.get("/:id", cargoController.buscarPorId);
router.delete("/del/:id", cargoController.deletar);
router.post("/insert", cargoController.criar);
router.put("/insert/:id", cargoController.atualizar);

module.exports = router;
