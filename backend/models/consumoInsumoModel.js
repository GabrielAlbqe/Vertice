const bd = require("../config/connection");

const ConsumoInsumo = {
  getByRdo: (id_rdo, callback) => {
    bd.query("SELECT * FROM consumo_insumo WHERE id_rdo = ?", [id_rdo], callback);
  },
  getById: (id, callback) => {
    bd.query("SELECT * FROM consumo_insumo WHERE id_consumo = ?", [id], callback);
  },
  delete: (id, callback) => {
    bd.query("DELETE FROM consumo_insumo WHERE id_consumo = ?", [id], callback);
  },
  create: (data, callback) => {
    const insert = `
      INSERT INTO consumo_insumo
      (id_rdo, id_insumo, etapa, quantidade_consumida, custo_unitario)
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(insert, [
      data.id_rdo, data.id_insumo, data.etapa,
      data.quantidade_consumida, data.custo_unitario
    ], callback);
  },
  update: (id, data, callback) => {
    const update = `
      UPDATE consumo_insumo SET
        id_rdo = ?, id_insumo = ?, etapa = ?,
        quantidade_consumida = ?, custo_unitario = ?
      WHERE id_consumo = ?
    `;
    bd.query(update, [
      data.id_rdo, data.id_insumo, data.etapa,
      data.quantidade_consumida, data.custo_unitario, id
    ], callback);
  }
};

module.exports = ConsumoInsumo;
