const bd = require("../config/connection");

const Paralisacao = {
  // Lista todas as paralisações vinculadas a um RDO
  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM paralisacao WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de uma paralisação por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM paralisacao WHERE id_paralisacao = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registo de paralisação
  delete: (id, callback) => {
    const del = "DELETE FROM paralisacao WHERE id_paralisacao = ?";
    bd.query(del, [id], callback);
  },

  // Regista uma nova paralisação
  create: (data, callback) => {
    const insert = `
      INSERT INTO paralisacao 
      (id_rdo, etapa, origem_paralisacao, duracao, descricao) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_rdo, 
        data.etapa, 
        data.origem_paralisacao, 
        data.duracao, 
        data.descricao
      ], 
      callback
    );
  },

  // Atualiza uma paralisação existente
  update: (id, data, callback) => {
    const update = `
      UPDATE paralisacao SET 
        id_rdo = ?, 
        etapa = ?, 
        origem_paralisacao = ?, 
        duracao = ?, 
        descricao = ? 
      WHERE id_paralisacao = ?
    `;
    bd.query(
      update, 
      [
        data.id_rdo, 
        data.etapa, 
        data.origem_paralisacao, 
        data.duracao, 
        data.descricao, 
        id
      ], 
      callback
    );
  }
};

module.exports = Paralisacao;