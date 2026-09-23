const bd = require("../config/connection");

const Construtora = {
  // Lista todas as construtoras registradas
  getAll: (callback) => {
    const select = "SELECT * FROM construtora";
    bd.query(select, callback);
  },

  // Busca uma construtora específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM construtora WHERE id_construtora = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de construtora
  delete: (id, callback) => {
    const del = "DELETE FROM construtora WHERE id_construtora = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova construtora
  create: (data, callback) => {
    const insert = `
      INSERT INTO construtora 
      (cnpj, razao_social) 
      VALUES (?, ?)
    `;
    bd.query(
      insert, 
      [
        data.cnpj, 
        data.razao_social
      ], 
      callback
    );
  },

  // Atualiza os dados de uma construtora existente
  update: (id, data, callback) => {
    const update = `
      UPDATE construtora SET 
        cnpj = ?, 
        razao_social = ? 
      WHERE id_construtora = ?
    `;
    bd.query(
      update, 
      [
        data.cnpj, 
        data.razao_social, 
        id
      ], 
      callback
    );
  }
};

module.exports = Construtora;