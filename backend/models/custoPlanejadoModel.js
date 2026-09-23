const bd = require("../config/connection");

const CustoPlanejado = {
  // Lista todos os custos planejados
  getAll: (callback) => {
    const select = "SELECT * FROM custo_planejado";
    bd.query(select, callback);
  },

  // Lista os custos planejados vinculados a uma obra específica
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM custo_planejado WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca um custo planejado por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM custo_planejado WHERE id_custo_planejado = ?";
    bd.query(select, [id], callback);
  },

  // Remove um custo planejado
  delete: (id, callback) => {
    const del = "DELETE FROM custo_planejado WHERE id_custo_planejado = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo custo planejado
  create: (data, callback) => {
    const insert = `
      INSERT INTO custo_planejado 
      (id_obra, etapa, origem_custo, valor_planejado, data_inicio_prevista, data_fim_prevista) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_obra, 
        data.etapa, 
        data.origem_custo, 
        data.valor_planejado, 
        data.data_inicio_prevista, 
        data.data_fim_prevista
      ], 
      callback
    );
  },

  // Atualiza um custo planejado existente
  update: (id, data, callback) => {
    const update = `
      UPDATE custo_planejado SET 
        id_obra = ?, 
        etapa = ?, 
        origem_custo = ?, 
        valor_planejado = ?, 
        data_inicio_prevista = ?, 
        data_fim_prevista = ? 
      WHERE id_custo_planejado = ?
    `;
    bd.query(
      update, 
      [
        data.id_obra, 
        data.etapa, 
        data.origem_custo, 
        data.valor_planejado, 
        data.data_inicio_prevista, 
        data.data_fim_prevista, 
        id
      ], 
      callback
    );
  }
};

module.exports = CustoPlanejado;