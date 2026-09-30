const express = require("express");
const router = express.Router();

const obraController = require("../controllers/obraController");

// LISTAR OBRAS
router.get(
  "/",
  obraController.listarPorConstrutora
);

// BUSCAR OBRA POR ID
router.get(
  "/:id",
  obraController.buscarPorId
);

// EXCLUIR OBRA
router.delete(
  "/del/:id",
  obraController.deletar
);

// CRIAR OBRA
router.post(
  "/insert",
  obraController.criar
);

// ATUALIZAR OBRA
router.put(
  "/insert/:id",
  obraController.atualizar
);

module.exports = router;