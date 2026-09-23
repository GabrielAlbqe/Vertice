const bd = require("../config/connection");

const HistoricoObras = {
  // Lista o histórico filtrado por obra
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM historico_obras WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca um histórico específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM historico_obras WHERE id_historico = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de histórico
  delete: (id, callback) => {
    const del = "DELETE FROM historico_obras WHERE id_historico = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo registro no histórico
  create: (data, callback) => {
    const insert = `
      INSERT INTO historico_obras 
      (usuario_id, id_obra, status, data_atribuicao, data_fim) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.usuario_id, 
        data.id_obra, 
        data.status, 
        data.data_atribuicao || new Date(), 
        data.data_fim || null
      ], 
      callback
    );
  },

  // Atualiza um registro de histórico existente
  update: (id, data, callback) => {
    const update = `
      UPDATE historico_obras SET 
        usuario_id = ?, 
        id_obra = ?, 
        status = ?, 
        data_atribuicao = ?, 
        data_fim = ? 
      WHERE id_historico = ?
    `;
    bd.query(
      update, 
      [
        data.usuario_id, 
        data.id_obra, 
        data.status, 
        data.data_atribuicao, 
        data.data_fim || null, 
        id
      ], 
      callback
    );
  }
};

module.exports = HistoricoObras;