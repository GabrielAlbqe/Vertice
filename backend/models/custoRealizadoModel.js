const bd = require("../config/connection");

const CustoRealizado = {
  // Lista custos realizados por obra ou por RDO
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM custo_realizado WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM custo_realizado WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de um custo realizado por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM custo_realizado WHERE id_custo_realizado = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registo de custo realizado
  delete: (id, callback) => {
    const del = "DELETE FROM custo_realizado WHERE id_custo_realizado = ?";
    bd.query(del, [id], callback);
  },

  // Regista um novo custo realizado
  create: (data, callback) => {
    const insert = `
      INSERT INTO custo_realizado 
      (id_obra, id_etapa, id_rdo, origem_custo, id_origem, data, quantidade, custo_unitario, valor_total) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_obra, 
        data.id_etapa, 
        data.id_rdo, 
        data.origem_custo, 
        data.id_origem, 
        data.data, 
        data.quantidade, 
        data.custo_unitario, 
        data.valor_total
      ], 
      callback
    );
  },

  // Atualiza um registo de custo realizado
  update: (id, data, callback) => {
    const update = `
      UPDATE custo_realizado SET 
        id_obra = ?, 
        id_etapa = ?, 
        id_rdo = ?, 
        origem_custo = ?, 
        id_origem = ?, 
        data = ?, 
        quantidade = ?, 
        custo_unitario = ?, 
        valor_total = ? 
      WHERE id_custo_realizado = ?
    `;
    bd.query(
      update, 
      [
        data.id_obra, 
        data.id_etapa, 
        data.id_rdo, 
        data.origem_custo, 
        data.id_origem, 
        data.data, 
        data.quantidade, 
        data.custo_unitario, 
        data.valor_total, 
        id
      ], 
      callback
    );
  }
};

module.exports = CustoRealizado;