const Obra = require("../models/obraModel");
const { dbStatus, safeDbMessage } = require("../utils/dbError");

exports.criar = (req, res) => {
  Obra.create(req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) || err });
    
    res.status(201).json({
      message: "Obra registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  Obra.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

// Função exigida em routes/obraRoutes.js
exports.listarPorConstrutora = (req, res) => {
  const id = req.query.id_construtora;
  const consultar = id ? callback => Obra.getByConstrutora(id, callback) : Obra.getAll;
  consultar((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Obra.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (!results || results.length === 0) return res.status(404).json({ message: "Obra não encontrada." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Obra.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Obra não encontrada." });
    res.json({ message: "Obra removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  Obra.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Obra não encontrada." });
    res.json({ message: "Obra atualizada com sucesso!" });
  });
};
