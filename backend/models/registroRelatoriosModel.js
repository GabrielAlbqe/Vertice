const bd = require("../config/connection");

const RegistroRelatorios = {
  // Lista todos os registros de relatórios vinculados a uma obra específica
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM registro_relatorios WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca um registro de relatório específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM registro_relatorios WHERE id_registro_relatorio = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de relatório
  delete: (id, callback) => {
    const del = "DELETE FROM registro_relatorios WHERE id_registro_relatorio = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo registro de relatório
  create: (data, callback) => {
    const insert = `
      INSERT INTO registro_relatorios 
      (id_diario, id_obra, data_registro) 
      VALUES (?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_diario, 
        data.id_obra, 
        data.data_registro || new Date()
      ], 
      callback
    );
  },

  // Atualiza os dados de um registro de relatório existente
  update: (id, data, callback) => {
    const update = `
      UPDATE registro_relatorios SET 
        id_diario = ?, 
        id_obra = ?, 
        data_registro = ? 
      WHERE id_registro_relatorio = ?
    `;
    bd.query(
      update, 
      [
        data.id_diario, 
        data.id_obra, 
        data.data_registro, 
        id
      ], 
      callback
    );
  }
};

module.exports = RegistroRelatorios;