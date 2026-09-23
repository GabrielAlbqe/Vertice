const RegistroRelatorios = require("../models/registroRelatoriosModel");

// Lista os registros de relatórios filtrando pelo ID da obra
exports.listarPorObra = (req, res) => {
  const id_obra = req.query.id_obra || req.headers["id-obra"];

  if (!id_obra) {
    return res.status(400).send("O identificador da obra (id_obra) é obrigatório.");
  }

  RegistroRelatorios.getByObra(id_obra, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar registros de relatórios.");
    res.json(results);
  });
};

// Busca detalhes de um registro de relatório por ID
exports.buscarPorId = (req, res) => {
  RegistroRelatorios.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar registro de relatório.");
    if (!results || results.length === 0) return res.status(404).send("Registro de relatório não encontrado.");
    res.json(results[0]);
  });
};

// Remove um registro de relatório
exports.deletar = (req, res) => {
  RegistroRelatorios.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar registro de relatório.");
    if (result.affectedRows === 0) return res.status(404).send("Registro de relatório não encontrado.");
    res.send("Registro de relatório removido com sucesso!");
  });
};

// Registra um novo relatório
exports.criar = (req, res) => {
  console.log("PAYLOAD REGISTRO RELATORIOS RECEBIDO:", req.body);

  RegistroRelatorios.create(req.body, (err, result) => {
    if (err) {
      console.error("❌ ERRO NO BANCO AO INSERIR REGISTRO RELATORIO:", err);
      return res.status(500).json({ error: err.message || "Erro interno no servidor ao cadastrar registro de relatório." });
    }

    res.status(201).json({
      message: "Registro de relatório criado com sucesso!",
      insertId: result ? result.insertId : null
    });
  });
};

// Atualiza os dados de um registro de relatório existente
exports.atualizar = (req, res) => {
  RegistroRelatorios.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar registro de relatório.");
    if (result.affectedRows === 0) return res.status(404).send("Registro de relatório não encontrado.");
    res.send("Registro de relatório atualizado com sucesso!");
  });
};