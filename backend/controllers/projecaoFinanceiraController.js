const ProjecaoFinanceira = require("../models/projecaoFinanceiraModel");

// Lista as projeções financeiras filtrando por ID da Obra
exports.listarPorObra = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];

  if (!id_obra) {
    return res.status(400).send("O identificador da obra (id_obra) é obrigatório.");
  }

  ProjecaoFinanceira.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar projeções financeiras.");
    res.json(results);
  });
};

// Busca detalhes de uma projeção por ID
exports.buscarPorId = (req, res) => {
  ProjecaoFinanceira.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar projeção financeira.");
    if (results.length === 0) return res.status(404).send("Registo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registo de projeção financeira
exports.deletar = (req, res) => {
  ProjecaoFinanceira.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar projeção financeira.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Projeção financeira removida com sucesso!");
  });
};

// Regista uma nova projeção financeira
exports.criar = (req, res) => {
  ProjecaoFinanceira.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao registar projeção financeira.");
    res.status(201).json({
      message: "Projeção financeira registada com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza uma projeção financeira existente
exports.atualizar = (req, res) => {
  ProjecaoFinanceira.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar projeção financeira.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Projeção financeira atualizada com sucesso!");
  });
};