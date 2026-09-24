const express = require("express");
const router = express.Router();
const rdoController = require("../controllers/rdoController");

// Endpoints da API para controle de RDO
router.get("/", rdoController.listarPorObra);
router.get("/:id", rdoController.buscarPorId);
router.delete("/del/:id", rdoController.deletar);
router.post("/insert", rdoController.criar);
router.put("/insert/:id", rdoController.atualizar);

module.exports = router;