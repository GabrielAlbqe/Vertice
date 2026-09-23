const express = require("express");
const router = express.Router();
const equipeTerceirizadaController = require("../controllers/equipeTerceirizadaController");

// Endpoints da API para controle de Equipes Terceirizadas
router.get("/", equipeTerceirizadaController.listarPorObra);
router.get("/:id", equipeTerceirizadaController.buscarPorId);
router.delete("/del/:id", equipeTerceirizadaController.deletar);
router.post("/insert", equipeTerceirizadaController.criar);
router.put("/insert/:id", equipeTerceirizadaController.atualizar);

module.exports = router;