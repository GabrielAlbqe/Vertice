const RdoMaquinario = require("../models/rdoMaquinarioModel");

// Lista os registros filtrando pelo ID do RDO
exports.listarPorRdo = (req, res) => {
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (!id_rdo) {
    return res.status(400).send("O identificador do RDO (id_rdo) é obrigatório.");
  }

  RdoMaquinario.getByRdo(id_rdo, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar maquinários do RDO.");
    res.json(results);
  });
};

// Busca detalhes de um registro por ID
exports.buscarPorId = (req, res) => {
  RdoMaquinario.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar maquinário do RDO.");
    if (results.length === 0) return res.status(404).send("Registro não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de maquinário do RDO
exports.deletar = (req, res) => {
  RdoMaquinario.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar maquinário do RDO.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Maquinário removido do RDO com sucesso!");
  });
};

// Registra um novo maquinário no RDO
exports.criar = (req, res) => {
  // req.body deve conter: id_rdo, id_maquinario, etapa, quantidade_utilizada, tempo_utilizacao
  RdoMaquinario.create(req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao vincular maquinário ao RDO.");
    res.status(201).json({
      message: "Maquinário vinculado ao RDO com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de um registro existente
exports.atualizar = (req, res) => {
  RdoMaquinario.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar maquinário do RDO.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Maquinário do RDO atualizado com sucesso!");
  });
};