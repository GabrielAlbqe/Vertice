
const CustoPlanejado = require("../models/custoPlanejadoModel");
const { dbStatus } = require("../utils/dbError");

const ETAPAS = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamento"
];

const ORIGENS = ["Equipe", "Insumo", "Maquinário"];

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

function validarDados(dados) {
  if (!idValido(dados.id_obra)) {
    return "Informe um ID de obra válido.";
  }

  if (!ETAPAS.includes(dados.etapa)) {
    return "Etapa da obra inválida.";
  }

  if (!ORIGENS.includes(dados.origem_custo)) {
    return "Origem do custo inválida.";
  }

  const valor = Number(dados.valor_planejado);

  if (
    dados.valor_planejado === null ||
    dados.valor_planejado === undefined ||
    dados.valor_planejado === "" ||
    typeof dados.valor_planejado === "boolean" ||
    !Number.isFinite(valor) ||
    valor < 0 ||
    valor > 99999999.99
  ) {
    return "Valor planejado inválido.";
  }

  if (!dataValida(dados.data_inicio_prevista)) {
    return "Data de início prevista inválida.";
  }

  if (!dataValida(dados.data_fim_prevista)) {
    return "Data de término prevista inválida.";
  }

  if (dados.data_fim_prevista < dados.data_inicio_prevista) {
    return "A data final não pode ser anterior à inicial.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro em Custos Planejados:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar custo planejado."
  });
}

function construtora(req, res) {
  if (!idValido(req.idConstrutora)) {
    res.status(403).json({
      message: "Construtora não autorizada."
    });
    return null;
  }

  return req.idConstrutora;
}

// GET /api/custos-planejados?id_obra=1
exports.listarPorObra = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  const idObra = req.query.id_obra;

  if (!idValido(idObra)) {
    return res.status(400).json({
      message: "Informe um ID de obra válido."
    });
  }

  CustoPlanejado.getByObra(
    idObra,
    idConstrutora,
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);

      return res.status(200).json(resultados);
    }
  );
};

exports.listarTodos = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  return res.status(400).json({
    message: "Informe id_obra para listar custos planejados."
  });
};

// GET /api/custos-planejados/:id
exports.buscarPorId = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do custo inválido."
    });
  }

  CustoPlanejado.getById(
    req.params.id,
    idConstrutora,
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);

      if (!resultados || resultados.length === 0) {
        return res.status(404).json({
          message: "Custo planejado não encontrado."
        });
      }

      return res.status(200).json(resultados[0]);
    }
  );
};

// POST /api/custos-planejados/insert
exports.criar = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  const dados = req.body || {};
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  CustoPlanejado.create(
    dados,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Obra não encontrada."
        });
      }

      return res.status(201).json({
        message: "Custo planejado registrado com sucesso!",
        insertId: resultado.insertId
      });
    }
  );
};

// PUT /api/custos-planejados/insert/:id
exports.atualizar = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do custo inválido."
    });
  }

  const dados = req.body || {};
  const mensagem = validarDados(dados);

  if (mensagem) {
    return res.status(400).json({
      message: mensagem
    });
  }

  CustoPlanejado.update(
    req.params.id,
    dados,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Custo planejado não encontrado ou obra não autorizada."
        });
      }

      return res.status(200).json({
        message: "Custo planejado atualizado com sucesso!"
      });
    }
  );
};

// DELETE /api/custos-planejados/del/:id
exports.deletar = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do custo inválido."
    });
  }

  CustoPlanejado.delete(
    req.params.id,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Custo planejado não encontrado."
        });
      }

      return res.status(200).json({
        message: "Custo planejado removido com sucesso!"
      });
    }
  );
};
