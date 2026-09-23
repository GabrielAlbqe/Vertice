const Insumos = require("../models/insumosModel");

// Lista os insumos filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const idobra = req.query.idobra || req.headers["idobra"];

  if (!idobra) {
    return res.status(400).send("O identificador da obra (idobra) é obrigatório.");
  }

  Insumos.getByObra(idobra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar insumos.");
    res.json(results);
  });
};

// Busca detalhes de um insumo específico por ID
exports.buscarPorId = (req, res) => {
  Insumos.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar insumo.");
    if (results.length === 0) return res.status(404).send("Insumo não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de insumo do sistema
exports.deletar = (req, res) => {
  Insumos.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar insumo.");
    if (result.affectedRows === 0) return res.status(404).send("Insumo não encontrado.");
    res.send("Insumo removido com sucesso!");
  });
};

// Registra um novo insumo
exports.criar = (req, res) => {
  Insumo.create(req.body, (err, result) => {
    if (err) {
      return res.status(500).json({ message: "Erro ao cadastrar insumo.", error: err.message });
    }
    
    // Devolve o ID criado em formato JSON
    res.status(201).json({ insertId: result.insertId, message: "Insumo cadastrado com sucesso!" });
  });
};

// Atualiza os dados de um insumo existente
exports.atualizar = (req, res) => {
  Insumos.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar insumo.");
    if (result.affectedRows === 0) return res.status(404).send("Insumo não encontrado.");
    res.send("Insumo atualizado com sucesso!");
  });
};