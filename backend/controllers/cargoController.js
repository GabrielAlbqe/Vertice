const Cargo = require("../models/cargoModel");
const { dbStatus } = require("../utils/dbError");

// Lista todos os cargos
exports.listarTodos = (req, res) => {
  Cargo.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao listar cargos");
    res.json(results);
  });
};

// Busca detalhes de um cargo específico pelo ID
exports.buscarPorId = (req, res) => {
  Cargo.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).send("Erro interno no servidor ao buscar cargo");
    if (results.length === 0) return res.status(404).send("Cargo não encontrado");
    res.json(results[0]);
  });
};

// Deleta um cargo cadastrado
exports.deletar = (req, res) => {
  Cargo.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro ao remover cargo");
    if (result.affectedRows === 0) return res.status(404).send("Cargo não encontrado");
    res.send("Cargo removido com sucesso!");
  });
};

// Cria um novo cargo
exports.criar = (req, res) => {
  // req.body deve conter: nome_cargo, descricao
  Cargo.create(req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro ao cadastrar cargo");
    res.status(201).json({ message: "Cargo cadastrado com sucesso!", insertId: result.insertId });
  });
};

// Atualiza dados de um cargo existente
exports.atualizar = (req, res) => {
  Cargo.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).send("Erro ao atualizar cargo");
    if (result.affectedRows === 0) return res.status(404).send("Cargo não encontrado");
    res.send("Cargo atualizado com sucesso!");
  });
};
