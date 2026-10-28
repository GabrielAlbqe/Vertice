
const Obra = require("../models/obraModel");
const { dbStatus } = require("../utils/dbError");

function idValido(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    typeof valor === "boolean"
  ) {
    return false;
  }

  const numero = Number(valor);
  return Number.isSafeInteger(numero) && numero > 0;
}

function erroBanco(res, erro) {
  console.error("Erro no módulo de obras:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar operação de obras."
  });
}

function validarDados(dados) {
  if (
    typeof dados.nome !== "string" ||
    !dados.nome.trim()
  ) {
    return "Nome da obra é obrigatório.";
  }

  if (!idValido(dados.id_construtora)) {
    return "Construtora inválida.";
  }

  if (
    !Number.isSafeInteger(Number(dados.numero_pavimentos)) ||
    Number(dados.numero_pavimentos) < 0
  ) {
    return "Número de pavimentos inválido.";
  }

  if (
    !dados.data_inicio_planejada ||
    !dados.data_termino_planejada
  ) {
    return "Informe as datas planejadas.";
  }

  if (
    !Number.isFinite(Number(dados.orcamento_planejado)) ||
    Number(dados.orcamento_planejado) < 0
  ) {
    return "Orçamento planejado inválido.";
  }

  return null;
}

// GET /api/obras
exports.listarTodas = (req, res) => {
  Obra.getAll((erro, resultados) => {
    if (erro) return erroBanco(res, erro);
    return res.json(resultados);
  });
};

// GET /api/obras?idconstrutora=1
exports.listarPorConstrutora = (req, res) => {
  const idConstrutora =
    req.query.idconstrutora ??
    req.query.id_construtora;

  if (idConstrutora === undefined || idConstrutora === "") {
    return exports.listarTodas(req, res);
  }

  if (!idValido(idConstrutora)) {
    return res.status(400).json({
      message: "ID da construtora inválido."
    });
  }

  Obra.getByConstrutora(
    Number(idConstrutora),
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);
      return res.json(resultados);
    }
  );
};

// GET /api/obras/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  Obra.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados.length) {
      return res.status(404).json({
        message: "Obra não encontrada."
      });
    }

    return res.json(resultados[0]);
  });
};

// POST /api/obras/insert
exports.criar = (req, res) => {
  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  Obra.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Obra cadastrada com sucesso.",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/obras/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  Obra.update(req.params.id, dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (!resultado.affectedRows) {
      return res.status(404).json({
        message: "Obra não encontrada."
      });
    }

    return res.json({
      message: "Obra atualizada com sucesso."
    });
  });
};

// DELETE /api/obras/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  Obra.delete(req.params.id, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (!resultado.affectedRows) {
      return res.status(404).json({
        message: "Obra não encontrada."
      });
    }

    return res.json({
      message: "Obra excluída com sucesso."
    });
  });
};
