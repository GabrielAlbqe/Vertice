const Insumos = require(
  "../models/insumosModel"
);

const {
  dbStatus,
} = require(
  "../utils/dbError"
);

exports.listarPorObra = (
  req,
  res
) => {
  const idobra =
    req.query.idobra ||
    req.headers.idobra;

  if (!idobra) {
    return Insumos.getAll(
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

  Insumos.getByObra(
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

exports.buscarPorId = (
  req,
  res
) => {
  Insumos.getById(
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
              "Insumo não encontrado.",
          });
      }

      res.json(
        results[0]
      );
    }
  );
};

exports.deletar = (
  req,
  res
) => {
  Insumos.delete(
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
              "Insumo não encontrado.",
          });
      }

      res.json({
        message:
          "Insumo removido com sucesso!",
      });
    }
  );
};

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

  Insumos.create(
    dados,
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
            message:
              "Erro ao cadastrar insumo.",

            error:
              err.message,
          });
      }

      res
        .status(201)
        .json({
          insertId:
            result.insertId,

          message:
            "Insumo cadastrado com sucesso!",
        });
    }
  );
};

exports.atualizar = (
  req,
  res
) => {
  Insumos.update(
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
              "Insumo não encontrado.",
          });
      }

      res.json({
        message:
          "Insumo atualizado com sucesso!",
      });
    }
  );
};

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

  Insumos.alterarObra(
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
              "Insumo não encontrado.",
          });
      }

      res.json({
        message:
          idobra
            ? "Insumo atribuído à obra com sucesso."
            : "Insumo desatribuído da obra com sucesso.",
      });
    }
  );
};