const express = require("express");
const router = express.Router();
const rdoEquipeController = require("../controllers/rdoEquipeController");

// Endpoints da API para controle de RDO Equipe
router.get("/", rdoEquipeController.listarPorRdo);
router.get("/:id", rdoEquipeController.buscarPorId);
router.delete("/del/:id", rdoEquipeController.deletar);
router.post("/insert", rdoEquipeController.criar);
router.put("/insert/:id", rdoEquipeController.atualizar);

module.exports = router;