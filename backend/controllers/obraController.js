const Obra = require("../models/obraModel");

// =====================================================
// CRIAR OBRA
// =====================================================

exports.criar = (req, res) => {
  Obra.create(
    req.body,
    (err, result) => {
      if (err) {
        console.error(
          "Erro ao criar obra:",
          err
        );

        return res
          .status(500)
          .json({
            error:
              err.message ||
              err,
          });
      }

      return res
        .status(201)
        .json({
          message:
            "Obra registrada com sucesso!",

          insertId:
            result.insertId,
        });
    }
  );
};

// =====================================================
// LISTAR TODAS
// =====================================================

exports.listarTodas = (req, res) => {
  Obra.getAll(
    (err, results) => {
      if (err) {
        console.error(
          "Erro ao listar obras:",
          err
        );

        return res
          .status(500)
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

// =====================================================
// LISTAR POR CONSTRUTORA
// =====================================================

exports.listarPorConstrutora = (
  req,
  res
) => {
  const idConstrutora =
    req.query.id_construtora ||
    req.query.idconstrutora;

  // Se não mandar construtora,
  // lista todas as obras
  if (!idConstrutora) {
    return Obra.getAll(
      (err, results) => {
        if (err) {
          console.error(
            "Erro ao listar todas as obras:",
            err
          );

          return res
            .status(500)
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

  // Se mandar construtora,
  // filtra por ela
  Obra.getByConstrutora(
    idConstrutora,
    (err, results) => {
      if (err) {
        console.error(
          "Erro ao listar obras da construtora:",
          err
        );

        return res
          .status(500)
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

// =====================================================
// BUSCAR POR ID
// =====================================================

exports.buscarPorId = (
  req,
  res
) => {
  Obra.getById(
    req.params.id,
    (err, results) => {
      if (err) {
        console.error(
          "Erro ao buscar obra:",
          err
        );

        return res
          .status(500)
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
              "Obra não encontrada.",
          });
      }

      return res.json(
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
  Obra.delete(
    req.params.id,
    (err, result) => {
      if (err) {
        console.error(
          "Erro ao excluir obra:",
          err
        );

        return res
          .status(500)
          .json({
            error:
              err.message,
          });
      }

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Obra não encontrada.",
          });
      }

      return res.json({
        message:
          "Obra removida com sucesso!",
      });
    }
  );
};

// =====================================================
// ATUALIZAR
// =====================================================

exports.atualizar = (
  req,
  res
) => {
  Obra.update(
    req.params.id,
    req.body,
    (err, result) => {
      if (err) {
        console.error(
          "Erro ao atualizar obra:",
          err
        );

        return res
          .status(500)
          .json({
            error:
              err.message,
          });
      }

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Obra não encontrada.",
          });
      }

      return res.json({
        message:
          "Obra atualizada com sucesso!",
      });
    }
  );
};