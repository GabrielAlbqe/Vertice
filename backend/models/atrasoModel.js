const bd = require("../config/connection");

const Atraso = {
  // Lista todos os atrasos vinculados a um RDO
  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM atraso WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de um atraso por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM atraso WHERE id_atraso = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registo de atraso
  delete: (id, callback) => {
    const del = "DELETE FROM atraso WHERE id_atraso = ?";
    bd.query(del, [id], callback);
  },

  // Regista um novo atraso
  create: (data, callback) => {
    const insert = `
      INSERT INTO atraso 
      (id_rdo, etapa, origem_atraso, duracao, descricao) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_rdo, 
        data.etapa, 
        data.origem_atraso, 
        data.duracao, 
        data.descricao
      ], 
      callback
    );
  },

  // Atualiza um atraso existente
  update: (id, data, callback) => {
    const update = `
      UPDATE atraso SET 
        id_rdo = ?, 
        etapa = ?, 
        origem_atraso = ?, 
        duracao = ?, 
        descricao = ? 
      WHERE id_atraso = ?
    `;
    bd.query(
      update, 
      [
        data.id_rdo, 
        data.etapa, 
        data.origem_atraso, 
        data.duracao, 
        data.descricao, 
        id
      ], 
      callback
    );
  }
};

module.exports = Atraso;