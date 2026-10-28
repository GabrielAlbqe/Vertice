
const RdoEquipe = require("../models/rdoEquipeModel");
const { dbStatus } = require("../utils/dbError");

const ETAPAS = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamento"
];

function idValido(valor) {
  if (
    valor === undefined ||
    valor === null ||
    valor === ""
  ) {
    return false;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0;
}

function validarDados(dados) {
  if (!idValido(dados.id_rdo)) {
    return "Informe um RDO válido.";
  }

  if (!idValido(dados.id_equipe)) {
    return "Informe uma equipe válida.";
  }

  if (!ETAPAS.includes(dados.etapa)) {
    return "Etapa de atuação inválida.";
  }

  if (
    dados.dias_atuacao === undefined ||
    dados.dias_atuacao === null ||
    dados.dias_atuacao === "" ||
    !Number.isFinite(Number(dados.dias_atuacao)) ||
    Number(dados.dias_atuacao) <= 0
  ) {
    return "Informe uma quantidade de dias válida.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro no módulo RDO Equipes:", erro);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar equipe do RDO."
  });
}

// GET /api/rdo-equipes?id_rdo=1
exports.listarPorRdo = (req, res) => {
  const idRdo = req.query.id_rdo ?? req.headers["id-rdo"];

  if (!idValido(idRdo)) {
    return res.status(400).json({
      message: "Informe um ID de RDO válido."
    });
  }

  RdoEquipe.getByRdo(idRdo, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    return res.status(200).json(resultados);
  });
};

// GET /api/rdo-equipes/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do registro inválido."
    });
  }

  RdoEquipe.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        message: "Registro não encontrado."
      });
    }

    return res.status(200).json(resultados[0]);
  });
};

// POST /api/rdo-equipes/insert
exports.criar = (req, res) => {
  const dados = req.body || {};

  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  RdoEquipe.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Equipe vinculada ao RDO com sucesso!",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/rdo-equipes/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do registro inválido."
    });
  }

  const dados = req.body || {};

  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  RdoEquipe.update(req.params.id, dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "Registro não encontrado."
      });
    }

    return res.status(200).json({
      message: "Equipe do RDO atualizada com sucesso!"
    });
  });
};

// DELETE /api/rdo-equipes/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do registro inválido."
    });
  }

  RdoEquipe.delete(req.params.id, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "Registro não encontrado."
      });
    }

    return res.status(200).json({
      message: "Equipe removida do RDO com sucesso!"
    });
  });
};
