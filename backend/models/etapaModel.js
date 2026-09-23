const bd = require("../config/connection");

const Etapa = {
  // Lista todas as etapas
  getAll: (callback) => {
    const select = "SELECT * FROM etapa";
    bd.query(select, callback);
  },

  // Lista todas as etapas vinculadas a uma obra específica
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM etapa WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca uma etapa específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM etapa WHERE id_etapa = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de etapa
  delete: (id, callback) => {
    const del = "DELETE FROM etapa WHERE id_etapa = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova etapa
  create: (data, callback) => {
    const insert = `
      INSERT INTO etapa 
      (id_obra, nome_etapa, descricao) 
      VALUES (?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_obra, 
        data.nome_etapa, 
        data.descricao || null
      ], 
      callback
    );
  },

  // Atualiza os dados de uma etapa existente
  update: (id, data, callback) => {
    const update = `
      UPDATE etapa SET 
        id_obra = ?, 
        nome_etapa = ?, 
        descricao = ? 
      WHERE id_etapa = ?
    `;
    bd.query(
      update, 
      [
        data.id_obra, 
        data.nome_etapa, 
        data.descricao, 
        id
      ], 
      callback
    );
  }
};

module.exports = Etapa;