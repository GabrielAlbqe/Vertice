
const Maquinario = require("../models/maquinarioModel");
const { dbStatus } = require("../utils/dbError");

const etapasPermitidas = [
  "Mobilização",
  "Infraestrutura",
  "Supraestrutura e Alvenaria",
  "Instalações",
  "Revestimentos",
  "Acabamentos"
];

const statusPermitidos = ["Ativo", "Inativo"];

function idValido(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === "" ||
    typeof valor === "boolean" ||
    typeof valor === "object"
  ) {
    return false;
  }

  const numero = Number(valor);

  return Number.isSafeInteger(numero) && numero > 0;
}

function normalizarObra(valor) {
  if (
    valor === null ||
    valor === undefined ||
    valor === ""
  ) {
    return null;
  }

  return valor;
}

function erroBanco(res, erro) {
  console.error(
    "Erro ao acessar maquinários:",
    erro.message
  );

  return res.status(dbStatus(erro)).json({
    message: "Erro ao processar operação no banco."
  });
}

function validarDados(dados) {
  if (
    typeof dados?.nome !== "string" ||
    !dados.nome.trim() ||
    dados.nome.trim().length > 45
  ) {
    return "Informe um nome válido de até 45 caracteres.";
  }

  if (
    !Number.isSafeInteger(dados.quantidade) ||
    dados.quantidade < 0
  ) {
    return "Quantidade inválida.";
  }

  if (
    dados.etapa_atuacao !== null &&
    dados.etapa_atuacao !== undefined &&
    !etapasPermitidas.includes(dados.etapa_atuacao)
  ) {
    return "Etapa de atuação inválida.";
  }

  if (
    dados.custo_diario !== null &&
    dados.custo_diario !== undefined &&
    (
      typeof dados.custo_diario !== "number" ||
      !Number.isFinite(dados.custo_diario) ||
      dados.custo_diario < 0
    )
  ) {
    return "Custo diário inválido.";
  }

  if (
    dados.status !== null &&
    dados.status !== undefined &&
    !statusPermitidos.includes(dados.status)
  ) {
    return "Status inválido.";
  }

  return null;
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

  Maquinario.verificarObra(
    Number(idObra),
    idConstrutora,
    (erro, obras) => {
      if (erro) {
        return erroBanco(res, erro);
      }

      if (!obras.length) {
        return res.status(404).json({
          message: "Obra não encontrada nesta construtora."
        });
      }

      return continuar();
    }
  );
}

// GET /api/maquinarios
// GET /api/maquinarios?idobra=1
// GET /api/maquinarios?idobra=null
exports.listarPorObra = (req, res) => {
  const idConstrutora = req.idConstrutora;

  const filtro =
    req.query.idobra ?? req.headers["idobra"];

  const responder = (erro, registros) => {
    if (erro) return erroBanco(res, erro);
    return res.json(registros);
  };

  if (
    filtro === undefined ||
    filtro === ""
  ) {
    return Maquinario.getAll(
      idConstrutora,
      responder
    );
  }

  if (filtro === "null") {
    return Maquinario.getSemObra(
      idConstrutora,
      responder
    );
  }

  if (!idValido(filtro)) {
    return res.status(400).json({
      message: "ID da obra inválido."
    });
  }

  return Maquinario.getByObra(
    Number(filtro),
    idConstrutora,
    responder
  );
};

// GET /api/maquinarios/:id
exports.buscarPorId = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do maquinário inválido."
    });
  }

  Maquinario.getById(
    Number(id),
    req.idConstrutora,
    (erro, registros) => {
      if (erro) return erroBanco(res, erro);

      if (!registros.length) {
        return res.status(404).json({
          message: "Maquinário não encontrado."
        });
      }

      return res.json(registros[0]);
    }
  );
};

// POST /api/maquinarios/insert
exports.criar = (req, res) => {
  const dados = req.body || {};
  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  const idObra = normalizarObra(dados.idobra);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Maquinario.create(
        {
          nome: dados.nome.trim(),
          quantidade: dados.quantidade,
          etapa_atuacao: dados.etapa_atuacao ?? null,
          custo_diario: dados.custo_diario ?? null,
          status: dados.status ?? "Ativo",
          idobra: idObra === null
            ? null
            : Number(idObra)
        },
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          return res.status(201).json({
            message: "Maquinário cadastrado com sucesso.",
            insertId: resultado.insertId
          });
        }
      );
    }
  );
};

// PUT /api/maquinarios/insert/:id
exports.atualizar = (req, res) => {
  const id = req.params.id;
  const dados = req.body || {};

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do maquinário inválido."
    });
  }

  const erroValidacao = validarDados(dados);

  if (erroValidacao) {
    return res.status(400).json({
      message: erroValidacao
    });
  }

  const idObra = normalizarObra(dados.idobra);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Maquinario.update(
        Number(id),
        {
          nome: dados.nome.trim(),
          quantidade: dados.quantidade,
          etapa_atuacao: dados.etapa_atuacao ?? null,
          custo_diario: dados.custo_diario ?? null,
          status: dados.status ?? "Ativo",
          idobra: idObra === null
            ? null
            : Number(idObra)
        },
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          if (!resultado.affectedRows) {
            return res.status(404).json({
              message: "Maquinário não encontrado."
            });
          }

          return res.json({
            message: "Maquinário atualizado com sucesso."
          });
        }
      );
    }
  );
};

// PATCH /api/maquinarios/:id/obra
exports.alterarObra = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do maquinário inválido."
    });
  }

  if (
    !req.body ||
    !Object.prototype.hasOwnProperty.call(
      req.body,
      "idobra"
    )
  ) {
    return res.status(400).json({
      message: "Informe idobra ou null para desatribuir."
    });
  }

  const idObra = normalizarObra(req.body.idobra);

  return validarObra(
    idObra,
    req.idConstrutora,
    res,
    () => {
      Maquinario.updateObra(
        Number(id),
        idObra === null ? null : Number(idObra),
        req.idConstrutora,
        (erro, resultado) => {
          if (erro) return erroBanco(res, erro);

          if (!resultado.affectedRows) {
            return res.status(404).json({
              message: "Maquinário não encontrado."
            });
          }

          return res.json({
            message: idObra === null
              ? "Maquinário desatribuído com sucesso."
              : "Vínculo do maquinário atualizado com sucesso.",
            id_maquina: Number(id),
            idobra: idObra === null
              ? null
              : Number(idObra)
          });
        }
      );
    }
  );
};

// DELETE /api/maquinarios/del/:id
exports.deletar = (req, res) => {
  const id = req.params.id;

  if (!idValido(id)) {
    return res.status(400).json({
      message: "ID do maquinário inválido."
    });
  }

  Maquinario.delete(
    Number(id),
    req.idConstrutora,
    (erro, resultado) => {
      if (erro) return erroBanco(res, erro);

      if (!resultado.affectedRows) {
        return res.status(404).json({
          message: "Maquinário não encontrado."
        });
      }

      return res.json({
        message: "Maquinário excluído definitivamente."
      });
    }
  );
};
