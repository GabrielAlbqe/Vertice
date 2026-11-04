const Equipe = require("../models/equipeModel");
const { dbStatus, safeDbMessage } = require("../utils/dbError");

exports.criar = (req, res) => {

  Equipe.create(req.body, (err, result) => {
    if (err) {
      console.error("❌ ERRO NO BANCO AO INSERIR EQUIPE:", { code: err.code });
      return res.status(dbStatus(err)).json({ error: safeDbMessage(err) || err });
    }
    
    res.status(201).json({
      message: "Equipe registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  Equipe.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

// Adicionada a função exigida pelas rotas
exports.listarPorObra = (req, res) => {
  const id = req.query.idobra;
  const consultar = id ? callback => Equipe.getByObra(id, callback) : Equipe.getAll;
  consultar((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Equipe.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (!results || results.length === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Equipe.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json({ message: "Equipe removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  Equipe.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Equipe não encontrada." });
    res.json({ message: "Equipe atualizada com sucesso!" });
  });
};

exports.criar=require('../utils/equipesDisponibilidade').legacyController(exports.criar,'propria','create');
exports.atualizar=require('../utils/equipesDisponibilidade').legacyController(exports.atualizar,'propria','update');

exports.deletar=require('../utils/equipesDisponibilidade').legacyController(exports.deletar,'propria','delete');
