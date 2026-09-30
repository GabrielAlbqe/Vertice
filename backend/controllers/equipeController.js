const Equipe = require("../models/equipeModel");

exports.criar = (req, res) => {
  Equipe.create(
    req.body,
    (err, result) => {
      if (err) {
        return res.status(500).json({
          error: err.message || err,
        });
      }

      res.status(201).json({
        message:
          "Equipe registrada com sucesso!",
        insertId:
          result.insertId,
      });
    }
  );
};

exports.listarTodas = (req, res) => {
  Equipe.getAll(
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

exports.listarPorObra = (
  req,
  res
) => {
  const idobra =
    req.query.idobra ||
    req.query.id_obra;

  if (!idobra) {
    return Equipe.getAll(
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

  Equipe.getByObra(
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
  Equipe.getById(
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
            "Equipe não encontrada.",
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
  Equipe.delete(
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

exports.atualizar = (
  req,
  res
) => {
  Equipe.update(
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