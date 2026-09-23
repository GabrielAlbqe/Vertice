const bd = require("../config/connection");

const Cargo = {
  // Retorna todos os cargos cadastrados no sistema
  getAll: (callback) => {
    const select = "SELECT * FROM cargo";
    bd.query(select, callback);
  },

  // Busca um cargo específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM cargo WHERE id_cargo = ?";
    bd.query(select, [id], callback);
  },

  // Remove um cargo (com restrição caso algum usuário esteja vinculado)
  delete: (id, callback) => {
    const del = "DELETE FROM cargo WHERE id_cargo = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo cargo respeitando o ENUM de permissões
  create: (data, callback) => {
    const insert = "INSERT INTO cargo (nome_cargo, descricao) VALUES (?, ?)";
    bd.query(insert, [data.nome_cargo, data.descricao], callback);
  },

  // Atualiza as informações de descrição ou o papel do cargo
  update: (id, data, callback) => {
    const update = "UPDATE cargo SET nome_cargo = ?, descricao = ? WHERE id_cargo = ?";
    bd.query(update, [data.nome_cargo, data.descricao, id], callback);
  }
};

module.exports = Cargo;