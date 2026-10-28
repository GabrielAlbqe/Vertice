
const CustoRealizado = require("../models/custoRealizadoModel");
const { dbStatus } = require("../utils/dbError");

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

function decimalValido(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    typeof valor === "boolean"
  ) {
    return false;
  }

  const numero = Number(valor);

  return (
    Number.isFinite(numero) &&
    numero >= 0 &&
    numero <= 99999999.99 &&
    Math.abs(numero * 100 - Math.round(numero * 100)) < 0.000001
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

  if (!idValido(dados.id_etapa)) {
    return "Informe um ID de etapa válido.";
  }

  if (!idValido(dados.id_rdo)) {
    return "Informe um ID de RDO válido.";
  }

  if (!ORIGENS.includes(dados.origem_custo)) {
    return "Origem do custo inválida.";
  }

  if (!idValido(dados.id_origem)) {
    return "Informe um ID de origem válido.";
  }

  if (!dataValida(dados.data)) {
    return "Informe uma data válida no formato AAAA-MM-DD.";
  }

  if (
    !decimalValido(dados.quantidade) ||
    Number(dados.quantidade) <= 0
  ) {
    return "Quantidade inválida.";
  }

  if (!decimalValido(dados.custo_unitario)) {
    return "Custo unitário inválido.";
  }

  return null;
}

function erroBanco(res, erro) {
  console.error("Erro em Custos Realizados:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar custo realizado."
  });
}

function construtora(req, res) {
  if (!idValido(req.idConstrutora)) {
    res.status(403).json({
      message: "Construtora não autorizada."
    });

    return null;
  }

  return Number(req.idConstrutora);
}

// GET /api/custos-realizados?id_obra=1
// GET /api/custos-realizados?id_rdo=1
exports.listar = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  const idRdo =
    req.query.id_rdo ?? req.headers["id-rdo"];

  const idObra =
    req.query.id_obra ?? req.headers["id-obra"];

  const callback = (erro, resultados) => {
    if (erro) return erroBanco(res, erro);
    return res.status(200).json(resultados);
  };

  if (idRdo !== undefined) {
    if (!idValido(idRdo)) {
      return res.status(400).json({
        message: "ID de RDO inválido."
      });
    }

    return CustoRealizado.getByRdo(
      idRdo,
      idConstrutora,
      callback
    );
  }

  if (idObra !== undefined) {
    if (!idValido(idObra)) {
      return res.status(400).json({
        message: "ID de obra inválido."
      });
    }

    return CustoRealizado.getByObra(
      idObra,
      idConstrutora,
      callback
    );
  }

  return res.status(400).json({
    message: "Informe id_obra ou id_rdo para consultar custos."
  });
};

// GET /api/custos-realizados/:id
exports.buscarPorId = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do custo inválido."
    });
  }

  CustoRealizado.getById(
    req.params.id,
    idConstrutora,
    (erro, resultados) => {
      if (erro) return erroBanco(res, erro);

      if (!resultados || resultados.length === 0) {
        return res.status(404).json({
          message: "Custo realizado não encontrado."
        });
      }

      return res.status(200).json(resultados[0]);
    }
  );
};

// POST /api/custos-realizados/insert
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

  CustoRealizado.create(
    dados,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Obra, etapa ou RDO não encontrado ou incompatível."
        });
      }

      return res.status(201).json({
        message: "Custo realizado registrado com sucesso!",
        insertId: resultado.insertId
      });
    }
  );
};

// PUT /api/custos-realizados/insert/:id
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

  CustoRealizado.update(
    req.params.id,
    dados,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message:
            "Custo não encontrado ou vínculos não autorizados."
        });
      }

      return res.status(200).json({
        message: "Custo realizado atualizado com sucesso!"
      });
    }
  );
};

// DELETE /api/custos-realizados/del/:id
exports.deletar = (req, res) => {
  const idConstrutora = construtora(req, res);
  if (!idConstrutora) return;

  if (!idValido(req.params.id)) {
    return res.status(400).json({
      message: "ID do custo inválido."
    });
  }

  CustoRealizado.delete(
    req.params.id,
    idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (resultado.affectedRows === 0) {
        return res.status(404).json({
          message: "Custo realizado não encontrado."
        });
      }

      return res.status(200).json({
        message: "Custo realizado removido com sucesso!"
      });
    }
  );
};
