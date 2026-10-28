
const RdoMaquinario = require("../models/rdoMaquinarioModel");
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
  return (
    valor !== null &&
    valor !== undefined &&
    /^\d+$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor)) &&
    Number(valor) > 0
  );
}

function numeroValido(valor) {
  return (
    valor !== null &&
    valor !== undefined &&
    valor !== "" &&
    typeof valor !== "boolean" &&
    Number.isFinite(Number(valor)) &&
    Number(valor) > 0
  );
}

function validarDados(dados) {
  if (!idValido(dados.id_rdo)) {
    return "Informe um RDO válido.";
  }

  if (!idValido(dados.id_maquinario)) {
    return "Informe um maquinário válido.";
  }

  if (!ETAPAS.includes(dados.etapa)) {
    return "Etapa da obra inválida.";
  }

  if (!numeroValido(dados.quantidade_utilizada)) {
    return "Quantidade utilizada inválida.";
  }

  if (!numeroValido(dados.tempo_utilizacao)) {
    return "Tempo de utilização inválido.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro no RDO Maquinário:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar maquinário do RDO."
  });
}

// GET /api/rdo-maquinarios?id_rdo=1
exports.listarPorRdo = (req, res) => {
  const idRdo = req.query.id_rdo ?? req.headers["id-rdo"];

  if (!idValido(idRdo)) {
    return res.status(400).json({
      message: "Informe um ID de RDO válido."
    });
  }

  RdoMaquinario.getByRdo(idRdo, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    return res.status(200).json(resultados);
  });
};

// GET /api/rdo-maquinarios/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do registro inválido."
    });
  }

  RdoMaquinario.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        message: "Registro não encontrado."
      });
    }

    return res.status(200).json(resultados[0]);
  });
};

// POST /api/rdo-maquinarios/insert
exports.criar = (req, res) => {
  const dados = req.body || {};
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  RdoMaquinario.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Maquinário vinculado ao RDO com sucesso!",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/rdo-maquinarios/insert/:id
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

  RdoMaquinario.update(
    req.params.id,
    dados,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Registro não encontrado."
        });
      }

      return res.status(200).json({
        message: "Maquinário do RDO atualizado com sucesso!"
      });
    }
  );
};

// DELETE /api/rdo-maquinarios/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do registro inválido."
    });
  }

  RdoMaquinario.delete(req.params.id, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "Registro não encontrado."
      });
    }

    return res.status(200).json({
      message: "Maquinário removido do RDO com sucesso!"
    });
  });
};
