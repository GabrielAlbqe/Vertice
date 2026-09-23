const MetricasEva = require("../models/metricaEvaModel");

// Lista as métricas EVA filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const obra_idxx = req.query.obra_idxx || req.headers["obra-idxx"];

  if (!obra_idxx) {
    return res.status(400).send("O identificador da obra (obra_idxx) é obrigatório.");
  }

  MetricasEva.getByObra(obra_idxx, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar métricas EVA.");
    res.json(results);
  });
};

// Busca detalhes de uma métrica EVA específica por ID
exports.buscarPorId = (req, res) => {
  MetricasEva.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar métrica EVA.");
    if (results.length === 0) return res.status(404).send("Métrica EVA não encontrada.");
    res.json(results[0]);
  });
};

// Remove um registro de métrica EVA do sistema
exports.deletar = (req, res) => {
  MetricasEva.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar métrica EVA.");
    if (result.affectedRows === 0) return res.status(404).send("Métrica EVA não encontrada.");
    res.send("Métrica EVA removida com sucesso!");
  });
};

// Registra uma nova métrica EVA
exports.criar = (req, res) => {
  // req.body deve conter: data_calculo, idc, idp, eac, obra_idxx
  MetricasEva.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar métrica EVA.");
    res.status(201).send("Métrica EVA registrada com sucesso!");
  });
};

// Atualiza os dados de uma métrica EVA existente
exports.atualizar = (req, res) => {
  MetricasEva.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar métrica EVA.");
    if (result.affectedRows === 0) return res.status(404).send("Métrica EVA não encontrada.");
    res.send("Métrica EVA atualizada com sucesso!");
  });
};