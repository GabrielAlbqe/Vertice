
const DiarioObra = require("../models/diarioObraModel");
const { dbStatus } = require("../utils/dbError");

const CLIMAS = ["Ensolarado", "Chuvoso"];
const TURNOS = ["Manhã", "Tarde", "Noite"];

const ETAPAS = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamentos"
];

const EQUIPES = ["A", "B", "C"];

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

function opcional(valor) {
  return valor === undefined || valor === ""
    ? null
    : valor;
}

function enumValido(valor, permitidos) {
  return (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    permitidos.includes(valor)
  );
}

function prepararDados(body = {}) {
  return {
    data: body.data,
    clima: opcional(body.clima),
    turno: opcional(body.turno),
    etapa_atuacao: opcional(body.etapa_atuacao),
    equipe_interna: opcional(body.equipe_interna),
    equipe_terceirizada: opcional(body.equipe_terceirizada),
    paralisacoes: opcional(body.paralisacoes),
    origem_paralisacoes: opcional(body.origem_paralisacoes),
    atrasos: opcional(body.atrasos),
    origem_atrasos: opcional(body.origem_atrasos),
    obrax_id: body.obrax_id ?? body.id_obra,
    usuario_id: body.usuario_id
  };
}

function validarDados(dados) {
  if (!dataValida(dados.data)) {
    return "Informe uma data válida no formato AAAA-MM-DD.";
  }

  if (!idValido(dados.obrax_id)) {
    return "Informe um ID de obra válido.";
  }

  if (!idValido(dados.usuario_id)) {
    return "Informe um ID de usuário válido.";
  }

  if (!enumValido(dados.clima, CLIMAS)) {
    return "Clima inválido.";
  }

  if (!enumValido(dados.turno, TURNOS)) {
    return "Turno inválido.";
  }

  if (!enumValido(dados.etapa_atuacao, ETAPAS)) {
    return "Etapa de atuação inválida.";
  }

  if (!enumValido(dados.equipe_interna, EQUIPES)) {
    return "Equipe interna inválida.";
  }

  if (!enumValido(dados.equipe_terceirizada, EQUIPES)) {
    return "Equipe terceirizada inválida.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro no Diário de Obra:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar diário de obra."
  });
}

// GET /api/diarios-obra?id_obra=1
exports.listarPorObra = (req, res) => {
  const idObra =
    req.query.id_obra ??
    req.query.obrax_id ??
    req.headers["obrax-id"];

  if (!idValido(idObra)) {
    return res.status(400).json({
      message: "Informe um ID de obra válido."
    });
  }

  DiarioObra.getByObra(idObra, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    return res.status(200).json(resultados);
  });
};

// GET /api/diarios-obra/:id
exports.buscarPorId = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do diário inválido."
    });
  }

  DiarioObra.getById(req.params.id, (erro, resultados) => {
    if (erro) return erroBanco(res, erro);

    if (!resultados || resultados.length === 0) {
      return res.status(404).json({
        message: "Diário de obra não encontrado."
      });
    }

    return res.status(200).json(resultados[0]);
  });
};

// POST /api/diarios-obra/insert
exports.criar = (req, res) => {
  const dados = prepararDados(req.body || {});
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  DiarioObra.create(dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    return res.status(201).json({
      message: "Diário de obra registrado com sucesso!",
      insertId: resultado.insertId
    });
  });
};

// PUT /api/diarios-obra/insert/:id
exports.atualizar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do diário inválido."
    });
  }

  const dados = prepararDados(req.body || {});
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  DiarioObra.update(req.params.id, dados, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "Diário de obra não encontrado."
      });
    }

    return res.status(200).json({
      message: "Diário de obra atualizado com sucesso!"
    });
  });
};

// DELETE /api/diarios-obra/del/:id
exports.deletar = (req, res) => {
  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do diário inválido."
    });
  }

  DiarioObra.delete(req.params.id, (erro, resultado) => {
    if (erro) return erroBanco(res, erro);

    if (resultado.affectedRows === 0) {
      return res.status(404).json({
        message: "Diário de obra não encontrado."
      });
    }

    return res.status(200).json({
      message: "Diário de obra removido com sucesso!"
    });
  });
};
