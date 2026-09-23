const bd = require("../config/connection");

const Apropriacao = {
  // Lista todas as apropriações
  getAll: (callback) => {
    const select = "SELECT * FROM apropriacao";
    bd.query(select, callback);
  },

  // Busca uma apropriação específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM apropriacao WHERE id_apropriacao = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de apropriação
  delete: (id, callback) => {
    const del = "DELETE FROM apropriacao WHERE id_apropriacao = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova apropriação
  create: (data, callback) => {
    const insert = `
      INSERT INTO apropriacao 
      (quantidade_consumida, tipo_compra, id_insumo, id_atividade, id_usuario) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.quantidade_consumida, 
        data.tipo_compra, 
        data.id_insumo, 
        data.id_atividade, 
        data.id_usuario
      ], 
      callback
    );
  },

  // Atualiza as informações de uma apropriação existente
  update: (id, data, callback) => {
    const update = `
      UPDATE apropriacao SET 
        quantidade_consumida = ?, 
        tipo_compra = ?, 
        id_insumo = ?, 
        id_atividade = ?, 
        id_usuario = ? 
      WHERE id_apropriacao = ?
    `;
    bd.query(
      update, 
      [
        data.quantidade_consumida, 
        data.tipo_compra, 
        data.id_insumo, 
        data.id_atividade, 
        data.id_usuario, 
        id
      ], 
      callback
    );
  }
};

module.exports = Apropriacao;