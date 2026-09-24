const CustoRealizado = require("../models/custoRealizadoModel");

// Lista os custos filtrando por ID da Obra ou ID do RDO
exports.listar = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (id_rdo) {
    CustoRealizado.getByRdo(id_rdo, (err, results) => {
      if (err) return res.status(500).send("Erro interno no servidor ao listar custos do RDO.");
      return res.json(results);
    });
  } else if (id_obra) {
    CustoRealizado.getByObra(id_obra, (err, results) => {
      if (err) return res.status(500).send("Erro interno no servidor ao listar custos da obra.");
      return res.json(results);
    });
  } else {
    return res.status(400).send("Informe 'id_obra' ou 'id_rdo' para consultar os custos.");
  }
};

// Busca detalhes de um custo por ID
exports.buscarPorId = (req, res) => {
  CustoRealizado.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar custo realizado.");
    if (results.length === 0) return res.status(404).send("Registo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registo de custo realizado
exports.deletar = (req, res) => {
  CustoRealizado.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar custo realizado.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Custo realizado removido com sucesso!");
  });
};

// Regista um novo custo realizado
exports.criar = (req, res) => {
  CustoRealizado.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao registar custo realizado.");
    res.status(201).json({
      message: "Custo realizado registado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza um custo realizado existente
exports.atualizar = (req, res) => {
  CustoRealizado.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar custo realizado.");
    if (result.affectedRows === 0) return res.status(404).send("Registo não encontrado.");
    res.send("Custo realizado atualizado com sucesso!");
  });
};