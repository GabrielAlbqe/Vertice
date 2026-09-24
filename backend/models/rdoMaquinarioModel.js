const bd = require("../config/connection");

const RdoMaquinario = {
  // Lista todos os maquinários vinculados a um RDO
  getByRdo: (id_rdo, callback) => {
    const select = "SELECT * FROM rdo_maquinario WHERE id_rdo = ?";
    bd.query(select, [id_rdo], callback);
  },

  // Busca detalhes de um registro por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM rdo_maquinario WHERE id_rdo_maquinario = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de RDO Maquinário
  delete: (id, callback) => {
    const del = "DELETE FROM rdo_maquinario WHERE id_rdo_maquinario = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo registro de maquinário no RDO
  create: (data, callback) => {
    const insert = `
      INSERT INTO rdo_maquinario 
      (id_rdo, id_maquinario, etapa, quantidade_utilizada, tempo_utilizacao) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_rdo, 
        data.id_maquinario, 
        data.etapa, 
        data.quantidade_utilizada, 
        data.tempo_utilizacao
      ], 
      callback
    );
  },

  // Atualiza os dados de um registro existente
  update: (id, data, callback) => {
    const update = `
      UPDATE rdo_maquinario SET 
        id_rdo = ?, 
        id_maquinario = ?, 
        etapa = ?, 
        quantidade_utilizada = ?, 
        tempo_utilizacao = ? 
      WHERE id_rdo_maquinario = ?
    `;
    bd.query(
      update, 
      [
        data.id_rdo, 
        data.id_maquinario, 
        data.etapa, 
        data.quantidade_utilizada, 
        data.tempo_utilizacao, 
        id
      ], 
      callback
    );
  }
};

module.exports = RdoMaquinario;