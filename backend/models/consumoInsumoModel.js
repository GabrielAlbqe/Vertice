const bd = require("../config/connection");

const ConsumoInsumo = {
  // Lista todos os consumos de insumos de um RDO
  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM consumo_insumo WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de um consumo por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM consumo_insumo WHERE id_consumo = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de consumo de insumo
  delete: (id, callback) => {
    const del = "DELETE FROM consumo_insumo WHERE id_consumo = ?";
    bd.query(del, [id], callback);
  },

  // Registra um novo consumo de insumo
  create: (data, callback) => {
    const insert = `
      INSERT INTO consumo_insumo 
      (id_rdo, id_insumo, etapa, quantidade_consumida, custo_unitario, custo_total) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_rdo, 
        data.id_insumo, 
        data.etapa, 
        data.quantidade_consumida, 
        data.custo_unitario, 
        data.custo_total
      ], 
      callback
    );
  },

  // Atualiza um consumo de insumo existente
  update: (id, data, callback) => {
    const update = `
      UPDATE consumo_insumo SET 
        id_rdo = ?, 
        id_insumo = ?, 
        etapa = ?, 
        quantidade_consumida = ?, 
        custo_unitario = ?, 
        custo_total = ? 
      WHERE id_consumo = ?
    `;
    bd.query(
      update, 
      [
        data.id_rdo, 
        data.id_insumo, 
        data.etapa, 
        data.quantidade_consumida, 
        data.custo_unitario, 
        data.custo_total, 
        id
      ], 
      callback
    );
  }
};

module.exports = ConsumoInsumo;