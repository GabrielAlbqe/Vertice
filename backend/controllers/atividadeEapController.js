
const AtividadeEap = require("../models/atividadeEapModel");
const { dbStatus } = require("../utils/dbError");

function idValido(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return false;
  }

  return /^\d+$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor)) &&
    Number(valor) > 0;
}

function erroBanco(res, erro) {
  console.error("Erro nas atividades EAP:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar atividade EAP."
  });
}

function obterDados(body = {}) {
  return {
    descricao: body.descricao,
    idx_obra: body.idx_obra ?? body.id_obra
  };
}

function validarDados(dados) {
  if (
    typeof dados.descricao !== "string" ||
    !dados.descricao.trim()
  ) {
    return "A descrição da atividade é obrigatória.";
  }

  if (!idValido(dados.idx_obra)) {
    return "Informe um ID de obra válido.";
  }

  return null;
}

// GET /api/atividades-eap?id_obra=1
// Também aceita idx_obra=1
exports.listarPorObra = (req, res) => {
  const idObra =
    req.query.id_obra ??
    req.query.idx_obra ??
    req.headers["idx-obra"];

  if (!idValido(idObra)) {
    return res.status(400).json({
      message: "Informe um ID de obra válido."
    });
  }

  AtividadeEap.getByObra(idObra, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    return res.status(200).json(resultados);
  });
};

// GET /api/atividades-eap/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da atividade inválido."
    });
  }

  AtividadeEap.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        message: "Atividade não encontrada."
      });
    }

    return res.status(200).json(resultados[0]);
  });
};

// POST /api/atividades-eap/insert
exports.criar = (req, res) => {
  const dados = obterDados(req.body);
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  AtividadeEap.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Atividade cadastrada com sucesso!",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/atividades-eap/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da atividade inválido."
    });
  }

  const dados = obterDados(req.body);
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  AtividadeEap.update(
    req.params.id,
    dados,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Atividade não encontrada."
        });
      }

      return res.status(200).json({
        message: "Atividade atualizada com sucesso!"
      });
    }
  );
};

// DELETE /api/atividades-eap/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da atividade inválido."
    });
  }

  AtividadeEap.delete(
    req.params.id,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Atividade não encontrada."
        });
      }

      return res.status(200).json({
        message: "Atividade removida com sucesso!"
      });
    }
  );
};
