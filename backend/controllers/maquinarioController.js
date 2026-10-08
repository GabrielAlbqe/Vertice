const Maquinario = require(
  "../models/maquinarioModel"
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
    return Maquinario.getAll(
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

  Maquinario.getByObra(
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

      res.json(
        results
      );
    }
  );
};

exports.buscarPorId = (
  req,
  res
) => {
  Maquinario.getById(
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
              "Maquinário não encontrado.",
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
  Maquinario.delete(
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
              "Maquinário não encontrado.",
          });
      }

      res.json({
        message:
          "Maquinário removido com sucesso!",
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

  Maquinario.create(
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
            error:
              err.message,
          });
      }

      res
        .status(201)
        .json({
          message:
            "Maquinário registrado com sucesso!",

          insertId:
            result.insertId,
        });
    }
  );
};

exports.atualizar = (
  req,
  res
) => {
  Maquinario.update(
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
              "Maquinário não encontrado.",
          });
      }

      res.json({
        message:
          "Maquinário atualizado com sucesso!",
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

  Maquinario.alterarObra(
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
              "Maquinário não encontrado.",
          });
      }

      res.json({
        message:
          idobra
            ? "Maquinário atribuído à obra com sucesso."
            : "Maquinário desatribuído da obra com sucesso.",
      });
    }
  );
};