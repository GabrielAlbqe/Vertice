const Atraso = require("../models/atrasoModel");

// Lista os atrasos filtrando pelo ID do RDO
exports.listarPorRdo = (req, res) => {
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (!id_rdo) {
    return res.status(400).send("O identificador do RDO (id_rdo) é obrigatório.");
  }

  Atraso.getByRdo(id_rdo, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar atrasos.");
    res.json(results);
  });
};

// Busca detalhes de um atraso por ID
exports.buscarPorId = (req, res) => {
  Atraso.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar atraso.");
    if (results.length === 0) return res.status(404).send("Registo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registo de atraso
exports.deletar = (req, res) => {
  Atraso.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar atraso.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Atraso removido com sucesso!");
  });
};

// Regista um novo atraso
exports.criar = (req, res) => {
  // req.body deve conter: id_rdo, etapa, origem_atraso, duracao, descricao
  Atraso.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao registar atraso.");
    res.status(201).json({
      message: "Atraso registado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de um atraso existente
exports.atualizar = (req, res) => {
  Atraso.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar atraso.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Atraso atualizado com sucesso!");
  });
};