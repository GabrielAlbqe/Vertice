
const express = require("express");
const router = express.Router();

const exigirConstrutora = require("../middlewares/exigirConstrutora");

const custoPlanejadoController = require(
  "../controllers/custoPlanejadoController"
);

// Todas as operações exigem uma construtora válida.
router.use(exigirConstrutora);

// Listar custos de uma obra.
router.get("/", custoPlanejadoController.listarPorObra);

// Consultar por ID.
router.get("/:id", custoPlanejadoController.buscarPorId);

// Cadastrar.
router.post("/insert", custoPlanejadoController.criar);

// Atualizar.
router.put("/insert/:id", custoPlanejadoController.atualizar);

// Excluir.
router.delete("/del/:id", custoPlanejadoController.deletar);

module.exports = router;
