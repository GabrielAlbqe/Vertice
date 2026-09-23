const Apropriacao = require("../models/apropriacaoModel");

// Lista todas as apropriações salvas
exports.listarTodas = (req, res) => {
  Apropriacao.getAll((err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao listar apropriações.");
    res.json(results);
  });
};

// Busca detalhes de uma apropriação específica por ID
exports.buscarPorId = (req, res) => {
  Apropriacao.getById(req.params.id, (err, results) => {
    if (err) return res.status(500).send("Erro interno no servidor ao buscar apropriação.");
    if (results.length === 0) return res.status(404).send("Apropriação não encontrada.");
    res.json(results[0]);
  });
};

// Remove um registro de apropriação do sistema
exports.deletar = (req, res) => {
  Apropriacao.delete(req.params.id, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao deletar apropriação.");
    if (result.affectedRows === 0) return res.status(404).send("Apropriação não encontrada.");
    res.send("Apropriação removida com sucesso!");
  });
};

// Registra uma nova apropriação
exports.criar = (req, res) => {
  // req.body deve conter: quantidade_consumida, tipo_compra, id_insumo, id_atividade, id_usuario
  Apropriacao.create(req.body, (err, result) => {
    if (err) {
      // Trata erro de Chave Estrangeira do MySQL (Chave/ID relacionada não encontrada)
      if (err.code === "ER_NO_REFERENCED_ROW" || err.code === "ER_NO_REFERENCED_ROW_2" || err.errno === 1452) {
        return res.status(404).json({ message: "Insumo, Atividade ou Usuário informado não existe no banco de dados." });
      }

      // Trata falta de campos obrigatórios
      if (err.code === "ER_BAD_NULL_ERROR") {
        return res.status(400).json({ message: "Preencha todos os campos obrigatórios." });
      }

      // Erros genéricos de servidor
      return res.status(500).send("Erro interno no servidor ao cadastrar apropriação.");
    }

    res.status(201).send("Apropriação registrada com sucesso!");
  });
};
// Atualiza os dados de uma apropriação existente
exports.atualizar = (req, res) => {
  Apropriacao.update(req.params.id, req.body, (err, result) => {
    if (err) return res.status(500).send("Erro interno no servidor ao atualizar apropriação.");
    if (result.affectedRows === 0) return res.status(404).send("Apropriação não encontrada.");
    res.send("Apropriação atualizada com sucesso!");
  });
};