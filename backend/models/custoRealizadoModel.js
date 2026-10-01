const bd = require("../config/connection");

const CustoRealizado = {
  getByObra: (id_obra, callback) => {
    bd.query("SELECT * FROM custo_realizado WHERE id_obra = ?", [id_obra], callback);
  },
  getByRdo: (id_rdo, callback) => {
    bd.query("SELECT * FROM custo_realizado WHERE id_rdo = ?", [id_rdo], callback);
  },
  getById: (id, callback) => {
    bd.query("SELECT * FROM custo_realizado WHERE id_custo_realizado = ?", [id], callback);
  },
  delete: (id, callback) => {
    bd.query("DELETE FROM custo_realizado WHERE id_custo_realizado = ?", [id], callback);
  },
  create: (data, callback) => {
    const insert = `
      INSERT INTO custo_realizado
      (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(insert, [
      data.id_obra, data.id_etapa, data.id_rdo, data.origem_custo,
      data.id_origem, data.data, data.quantidade, data.custo_unitario
    ], callback);
  },
  update: (id, data, callback) => {
    const update = `
      UPDATE custo_realizado SET
        id_obra = ?, id_etapa = ?, id_rdo = ?, origem_custo = ?,
        id_origem = ?, data = ?, quantidade = ?, custo_unitario = ?
      WHERE id_custo_realizado = ?
    `;
    bd.query(update, [
      data.id_obra, data.id_etapa, data.id_rdo, data.origem_custo,
      data.id_origem, data.data, data.quantidade, data.custo_unitario, id
    ], callback);
  }
};

module.exports = CustoRealizado;
