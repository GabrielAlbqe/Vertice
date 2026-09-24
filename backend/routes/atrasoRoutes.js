const express = require("express");
const router = express.Router();
const atrasoController = require("../controllers/atrasoController");

// Endpoints da API para Atrasos
router.get("/", atrasoController.listarPorRdo);
router.get("/:id", atrasoController.buscarPorId);
router.delete("/del/:id", atrasoController.deletar);
router.post("/insert", atrasoController.criar);
router.put("/insert/:id", atrasoController.atualizar);

module.exports = router;