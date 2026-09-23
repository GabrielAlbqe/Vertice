const bd = require("../config/connection");

const Usuario = {
  // Lista todos os usuários
  getAll: (callback) => {
    const select = "SELECT id_usuario, nome, email, ocupacao, ambiente, status, data_cadastro, idconstrutora FROM usuario";
    bd.query(select, callback);
  },

  // Lista todos os usuários vinculados a uma construtora específica
  getByConstrutora: (idconstrutora, callback) => {
    const select = "SELECT id_usuario, nome, email, ocupacao, ambiente, status, data_cadastro, idconstrutora FROM usuario WHERE idconstrutora = ?";
    bd.query(select, [idconstrutora], callback);
  },

  // Busca um usuário específico por ID
  getById: (id, callback) => {
    const select = "SELECT id_usuario, nome, email, ocupacao, ambiente, status, data_cadastro, idconstrutora FROM usuario WHERE id_usuario = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de usuário
  delete: (id, callback) => {
    const del = "DELETE FROM usuario WHERE id_usuario = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo usuário
  create: (data, callback) => {
    const insert = `
      INSERT INTO usuario 
      (nome, email, senha, ocupacao, ambiente, status, idconstrutora) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome, 
        data.email, 
        data.senha, 
        data.ocupacao || null, 
        data.ambiente || null, 
        data.status || 'Ativo', 
        data.idconstrutora
      ], 
      callback
    );
  },

  // Atualiza os dados de um usuário existente
  update: (id, data, callback) => {
    const update = `
      UPDATE usuario SET 
        nome = ?, 
        email = ?, 
        senha = ?, 
        ocupacao = ?, 
        ambiente = ?, 
        status = ?, 
        idconstrutora = ? 
      WHERE id_usuario = ?
    `;
    bd.query(
      update, 
      [
        data.nome, 
        data.email, 
        data.senha, 
        data.ocupacao, 
        data.ambiente, 
        data.status, 
        data.idconstrutora, 
        id
      ], 
      callback
    );
  },

  // =====================================================
  // LOGIN
  // =====================================================
  buscarUsuarioPorEmailESenha: (email, senha, callback) => {
    const select = `
      SELECT
        id_usuario,
        nome,
        email,
        ocupacao,
        ambiente,
        status,
        data_cadastro,
        idconstrutora
      FROM usuario
      WHERE email = ?
        AND senha = ?
        AND status = 'Ativo'
      LIMIT 1
    `;

    bd.query(
      select,
      [email, senha],
      callback
    );
  }
};

module.exports = Usuario;