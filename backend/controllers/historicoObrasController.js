const HistoricoObras = require("../models/historicoObrasModel");

// Lista o histórico filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];

  if (!id_obra) {
    return res.status(400).send("O identificador da obra (id_obra) é obrigatório.");
  }

  HistoricoObras.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar histórico da obra.");
    res.json(results);
  });
};

// Busca detalhes de um registro de histórico por ID
exports.buscarPorId = (req, res) => {
  HistoricoObras.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar histórico.");
    if (results.length === 0) return res.status(404).send("Histórico não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro do histórico
exports.deletar = (req, res) => {
  HistoricoObras.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar histórico.");
    if (result.affectedRows === 0) return res.status(404).send("Histórico não encontrado.");
    res.send("Histórico removido com sucesso!");
  });
};

// Registra um novo histórico
exports.criar = (req, res) => {
  // req.body deve conter: usuario_id, id_obra, status, data_atribuicao (opcional), data_fim (opcional)
  HistoricoObras.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar histórico.");
    res.status(201).send("Histórico registrado com sucesso!");
  });
};

// Atualiza um registro de histórico
exports.atualizar = (req, res) => {
  HistoricoObras.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar histórico.");
    if (result.affectedRows === 0) return res.status(404).send("Histórico não encontrado.");
    res.send("Histórico atualizado com sucesso!");
  });
};