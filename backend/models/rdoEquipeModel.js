const bd = require("../config/connection");

const RdoEquipe = {
  // Lista todas as equipes de um RDO específico
  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM rdo_equipe WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de um registro de RDO Equipe por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM rdo_equipe WHERE id_rdo_equipe = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de RDO Equipe
  delete: (id, callback) => {
    const del = "DELETE FROM rdo_equipe WHERE id_rdo_equipe = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo registro em RDO Equipe
  create: (data, callback) => {
    const insert = `
      INSERT INTO rdo_equipe 
      (id_rdo, id_equipe, etapa, dias_atuacao) 
      VALUES (?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_rdo, 
        data.id_equipe, 
        data.etapa, 
        data.dias_atuacao
      ], 
      callback
    );
  },

  // Atualiza os dados de um registro de RDO Equipe existente
  update: (id, data, callback) => {
    const update = `
      UPDATE rdo_equipe SET 
        id_rdo = ?, 
        id_equipe = ?, 
        etapa = ?, 
        dias_atuacao = ? 
      WHERE id_rdo_equipe = ?
    `;
    bd.query(
      update, 
      [
        data.id_rdo, 
        data.id_equipe, 
        data.etapa, 
        data.dias_atuacao, 
        id
      ], 
      callback
    );
  }
};

module.exports = RdoEquipe;