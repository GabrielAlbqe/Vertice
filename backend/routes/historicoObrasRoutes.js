const express = require("express");
const router = express.Router();
const historicoObrasController = require("../controllers/historicoObrasController");

// Endpoints da API para controle de Histórico de Obras
router.get("/", historicoObrasController.listarPorObra);
router.get("/:id", historicoObrasController.buscarPorId);
router.delete("/del/:id", historicoObrasController.deletar);
router.post("/insert", historicoObrasController.criar);
router.put("/insert/:id", historicoObrasController.atualizar);

module.exports = router;