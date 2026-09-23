const bd = require("../config/connection");

const EquipeEtapa = {
  // Lista todos os registros de etapas das equipes
  getAll: (callback) => {
    const select = "SELECT * FROM equipe_etapa";
    bd.query(select, callback);
  },

  // Lista os registros vinculados a uma equipe específica
  getByEquipe: (id_equipe, callback) => {
    const select = "SELECT * FROM equipe_etapa WHERE id_equipe = ?";
    bd.query(select, [id_equipe], callback);
  },

  // Busca um registro específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM equipe_etapa WHERE id_equipe_etapa = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de equipe_etapa
  delete: (id, callback) => {
    const del = "DELETE FROM equipe_etapa WHERE id_equipe_etapa = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo registro de equipe_etapa
  create: (data, callback) => {
    const insert = `
      INSERT INTO equipe_etapa 
      (id_equipe, etapa, data_inicio, data_fim) 
      VALUES (?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_equipe, 
        data.etapa, 
        data.data_inicio, 
        data.data_fim
      ], 
      callback
    );
  },

  // Atualiza os dados de um registro existente
  update: (id, data, callback) => {
    const update = `
      UPDATE equipe_etapa SET 
        id_equipe = ?, 
        etapa = ?, 
        data_inicio = ?, 
        data_fim = ? 
      WHERE id_equipe_etapa = ?
    `;
    bd.query(
      update, 
      [
        data.id_equipe, 
        data.etapa, 
        data.data_inicio, 
        data.data_fim, 
        id
      ], 
      callback
    );
  }
};

module.exports = EquipeEtapa;