const Construtora = require("../models/construtoraModel");

// Lista todas as construtoras
exports.listarTodas = (req, res) => {
  Construtora.getAll((err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao listar construtoras." });
    res.json(results);
  });
};

// Busca detalhes de uma construtora específica por ID
exports.buscarPorId = (req, res) => {
  Construtora.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao buscar construtora." });
    if (results.length === 0) return res.status(404).json({ message: "Construtora não encontrada." });
    res.json(results[0]);
  });
};

// Remove um registro de construtora do sistema
exports.deletar = (req, res) => {
  Construtora.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao deletar construtora." });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Construtora não encontrada." });
    res.json({ message: "Construtora removida com sucesso!" });
  });
};

// Registra uma nova construtora (Corrigido para retornar JSON com insertId)
exports.criar = (req, res) => {
  Construtora.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || err });
    
    // Retorna JSON padronizado e o ID recém-gerado pelo MySQL
    res.status(201).json({
      message: "Construtora registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

// Atualiza os dados de uma construtora existente
exports.atualizar = (req, res) => {
  Construtora.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao atualizar construtora." });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Construtora não encontrada." });
    res.json({ message: "Construtora atualizada com sucesso!" });
  });
};