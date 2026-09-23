const express = require("express");
const router = express.Router();
const construtoraController = require("../controllers/construtoraController");

// Endpoints da API para controle de Construtoras
router.get("/", construtoraController.listarTodas);
router.get("/:id", construtoraController.buscarPorId);
router.delete("/del/:id", construtoraController.deletar);
router.post("/insert", construtoraController.criar);
router.put("/insert/:id", construtoraController.atualizar);

module.exports = router;