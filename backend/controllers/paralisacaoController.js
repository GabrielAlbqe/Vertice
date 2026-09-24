const Paralisacao = require("../models/paralisacaoModel");

// Lista as paralisações filtrando pelo ID do RDO
exports.listarPorRdo = (req, res) => {
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (!id_rdo) {
    return res.status(400).send("O identificador do RDO (id_rdo) é obrigatório.");
  }

  Paralisacao.getByRdo(id_rdo, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar paralisações.");
    res.json(results);
  });
};

// Busca detalhes de uma paralisação por ID
exports.buscarPorId = (req, res) => {
  Paralisacao.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar paralisação.");
    if (results.length === 0) return res.status(404).send("Registo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registo de paralisação
exports.deletar = (req, res) => {
  Paralisacao.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar paralisação.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Paralisação removida com sucesso!");
  });
};

// Regista uma nova paralisação
exports.criar = (req, res) => {
  // req.body deve conter: id_rdo, etapa, origem_paralisacao, duracao, descricao
  Paralisacao.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao registar paralisação.");
    res.status(201).json({
      message: "Paralisação registada com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de uma paralisação existente
exports.atualizar = (req, res) => {
  Paralisacao.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar paralisação.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Paralisação atualizada com sucesso!");
  });
};