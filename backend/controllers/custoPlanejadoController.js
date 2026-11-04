const CustoPlanejado = require("../models/custoPlanejadoModel");
const { dbStatus, safeDbMessage } = require("../utils/dbError");

exports.criar = (req, res) => {
  CustoPlanejado.create(req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) || err });
    
    res.status(201).json({
      message: "Custo planejado registrado com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodos = (req, res) => {
  CustoPlanejado.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.listarPorObra = (req, res) => {
  const id_obra = req.params.idObra || req.query.id_obra;
  
  if (!id_obra) {
    return CustoPlanejado.getAll((err, results) => {
      if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
      res.json(results);
    });
  }

  CustoPlanejado.getByObra(id_obra, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  CustoPlanejado.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (!results || results.length === 0) {
      return res.status(404).json({ message: "Custo planejado não encontrado." });
    }
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  CustoPlanejado.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Custo planejado não encontrado." });
    }
    res.json({ message: "Custo planejado removido com sucesso!" });
  });
};

exports.atualizar = (req, res) => {
  CustoPlanejado.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: safeDbMessage(err) });
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Custo planejado não encontrado." });
    }
    res.json({ message: "Custo planejado atualizado com sucesso!" });
  });
};
