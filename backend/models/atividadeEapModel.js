const bd = require("../config/connection");

const AtividadeEap = {
  // Lista todas as atividades ligadas a uma obra específica
  getByObra: (idx_obra, callback) => {
    const select = "SELECT * FROM atividade_eap WHERE idx_obra = ?";
    bd.query(select, [idx_obra], callback);
  },

  // Busca uma atividade específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM atividade_eap WHERE id_atividade = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de atividade EAP
  delete: (id, callback) => {
    const del = "DELETE FROM atividade_eap WHERE id_atividade = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova atividade EAP
  create: (data, callback) => {
    const insert = `
      INSERT INTO atividade_eap 
      (descricao, idx_obra) 
      VALUES (?, ?)
    `;
    bd.query(
      insert, 
      [
        data.descricao, 
        data.idx_obra
      ], 
      callback
    );
  },

  // Atualiza os dados de uma atividade existente
  update: (id, data, callback) => {
    const update = `
      UPDATE atividade_eap SET 
        descricao = ?, 
        idx_obra = ? 
      WHERE id_atividade = ?
    `;
    bd.query(
      update, 
      [
        data.descricao, 
        data.idx_obra, 
        id
      ], 
      callback
    );
  }
};

module.exports = AtividadeEap;