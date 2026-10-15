
const Insumos = require("../models/insumosModel");
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

function obterObra(dados) {
  const valor = dados?.idobra;

  if (valor === null || valor === undefined || valor === "") {
    return null;
  }

  return valor;
}

function erroBanco(res, erro) {
  console.error("Erro no módulo de insumos:", erro.message);

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar operação no banco."
  });
}

function validarObra(idObra, idConstrutora, res, continuar) {
  if (idObra === null) {
    return continuar();
  }

  if (!idValido(idObra)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  Insumos.verificarObra(
    Number(idObra),
    idConstrutora,
    (erro, obras) => {
      if (erro) return erroBanco(res, erro);

      if (!obras.length) {
        return res.status(404).json({
          message: "Obra não encontrada nesta construtora."
        });
      }

      return continuar();
    }
  );
}

function validarDados(dados) {
  if (
    typeof dados?.nome !== "string" ||
    !dados.nome.trim() ||
    dados.nome.trim().length > 45
  ) {
    return "Informe um nome válido de até 45 caracteres.";
  }

  const quantidade = dados.quantidade_disponivel;
  const valor = dados.valor_unitario;

  if (
    !Number.isSafeInteger(quantidade) ||
    quantidade < 0
  ) {
    return "Quantidade disponível inválida.";
  }

  if (
    typeof valor !== "number" ||
    !Number.isFinite(valor) ||
    valor < 0
  ) {
    return "Valor unitário inválido.";
  }

  return null;
}

exports.listarPorObra = (req, res) => {
  const idConstrutora = req.idConstrutora;
  const filtro = req.query.idobra ?? req.headers["idobra"];

  const responder = (erro, registros) => {
    if (erro) return erroBanco(res, erro);
    return res.json(registros);
  };

  if (filtro === undefined || filtro === "") {
    return Insumos.getAll(idConstrutora, responder);
  }

  if (filtro === "null") {
    return Insumos.getSemObra(idConstrutora, responder);
  }

  if (!idValido(filtro)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  return Insumos.getByObra(
    Number(filtro),
    idConstrutora,
    responder
  );
};

exports.buscarPorId = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do insumo inválido."
    });
  }

  Insumos.getById(
    Number(id),
    req.idConstrutora,
    (erro, registros) => {
      if (erro) return erroBanco(res, erro);

      if (!registros.length) {
        return res.status(404).json({
          message: "Insumo não encontrado."
        });
      }

      return res.json(registros[0]);
    }
  );
};

exports.criar = (req, res) => {
  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  const idObra = obterObra(dados);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Insumos.create(
        {
          nome: dados.nome.trim(),
          quantidade_disponivel: dados.quantidade_disponivel,
          valor_unitario: dados.valor_unitario,
          idobra: idObra === null ? null : Number(idObra)
        },
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          return res.status(201).json({
            message: "Insumo cadastrado com sucesso.",
            insertId: resultado.insertId
          });
        }
      );
    }
  );
};

exports.atualizar = (req, res) => {
  const id = req.params.id;
  const dados = req.body || {};

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do insumo inválido."
    });
  }

  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  const idObra = obterObra(dados);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Insumos.update(
        Number(id),
        {
          nome: dados.nome.trim(),
          quantidade_disponivel: dados.quantidade_disponivel,
          valor_unitario: dados.valor_unitario,
          idobra: idObra === null ? null : Number(idObra)
        },
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          if (!resultado.affectedRows) {
            return res.status(404).json({
              message: "Insumo não encontrado."
            });
          }

          return res.json({
            message: "Insumo atualizado com sucesso."
          });
        }
      );
    }
  );
};

exports.alterarObra = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do insumo inválido."
    });
  }

  if (
    !req.body ||
    !Object.prototype.hasOwnProperty.call(req.body, "idobra")
  ) {
    return res.status(400).json({
      message: "Informe idobra ou null para desatribuir."
    });
  }

  const idObra = obterObra(req.body);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Insumos.updateObra(
        Number(id),
        idObra === null ? null : Number(idObra),
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          if (!resultado.affectedRows) {
            return res.status(404).json({
              message: "Insumo não encontrado."
            });
          }

          return res.json({
            message: idObra === null
              ? "Insumo desatribuído com sucesso."
              : "Vínculo atualizado com sucesso.",
            id_insumos: Number(id),
            idobra: idObra === null ? null : Number(idObra)
          });
        }
      );
    }
  );
};

exports.deletar = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do insumo inválido."
    });
  }

  Insumos.delete(
    Number(id),
    req.idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (!resultado.affectedRows) {
        return res.status(404).json({
          message: "Insumo não encontrado."
        });
      }

      return res.json({
        message: "Insumo excluído definitivamente."
      });
    }
  );
};
