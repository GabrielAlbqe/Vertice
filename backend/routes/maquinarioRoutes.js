const express = require("express");
const router = express.Router();
const maquinarioController = require("../controllers/maquinarioController");

// Endpoints da API para controle de Maquinários
router.get("/", maquinarioController.listarPorObra);
router.get("/:id", maquinarioController.buscarPorId);
router.delete("/del/:id", maquinarioController.deletar);
router.post("/insert", maquinarioController.criar);
router.put("/insert/:id", maquinarioController.atualizar);

module.exports = router;