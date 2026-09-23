const Usuario = require("../models/usuarioModel");

exports.criar = (req, res) => {
  Usuario.create(req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message || err });
    
    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodos = (req, res) => {
  Usuario.getAll((err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.listarPorConstrutora = (req, res) => {
  const idconstrutora = req.query.idconstrutora || req.params.idconstrutora;

  if (!idconstrutora) {
    return Usuario.getAll((err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json(results);
    });
  }

  Usuario.getByConstrutora(idconstrutora, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Usuario.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Usuario.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json({ message: "Usuário removido com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  Usuario.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json({ message: "Usuário atualizado com sucesso!" });
  });
};

// Método de Login
exports.login = (req, res) => {
  const { email, senha } = req.body;

  if (!email || !senha) {
    return res.status(400).json({ message: "Email e senha são obrigatórios." });
  }

  Usuario.buscarUsuarioPorEmailESenha(email, senha, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    
    if (!results || results.length === 0) {
      return res.status(401).json({ message: "Credenciais inválidas ou usuário inativo." });
    }

    res.json({
      message: "Login realizado com sucesso!",
      usuario: results[0]
    });
  });
};