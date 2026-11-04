const EquipeTerceirizada = require("../models/equipeTerceirizadaModel");
const { dbStatus, safeDbMessage } = require("../utils/dbError");

exports.criar = (req, res) => {
  EquipeTerceirizada.create(req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) || err });
    
    res.status(201).json({
      message: "Equipe terceirizada registrada com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodas = (req, res) => {
  EquipeTerceirizada.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.listarPorObra = (req, res) => {
  const id_obra = req.params.idObra || req.query.id_obra;
  
  if (!id_obra) {
    return EquipeTerceirizada.getAll((err, results) => {
      if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
      res.json(results);
    });
  }

  EquipeTerceirizada.getByObra(id_obra, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  EquipeTerceirizada.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  EquipeTerceirizada.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json({ message: "Equipe terceirizada removida com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  EquipeTerceirizada.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Equipe terceirizada não encontrada." });
    }
    res.json({ message: "Equipe terceirizada atualizada com sucesso!" });
  });
};

exports.criar=require('../utils/equipesDisponibilidade').legacyController(exports.criar,'terceirizada','create');
exports.atualizar=require('../utils/equipesDisponibilidade').legacyController(exports.atualizar,'terceirizada','update');

exports.deletar=require('../utils/equipesDisponibilidade').legacyController(exports.deletar,'terceirizada','delete');
