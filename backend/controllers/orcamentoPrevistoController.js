
const OrcamentoPrevisto = require("../models/orcamentoPrevistoModel");
const { dbStatus } = require("../utils/dbError");

function idValido(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    valor !== "" &&
    /^\d+$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor)) &&
    Number(valor) > 0
  );
}

function valorValido(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    valor !== "" &&
    typeof valor !== "boolean" &&
    Number.isFinite(Number(valor)) &&
    Number(valor) >= 0 &&
    Number(valor) <= 9999999999999.99
  );
}

function validarDados(dados, cadastro = false) {
  if (cadastro && !idValido(dados.id_orcamento)) {
    return "Informe um ID de orçamento válido.";
  }

  if (!idValido(dados.id_atividade_eap)) {
    return "Informe uma atividade EAP válida.";
  }

  if (!valorValido(dados.valor_planejado)) {
    return "Informe um valor planejado válido.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro em Orçamentos Previstos:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar orçamento previsto."
  });
}

// GET /api/orcamentos-previstos?id_atividade_eap=1
exports.listarPorAtividadeEap = (req, res) => {
  const idAtividade =
    req.query.id_atividade_eap ??
    req.headers["id-atividade-eap"];

  if (!idValido(idAtividade)) {
    return res.status(400).json({
      message: "Informe um ID de atividade EAP válido."
    });
  }

  OrcamentoPrevisto.getByAtividadeEap(
    idAtividade,
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);

      return res.status(200).json(resultados);
    }
  );
};

// GET /api/orcamentos-previstos/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do orçamento inválido."
    });
  }

  OrcamentoPrevisto.getById(
    req.params.id,
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);

      if (!resultados || resultados.length === 0) {
        return res.status(404).json({
          message: "Orçamento previsto não encontrado."
        });
      }

      return res.status(200).json(resultados[0]);
    }
  );
};

// POST /api/orcamentos-previstos/insert
exports.criar = (req, res) => {
  const dados = req.body || {};
  const mensagem = validarDados(dados, true);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  OrcamentoPrevisto.create(dados, (erro) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Orçamento previsto cadastrado com sucesso!",
      insertId: Number(dados.id_orcamento)
    });
  });
};

// PUT /api/orcamentos-previstos/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do orçamento inválido."
    });
  }

  const dados = req.body || {};
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  OrcamentoPrevisto.update(
    req.params.id,
    dados,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Orçamento previsto não encontrado."
        });
      }

      return res.status(200).json({
        message: "Orçamento previsto atualizado com sucesso!"
      });
    }
  );
};

// DELETE /api/orcamentos-previstos/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do orçamento inválido."
    });
  }

  OrcamentoPrevisto.delete(
    req.params.id,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Orçamento previsto não encontrado."
        });
      }

      return res.status(200).json({
        message: "Orçamento previsto removido com sucesso!"
      });
    }
  );
};
