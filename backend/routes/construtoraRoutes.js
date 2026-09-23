const express = require("express");
const router = Router = express.Router();
const construtoraController = require("../controllers/construtoraController");

// Endpoints administrativos para controle de construtoras (Tenants)
router.get("/", construtoraController.listarTodas);
router.get("/:id", construtoraController.buscarPorId);
router.delete("/del/:id", construtoraController.deletar);
router.post("/insert", construtoraController.criar);
router.put("/insert/:id", construtoraController.atualizar);

module.exports = router;