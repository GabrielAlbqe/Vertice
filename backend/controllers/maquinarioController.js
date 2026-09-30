const Maquinario =
  require("../models/maquinarioModel");

exports.listarPorObra = (
  req,
  res
) => {
  const idobra =
    req.query.idobra ||
    req.query.id_obra;

  if (!idobra) {
    return Maquinario.getAll(
      (err, results) => {
        if (err) {
          return res.status(500).json({
            error: err.message,
          });
        }

        res.json(results);
      }
    );
  }

  Maquinario.getByObra(
    idobra,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      res.json(results);
    }
  );
};

exports.buscarPorId = (
  req,
  res
) => {
  Maquinario.getById(
    req.params.id,
    (err, results) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (
        !results ||
        results.length === 0
      ) {
        return res.status(404).json({
          message:
            "Maquinário não encontrado.",
        });
      }

      res.json(results[0]);
    }
  );
};

exports.deletar = (
  req,
  res
) => {
  Maquinario.delete(
    req.params.id,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
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
  Maquinario.create(
    req.body,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          message:
            "Erro ao cadastrar maquinário.",
          error:
            err.message,
        });
      }

      res.status(201).json({
        insertId:
          result.insertId,

        message:
          "Maquinário registrado com sucesso!",
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
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: err.message,
        });
      }

      if (
        result.affectedRows === 0
      ) {
        return res.status(404).json({
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