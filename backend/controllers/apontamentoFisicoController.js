const ApontamentoFisico = require("../models/apontamentoFisicoModel");

// Lista os apontamentos filtrando pelo ID do diário de obra
exports.listarPorDiario = (req, res) => {
  const diario_id = req.query.diario_id || req.headers["diario-id"];

  if (!diario_id) {
    return res.status(400).json({ error: "O identificador do diário (diario_id) é obrigatório." });
  }

  ApontamentoFisico.getByDiario(diario_id, (err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao listar apontamentos." });
    res.json(results);
  });
};

// Busca detalhes de um apontamento específico por ID
exports.buscarPorId = (req, res) => {
  ApontamentoFisico.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao buscar apontamento." });
    if (!results || results.length === 0) return res.status(404).json({ error: "Apontamento não encontrado." });
    res.json(results[0]);
  });
};

// Remove um registro de apontamento do sistema
exports.deletar = (req, res) => {
  ApontamentoFisico.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao deletar apontamento." });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Apontamento não encontrado." });
    res.json({ message: "Apontamento físico removido com sucesso!" });
  });
};

// Registra a evolução física do dia
exports.criar = (req, res) => {
  const { percentual_dia, diario_id, atividade_eap_id } = req.body;

  // Validação preventiva dos campos obrigatórios
  if (percentual_dia === undefined || !diario_id || !atividade_eap_id) {
    return res.status(400).json({ 
      error: "Os campos percentual_dia, diario_id e atividade_eap_id são obrigatórios." 
    });
  }

  ApontamentoFisico.create(req.body, (err, result) => {
    if (err) {
      console.error("❌ ERRO NO BANCO AO INSERIR APONTAMENTO FISICO:", err);
      return res.status(500).json({ 
        error: err.message || "Erro interno no servidor ao cadastrar apontamento." 
      });
    }

    res.status(201).json({
      message: "Apontamento físico registrado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de evolução diária
exports.atualizar = (req, res) => {
  ApontamentoFisico.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).json({ error: "Erro interno no servidor ao atualizar apontamento." });
    if (result.affectedRows === 0) return res.status(404).json({ error: "Apontamento não encontrado." });
    res.json({ message: "Apontamento físico atualizado com sucesso!" });
  });
};