const RdoEquipe = require("../models/rdoEquipeModel");

// Lista os registros de equipes filtrando pelo ID do RDO
exports.listarPorRdo = (req, res) => {
  const id_rdo = req.query.id_rdo || req.headers["id-rdo"];

  if (!id_rdo) {
    return res.status(400).send("O identificador do RDO (id_rdo) é obrigatório.");
  }

  RdoEquipe.getByRdo(id_rdo, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar equipes do RDO.");
    res.json(results);
  });
};

// Busca detalhes de um registro específico de RDO Equipe por ID
exports.buscarPorId = (req, res) => {
  RdoEquipe.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar equipe do RDO.");
    if (results.length === 0) return res.status(404).send("Registro não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de equipe do RDO
exports.deletar = (req, res) => {
  RdoEquipe.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar equipe do RDO.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Equipe removida do RDO com sucesso!");
  });
};

// Registra uma nova equipe no RDO
exports.criar = (req, res) => {
  // req.body deve conter: id_rdo, id_equipe, etapa, dias_atuacao
  RdoEquipe.create(req.body, (err) => {
    if (err) return res.status(500).send("Erro interno no servidor ao vincular equipe ao RDO.");
    res.status(201).send("Equipe vinculada ao RDO com sucesso!");
  });
};

// Atualiza os dados de um registro existente de RDO Equipe
exports.atualizar = (req, res) => {
  RdoEquipe.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar equipe do RDO.");
    if (result.affectedRows === 0) return res.status(404).send("Registro não encontrado.");
    res.send("Equipe do RDO atualizada com sucesso!");
  });
};