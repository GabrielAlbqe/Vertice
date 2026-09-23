const EquipeEtapa = require("../models/equipeEtapaModel");

exports.criar = (req, res) => {
  EquipeEtapa.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || err });
    
    res.status(201).json({
      message: "Etapa da equipe registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  EquipeEtapa.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.listarPorEquipe = (req, res) => {
  const id_equipe = req.params.idEquipe || req.query.id_equipe;
  
  if (!id_equipe) {
    return EquipeEtapa.getAll((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }

  EquipeEtapa.getByEquipe(id_equipe, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  EquipeEtapa.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Etapa da equipe não encontrada." });
    }
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  EquipeEtapa.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etapa da equipe não encontrada." });
    }
    res.json({ message: "Etapa da equipe removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  EquipeEtapa.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Etapa da equipe não encontrada." });
    }
    res.json({ message: "Etapa da equipe atualizada com sucesso!" });
  });
};