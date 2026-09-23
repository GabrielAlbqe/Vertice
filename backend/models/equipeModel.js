const bd = require("../config/connection");

const Equipe = {
  // Lista todas as equipes vinculadas a uma obra específica
  getByObra: (idobra, callback) => {
    const select = "SELECT * FROM cadastro_de_equipes WHERE idobra = ?";
    bd.query(select, [idobra], callback);
  },

  // Busca uma equipe específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM cadastro_de_equipes WHERE id_cadastro_equipes = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de equipe
  delete: (id, callback) => {
    const del = "DELETE FROM cadastro_de_equipes WHERE id_cadastro_equipes = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova equipe
  create: (data, callback) => {
    const insert = `
      INSERT INTO cadastro_de_equipes 
      (nome_equipe, etapa_atuacao, quantidade_profissionais, custo_diario, custo_mensal, idobra) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome_equipe, 
        data.etapa_atuacao, 
        data.quantidade_profissionais, 
        data.custo_diario, 
        data.custo_mensal, 
        data.idobra
      ], 
      callback
    );
  },

  // Atualiza os dados de uma equipe existente
  update: (id, data, callback) => {
    const update = `
      UPDATE cadastro_de_equipes SET 
        nome_equipe = ?, 
        etapa_atuacao = ?, 
        quantidade_profissionais = ?, 
        custo_diario = ?, 
        custo_mensal = ?, 
        idobra = ? 
      WHERE id_cadastro_equipes = ?
    `;
    bd.query(
      update, 
      [
        data.nome_equipe, 
        data.etapa_atuacao, 
        data.quantidade_profissionais, 
        data.custo_diario, 
        data.custo_mensal, 
        data.idobra, 
        id
      ], 
      callback
    );
  }
};

module.exports = Equipe;