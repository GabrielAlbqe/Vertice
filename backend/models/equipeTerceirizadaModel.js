const bd = require("../config/connection");

const EquipeTerceirizada = {
  // Lista todas as equipes terceirizadas
  getAll: (callback) => {
    const select = "SELECT * FROM cadastro_de_equipes_terceirizadas";
    bd.query(select, callback);
  },

  // Lista todas as equipes terceirizadas vinculadas a uma obra específica
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM cadastro_de_equipes_terceirizadas WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca uma equipe terceirizada por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM cadastro_de_equipes_terceirizadas WHERE id_equipe_terceirizada = ?";
    bd.query(select, [id], callback);
  },

  // Remove uma equipe terceirizada
  delete: (id, callback) => {
    const del = "DELETE FROM cadastro_de_equipes_terceirizadas WHERE id_equipe_terceirizada = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova equipe terceirizada
  create: (data, callback) => {
    const insert = `
      INSERT INTO cadastro_de_equipes_terceirizadas 
      (nome_equipe, custo_diario_total, id_obra) 
      VALUES (?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome_equipe, 
        data.custo_diario_total, 
        data.id_obra
      ], 
      callback
    );
  },

  // Atualiza os dados de uma equipe terceirizada existente
  update: (id, data, callback) => {
    const update = `
      UPDATE cadastro_de_equipes_terceirizadas SET 
        nome_equipe = ?, 
        custo_diario_total = ?, 
        id_obra = ? 
      WHERE id_equipe_terceirizada = ?
    `;
    bd.query(
      update, 
      [
        data.nome_equipe, 
        data.custo_diario_total, 
        data.id_obra, 
        id
      ], 
      callback
    );
  }
};

module.exports = EquipeTerceirizada;