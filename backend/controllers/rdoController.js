const Rdo = require("../models/rdoModel");

// Lista os RDOs filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];

  if (!id_obra) {
    return res.status(400).send("O identificador da obra (id_obra) é obrigatório.");
  }

  Rdo.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar RDOs.");
    res.json(results);
  });
};

// Busca detalhes de um RDO específico por ID
exports.buscarPorId = (req, res) => {
  Rdo.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar RDO.");
    if (results.length === 0) return res.status(404).send("RDO não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de RDO do sistema
exports.deletar = (req, res) => {
  Rdo.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar RDO.");
    if (result.affectedRows === 0) return res.status(404).send("RDO não encontrado.");
    res.send("RDO removido com sucesso!");
  });
};

// Registra um novo RDO
exports.criar = (req, res) => {
  // req.body deve conter: id_obra, data_rdo, turno, clima
  Rdo.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar RDO.");
    res.status(201).send("RDO registrado com sucesso!");
  });
};

// Atualiza os dados de um RDO existente
exports.atualizar = (req, res) => {
  Rdo.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar RDO.");
    if (result.affectedRows === 0) return res.status(404).send("RDO não encontrado.");
    res.send("RDO atualizado com sucesso!");
  });
};