const express = require("express");
const router = express.Router();
const custoPlanejadoController = require("../controllers/custoPlanejadoController");

// Endpoints da API para controle de Custos Planejados
router.get("/", custoPlanejadoController.listarPorObra);
router.get("/:id", custoPlanejadoController.buscarPorId);
router.delete("/del/:id", custoPlanejadoController.deletar);
router.post("/insert", custoPlanejadoController.criar);
router.put("/insert/:id", custoPlanejadoController.atualizar);

module.exports = router;