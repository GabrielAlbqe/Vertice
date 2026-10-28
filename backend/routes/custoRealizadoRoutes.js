
const express = require("express");
const router = express.Router();

const exigirConstrutora = require("../middlewares/exigirConstrutora");

const custoRealizadoController = require(
  "../controllers/custoRealizadoController"
);

// Todas as rotas exigem JWT e construtora autorizada.
router.use(exigirConstrutora);

// Consultar por obra ou RDO.
router.get("/", custoRealizadoController.listar);

// Consultar um custo por ID.
router.get("/:id", custoRealizadoController.buscarPorId);

// Cadastrar custo realizado.
router.post("/insert", custoRealizadoController.criar);

// Atualizar custo realizado.
router.put("/insert/:id", custoRealizadoController.atualizar);

// Excluir custo realizado.
router.delete("/del/:id", custoRealizadoController.deletar);

module.exports = router;
