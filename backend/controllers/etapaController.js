const Etapa = require("../models/etapaModel");

exports.criar = (req, res) => {
  Etapa.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || err });
    
    res.status(201).json({
      message: "Etapa registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  Etapa.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.listarPorObra = (req, res) => {
  const id_obra = req.params.idObra || req.query.id_obra;

  if (!id_obra) {
    return Etapa.getAll((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }

  Etapa.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Etapa.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ message: "Etapa não encontrada." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Etapa.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Etapa não encontrada." });
    res.json({ message: "Etapa removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  Etapa.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Etapa não encontrada." });
    res.json({ message: "Etapa atualizada com sucesso!" });
  });
};