const express = require("express");
const router = express.Router();
const apropriacaoController = require("../controllers/apropriacaoController");

// Endpoints da API para controle de apropriações
router.get("/", apropriacaoController.listarTodas);
router.get("/:id", apropriacaoController.buscarPorId);
router.delete("/del/:id", apropriacaoController.deletar);
router.post("/insert", apropriacaoController.criar);
router.put("/insert/:id", apropriacaoController.atualizar);

module.exports = router;