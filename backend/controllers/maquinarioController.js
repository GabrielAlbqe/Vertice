const Maquinario = require("../models/maquinarioModel");

// Lista os maquinários filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const idobra = req.query.idobra || req.headers["idobra"];

  if (!idobra) {
    return res.status(400).send("O identificador da obra (idobra) é obrigatório.");
  }

  Maquinario.getByObra(idobra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar maquinários.");
    res.json(results);
  });
};

// Busca detalhes de um maquinário específico por ID
exports.buscarPorId = (req, res) => {
  Maquinario.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar maquinário.");
    if (results.length === 0) return res.status(404).send("Maquinário não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de maquinário do sistema
exports.deletar = (req, res) => {
  Maquinario.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar maquinário.");
    if (result.affectedRows === 0) return res.status(404).send("Maquinário não encontrado.");
    res.send("Maquinário removido com sucesso!");
  });
};

// Registra um novo maquinário
exports.criar = (req, res) => {
  // req.body deve conter: nome, quantidade, etapa_atuacao, custo_diario, status, idobra
  Maquinario.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar maquinário.");
    res.status(201).send("Maquinário registrado com sucesso!");
  });
};

// Atualiza os dados de um maquinário existente
exports.atualizar = (req, res) => {
  Maquinario.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar maquinário.");
    if (result.affectedRows === 0) return res.status(404).send("Maquinário não encontrado.");
    res.send("Maquinário atualizado com sucesso!");
  });
};