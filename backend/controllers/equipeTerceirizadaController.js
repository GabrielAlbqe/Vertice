const EquipeTerceirizada = require("../models/equipeTerceirizadaModel");

exports.criar = (req, res) => {
  EquipeTerceirizada.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || err });
    
    res.status(201).json({
      message: "Equipe terceirizada registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  EquipeTerceirizada.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.listarPorObra = (req, res) => {
  const id_obra = req.params.idObra || req.query.id_obra;
  
  if (!id_obra) {
    return EquipeTerceirizada.getAll((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }

  EquipeTerceirizada.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  EquipeTerceirizada.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  EquipeTerceirizada.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json({ message: "Equipe terceirizada removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  EquipeTerceirizada.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json({ message: "Equipe terceirizada atualizada com sucesso!" });
  });
};