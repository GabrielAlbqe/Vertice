const express =
  require("express");

const router =
  express.Router();

const maquinarioController =
  require(
    "../controllers/maquinarioController"
  );

router.get(
  "/",
  maquinarioController.listarPorObra
);

router.get(
  "/:id",
  maquinarioController.buscarPorId
);

router.post(
  "/insert",
  maquinarioController.criar
);

router.put(
  "/insert/:id",
  maquinarioController.atualizar
);

router.patch(
  "/:id/obra",
  maquinarioController.alterarObra
);

router.delete(
  "/del/:id",
  maquinarioController.deletar
);

module.exports =
  router;