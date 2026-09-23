const bd = require("../config/connection");

const Insumos = {
  // Lista todos os insumos vinculados a uma obra específica
  getByObra: (idobra, callback) => {
    const select = "SELECT * FROM cadastro_de_insumos WHERE idobra = ?";
    bd.query(select, [idobra], callback);
  },

  // Busca um insumo específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM cadastro_de_insumos WHERE id_insumos = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de insumo
  delete: (id, callback) => {
    const del = "DELETE FROM cadastro_de_insumos WHERE id_insumos = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo insumo
  create: (data, callback) => {
    const insert = `
      INSERT INTO cadastro_de_insumos 
      (nome, quantidade_disponivel, valor_unitario, idobra) 
      VALUES (?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome, 
        data.quantidade_disponivel, 
        data.valor_unitario, 
        data.idobra
      ], 
      callback
    );
  },

  // Atualiza os dados de um insumo existente
  update: (id, data, callback) => {
    const update = `
      UPDATE cadastro_de_insumos SET 
        nome = ?, 
        quantidade_disponivel = ?, 
        valor_unitario = ?, 
        idobra = ? 
      WHERE id_insumos = ?
    `;
    bd.query(
      update, 
      [
        data.nome, 
        data.quantidade_disponivel, 
        data.valor_unitario, 
        data.idobra, 
        id
      ], 
      callback
    );
  }
};

module.exports = Insumos;