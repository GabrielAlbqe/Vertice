
const Rdo = require("../models/rdoModel");
const { dbStatus } = require("../utils/dbError");

const TURNOS = ["Manhã", "Tarde", "Noite", "Integral"];

const CLIMAS = [
  "Ensolarado",
  "Nublado",
  "Chuvoso",
  "Impraticável"
];

function idValido(valor) {
  if (valor === null || valor === undefined || valor === "") {
    return false;
  }

  return /^\d+$/.test(String(valor)) &&
    Number.isSafeInteger(Number(valor)) &&
    Number(valor) > 0;
}

function dataValida(valor) {
  if (
    typeof valor !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(valor)
  ) {
    return false;
  }

  const [ano, mes, dia] = valor.split("-").map(Number);
  const data = new Date(Date.UTC(ano, mes - 1, dia));

  return (
    data.getUTCFullYear() === ano &&
    data.getUTCMonth() === mes - 1 &&
    data.getUTCDate() === dia
  );
}

function validarDados(dados) {
  if (!idValido(dados.id_obra)) {
    return "Informe um ID de obra válido.";
  }

  if (!dataValida(dados.data_rdo)) {
    return "Informe uma data válida no formato AAAA-MM-DD.";
  }

  if (!TURNOS.includes(dados.turno)) {
    return "Turno inválido.";
  }

  if (!CLIMAS.includes(dados.clima)) {
    return "Condição climática inválida.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro no módulo RDO:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar o relatório diário de obra."
  });
}

// GET /api/rdo?id_obra=1
exports.listarPorObra = (req, res) => {
  const idObra = req.query.id_obra ?? req.headers["id-obra"];

  if (!idValido(idObra)) {
    return res.status(400).json({
      message: "Informe um ID de obra válido."
    });
  }

  Rdo.getByObra(idObra, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    return res.status(200).json(resultados);
  });
};

// GET /api/rdo/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do RDO inválido."
    });
  }

  Rdo.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        message: "RDO não encontrado."
      });
    }

    return res.status(200).json(resultados[0]);
  });
};

// POST /api/rdo/insert
exports.criar = (req, res) => {
  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  Rdo.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "RDO registrado com sucesso!",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/rdo/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do RDO inválido."
    });
  }

  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  Rdo.update(req.params.id, dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "RDO não encontrado."
      });
    }

    return res.status(200).json({
      message: "RDO atualizado com sucesso!"
    });
  });
};

// DELETE /api/rdo/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do RDO inválido."
    });
  }

  Rdo.delete(req.params.id, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "RDO não encontrado."
      });
    }

    return res.status(200).json({
      message: "RDO removido com sucesso!"
    });
  });
};
