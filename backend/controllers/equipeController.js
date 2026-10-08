const Equipe = require(
  "../models/equipeModel"
);

const {
  dbStatus,
} = require(
  "../utils/dbError"
);

// =====================================================
// CRIAR
// =====================================================

exports.criar = (
  req,
  res
) => {
  const dados = {
    ...req.body,

    idobra:
      req.body?.idobra ||
      null,
  };

  Equipe.create(
    dados,
    (err, result) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message ||
              err,
          });
      }

      res
        .status(201)
        .json({
          message:
            "Equipe registrada com sucesso!",

          insertId:
            result.insertId,
        });
    }
  );
};

// =====================================================
// LISTAR
// =====================================================

exports.listarPorObra = (
  req,
  res
) => {
  const idobra =
    req.query.idobra ||
    req.headers.idobra;

  if (!idobra) {
    return Equipe.getAll(
      (
        err,
        results
      ) => {
        if (err) {
          return res
            .status(
              dbStatus(err)
            )
            .json({
              error:
                err.message,
            });
        }

        return res.json(
          results
        );
      }
    );
  }

  Equipe.getByObra(
    idobra,
    (
      err,
      results
    ) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message,
          });
      }

      return res.json(
        results
      );
    }
  );
};

// Compatibilidade
exports.listarTodas =
  exports.listarPorObra;

// =====================================================
// BUSCAR POR ID
// =====================================================

exports.buscarPorId = (
  req,
  res
) => {
  Equipe.getById(
    req.params.id,
    (
      err,
      results
    ) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message,
          });
      }

      if (
        !results ||
        results.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Equipe não encontrada.",
          });
      }

      res.json(
        results[0]
      );
    }
  );
};

// =====================================================
// EXCLUIR
// =====================================================

exports.deletar = (
  req,
  res
) => {
  Equipe.delete(
    req.params.id,
    (
      err,
      result
    ) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message,
          });
      }

      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Equipe não encontrada.",
          });
      }

      res.json({
        message:
          "Equipe removida com sucesso!",
      });
    }
  );
};

// =====================================================
// ATUALIZAR CADASTRO
// =====================================================

exports.atualizar = (
  req,
  res
) => {
  Equipe.update(
    req.params.id,
    req.body,
    (
      err,
      result
    ) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message,
          });
      }

      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Equipe não encontrada.",
          });
      }

      res.json({
        message:
          "Equipe atualizada com sucesso!",
      });
    }
  );
};

// =====================================================
// ALTERAR OBRA
// =====================================================

exports.alterarObra = (
  req,
  res
) => {
  let {
    idobra,
  } = req.body || {};

  if (
    idobra === "" ||
    idobra === undefined
  ) {
    idobra = null;
  }

  if (
    idobra !== null
  ) {
    idobra =
      Number(idobra);

    if (
      !Number.isInteger(
        idobra
      ) ||
      idobra <= 0
    ) {
      return res
        .status(400)
        .json({
          message:
            "ID da obra inválido.",
        });
    }
  }

  Equipe.alterarObra(
    req.params.id,
    idobra,
    (
      err,
      result
    ) => {
      if (err) {
        return res
          .status(
            dbStatus(err)
          )
          .json({
            error:
              err.message,
          });
      }

      if (
        result.affectedRows ===
        0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Equipe não encontrada.",
          });
      }

      res.json({
        message:
          idobra
            ? "Equipe atribuída à obra com sucesso."
            : "Equipe desatribuída da obra com sucesso.",
      });
    }
  );
};