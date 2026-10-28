
const express = require("express");
const router = express.Router();

const exigirConstrutora = require("../middlewares/exigirConstrutora");
const insumosController = require("../controllers/insumosController");

// Exigir construtora autorizada em todas as rotas
router.use(exigirConstrutora);

// Listagem de insumos
router.get("/", insumosController.listarPorObra);

// Cadastro de insumos
router.post("/insert", insumosController.criar);

// Atribuição e desatribuição de obras
router.patch("/:id/obra", insumosController.alterarObra);

// Consulta por ID
router.get("/:id", insumosController.buscarPorId);

// Atualização
router.put("/insert/:id", insumosController.atualizar);

// Exclusão
router.delete("/del/:id", insumosController.deletar);

module.exports = router;
