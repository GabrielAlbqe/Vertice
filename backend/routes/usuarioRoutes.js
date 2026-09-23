const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

// Endpoints da API para controle de Usuários
router.post("/login", usuarioController.login); // Rota de Login
router.get("/", usuarioController.listarPorConstrutora);
router.get("/:id", usuarioController.buscarPorId);
router.delete("/del/:id", usuarioController.deletar);
router.post("/insert", usuarioController.criar);
router.put("/insert/:id", usuarioController.atualizar);

module.exports = router;