const AtividadeEap = require("../models/atividadeEapModel");

// Lista as atividades filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const idx_obra = req.query.idx_obra || req.headers["idx-obra"];

  if (!idx_obra) {
    return res.status(400).send("O identificador da obra (idx_obra) é obrigatório.");
  }

  AtividadeEap.getByObra(idx_obra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar atividades da EAP.");
    res.json(results);
  });
};

// Busca detalhes de uma atividade específica por ID
exports.buscarPorId = (req, res) => {
  AtividadeEap.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar atividade da EAP.");
    if (results.length === 0) return res.status(404).send("Atividade não encontrada.");
    res.json(results[0]);
  });
};

// Remove um registro de atividade do sistema
exports.deletar = (req, res) => {
  AtividadeEap.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar atividade da EAP.");
    if (result.affectedRows === 0) return res.status(404).send("Atividade não encontrada.");
    res.send("Atividade da EAP removida com sucesso!");
  });
};

// Registra uma nova atividade EAP
exports.criar = (req, res) => {
  AtividadeEap.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno ao cadastrar atividade EAP.");
    
    // Retorne o JSON com o id do registro cadastrado
    res.status(201).json({ insertId: result.insertId, message: "Atividade cadastrada com sucesso!" });
  });
};

// Atualiza os dados de uma atividade existente
exports.atualizar = (req, res) => {
  AtividadeEap.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar atividade da EAP.");
    if (result.affectedRows === 0) return res.status(404).send("Atividade não encontrada.");
    res.send("Atividade da EAP atualizada com sucesso!");
  });
};