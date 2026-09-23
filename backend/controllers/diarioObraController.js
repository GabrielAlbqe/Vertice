const DiarioObra = require("../models/diarioObraModel");

// Lista os diários filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const obrax_id = req.query.obrax_id || req.headers["obrax-id"];

  if (!obrax_id) {
    return res.status(400).send("O identificador da obra (obrax_id) é obrigatório.");
  }

  DiarioObra.getByObra(obrax_id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar diários de obra.");
    res.json(results);
  });
};

// Busca detalhes de um diário específico por ID
exports.buscarPorId = (req, res) => {
  DiarioObra.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar diário de obra.");
    if (!results || results.length === 0) return res.status(404).send("Diário de obra não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de diário de obra do sistema
exports.deletar = (req, res) => {
  DiarioObra.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar diário de obra.");
    if (result.affectedRows === 0) return res.status(404).send("Diário de obra não encontrado.");
    res.send("Diário de obra removido com sucesso!");
  });
};

// Registra um novo diário de obra
exports.criar = (req, res) => {
  DiarioObra.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar diário de obra.");
    
    res.status(201).json({
      message: "Diário de obra registrado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de um diário de obra existente
exports.atualizar = (req, res) => {
  DiarioObra.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar diário de obra.");
    if (result.affectedRows === 0) return res.status(404).send("Diário de obra não encontrado.");
    res.send("Diário de obra atualizado com sucesso!");
  });
};