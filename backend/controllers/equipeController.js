const Equipe = require("../models/equipeModel");

exports.criar = (req, res) => {
  console.log("PAYLOAD DA EQUIPE RECEBIDO:", req.body);

  Equipe.create(req.body, (err, result) => {
    if (err) {
      console.error("❌ ERRO NO BANCO AO INSERIR EQUIPE:", err);
      return res.status(500).json({ error: err.message || err });
    }
    
    res.status(201).json({
      message: "Equipe registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  Equipe.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

// Adicionada a função exigida pelas rotas
exports.listarPorObra = (req, res) => {
  Equipe.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Equipe.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Equipe.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json({ message: "Equipe removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  Equipe.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json({ message: "Equipe atualizada com sucesso!" });
  });
};