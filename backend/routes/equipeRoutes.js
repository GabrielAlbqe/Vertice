const express =
  require("express");

const router =
  express.Router();

const equipeController =
  require(
    "../controllers/equipeController"
  );

router.get(
  "/",
  equipeController.listarPorObra
);

router.get(
  "/:id",
  equipeController.buscarPorId
);

router.post(
  "/insert",
  equipeController.criar
);

router.put(
  "/insert/:id",
  equipeController.atualizar
);

// Nova rota específica para atribuição
router.patch(
  "/:id/obra",
  equipeController.alterarObra
);

router.delete(
  "/del/:id",
  equipeController.deletar
);

module.exports =
  router;