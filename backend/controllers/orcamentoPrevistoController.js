const OrcamentoPrevisto = require("../models/orcamentoPrevistoModel");

// Lista os orçamentos previstos filtrando pelo ID da atividade EAP
exports.listarPorAtividadeEap = (req, res) => {
  const id_atividade_eap = req.query.id_atividade_eap || req.headers["id-atividade-eap"];

  if (!id_atividade_eap) {
    return res.status(400).send("O identificador da atividade EAP (id_atividade_eap) é obrigatório.");
  }

  OrcamentoPrevisto.getByAtividadeEap(id_atividade_eap, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar orçamento previsto.");
    res.json(results);
  });
};

// Busca detalhes de um orçamento previsto por ID
exports.buscarPorId = (req, res) => {
  OrcamentoPrevisto.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar orçamento previsto.");
    if (results.length === 0) return res.status(404).send("Orçamento previsto não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de orçamento previsto
exports.deletar = (req, res) => {
  OrcamentoPrevisto.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar orçamento previsto.");
    if (result.affectedRows === 0) return res.status(404).send("Orçamento previsto não encontrado.");
    res.send("Orçamento previsto removido com sucesso!");
  });
};

// Registra um novo orçamento previsto
exports.criar = (req, res) => {
  // req.body deve conter: id_orcamento, valor_planejado, id_atividade_eap
  OrcamentoPrevisto.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar orçamento previsto.");
    res.status(201).send("Orçamento previsto registrado com sucesso!");
  });
};

// Atualiza os dados de um orçamento previsto existente
exports.atualizar = (req, res) => {
  OrcamentoPrevisto.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar orçamento previsto.");
    if (result.affectedRows === 0) return res.status(404).send("Orçamento previsto não encontrado.");
    res.send("Orçamento previsto atualizado com sucesso!");
  });
};