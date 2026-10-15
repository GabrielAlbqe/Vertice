
const express = require("express");
const router = express.Router();

const exigirConstrutora = require(
  "../middlewares/exigirConstrutora"
);

const maquinarioController = require(
  "../controllers/maquinarioController"
);

// Todas as rotas exigem construtora autorizada.
router.use(exigirConstrutora);

// Listar todos ou filtrar por obra.
router.get(
  "/",
  maquinarioController.listarPorObra
);

// Cadastrar maquinário.
router.post(
  "/insert",
  maquinarioController.criar
);

// Atribuir, transferir ou desatribuir.
router.patch(
  "/:id/obra",
  maquinarioController.alterarObra
);

// Consultar por ID.
router.get(
  "/:id",
  maquinarioController.buscarPorId
);

// Atualizar cadastro completo.
router.put(
  "/insert/:id",
  maquinarioController.atualizar
);

// Excluir cadastro.
router.delete(
  "/del/:id",
  maquinarioController.deletar
);

module.exports = router;
