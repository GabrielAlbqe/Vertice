const express =
  require("express");

const router =
  express.Router();

const insumosController =
  require(
    "../controllers/insumosController"
  );

router.get(
  "/",
  insumosController.listarPorObra
);

router.get(
  "/:id",
  insumosController.buscarPorId
);

router.post(
  "/insert",
  insumosController.criar
);

router.put(
  "/insert/:id",
  insumosController.atualizar
);

router.patch(
  "/:id/obra",
  insumosController.alterarObra
);

router.delete(
  "/del/:id",
  insumosController.deletar
);

module.exports =
  router;