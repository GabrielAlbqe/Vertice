const Cargo = require("../models/cargoModel");

// Lista todos os cargos
exports.listarTodos = (req, res) => {
  Cargo.getAll((err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar cargos");
    res.json(results);
  });
};

// Busca detalhes de um cargo específico pelo ID
exports.buscarPorId = (req, res) => {
  Cargo.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar cargo");
    if (results.length === 0) return res.status(404).send("Cargo não encontrado");
    res.json(results[0]);
  });
};

// Deleta um cargo cadastrado
exports.deletar = (req, res) => {
  Cargo.delete(req.params.id, (err) => {
    if (err) {
      // O MySQL impedirá a exclusão caso o id_cargo esteja em uso na tabela de usuários
      return res.status(400).send("Não é possível apagar um cargo que possui usuários vinculados");
    }
    res.send("Cargo removido com sucesso!");
  });
};

// Cria um novo cargo
exports.criar = (req, res) => {
  // req.body deve conter: nome_cargo, descricao
  Cargo.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao cadastrar cargo");
    res.status(201).send("Cargo cadastrado com sucesso!");
  });
};

// Atualiza dados de um cargo existente
exports.atualizar = (req, res) => {
  Cargo.update(req.params.id, req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar cargo");
    res.send("Cargo atualizado com sucesso!");
  });
};