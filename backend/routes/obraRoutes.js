const express = require("express");
const router = express.Router();
const obraController = require("../controllers/obraController");

// Endpoints da API para controle de Obras
router.get("/", obraController.listarPorConstrutora);
router.get("/:id", obraController.buscarPorId);
router.delete("/del/:id", obraController.deletar);
router.post("/insert", obraController.criar);
router.put("/insert/:id", obraController.atualizar);

module.exports = router;