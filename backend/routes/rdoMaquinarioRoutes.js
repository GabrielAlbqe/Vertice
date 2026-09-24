const express = require("express");
const router = express.Router();
const rdoMaquinarioController = require("../controllers/rdoMaquinarioController");

// Endpoints da API para controle de RDO Maquinário
router.get("/", rdoMaquinarioController.listarPorRdo);
router.get("/:id", rdoMaquinarioController.buscarPorId);
router.delete("/del/:id", rdoMaquinarioController.deletar);
router.post("/insert", rdoMaquinarioController.criar);
router.put("/insert/:id", rdoMaquinarioController.atualizar);

module.exports = router;