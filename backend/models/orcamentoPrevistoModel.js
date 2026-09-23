const bd = require("../config/connection");

const OrcamentoPrevisto = {
  // Lista todos os orçamentos previstos vinculados a uma atividade de EAP
  getByAtividadeEap: (id_atividade_eap, callback) => {
    const select = "SELECT * FROM orcamento_previsto WHERE id_atividade_eap = ?";
    bd.query(select, [id_atividade_eap], callback);
  },

  // Busca um orçamento previsto específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM orcamento_previsto WHERE id_orcamento = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de orçamento previsto
  delete: (id, callback) => {
    const del = "DELETE FROM orcamento_previsto WHERE id_orcamento = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo orçamento previsto
  create: (data, callback) => {
    const insert = `
      INSERT INTO orcamento_previsto 
      (id_orcamento, valor_planejado, id_atividade_eap) 
      VALUES (?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_orcamento, 
        data.valor_planejado, 
        data.id_atividade_eap
      ], 
      callback
    );
  },

  // Atualiza os dados de um orçamento previsto existente
  update: (id, data, callback) => {
    const update = `
      UPDATE orcamento_previsto SET 
        valor_planejado = ?, 
        id_atividade_eap = ? 
      WHERE id_orcamento = ?
    `;
    bd.query(
      update, 
      [
        data.valor_planejado, 
        data.id_atividade_eap, 
        id
      ], 
      callback
    );
  }
};

module.exports = OrcamentoPrevisto;