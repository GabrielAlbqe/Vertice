const ConsumoInsumo = require("../models/consumoInsumoModel");

// Lista os consumos filtrando pelo ID do RDO
exports.listarPorRdo = (req, res) => {
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (!id_rdo) {
    return res.status(400).send("O identificador do RDO (id_rdo) é obrigatório.");
  }

  ConsumoInsumo.getByRdo(id_rdo, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar consumos de insumos.");
    res.json(results);
  });
};

// Busca detalhes de um consumo por ID
exports.buscarPorId = (req, res) => {
  ConsumoInsumo.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar consumo de insumo.");
    if (results.length === 0) return res.status(404).send("Registro não encontrado.");
    res.json(results[0]);
  });
};

// Remove um consumo de insumo
exports.deletar = (req, res) => {
  ConsumoInsumo.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar consumo de insumo.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Consumo de insumo removido com sucesso!");
  });
};

// Registra um novo consumo de insumo
exports.criar = (req, res) => {
  // req.body deve conter: id_rdo, id_insumo, etapa, quantidade_consumida, custo_unitario, custo_total
  ConsumoInsumo.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao registrar consumo de insumo.");
    res.status(201).json({
      message: "Consumo de insumo registrado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza um consumo de insumo
exports.atualizar = (req, res) => {
  ConsumoInsumo.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar consumo de insumo.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Consumo de insumo atualizado com sucesso!");
  });
};