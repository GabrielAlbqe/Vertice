const bd = require("../config/connection");

const Rdo = {
  // Lista todos os RDOs filtrando pelo ID da obra
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM rdo WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca detalhes de um RDO específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM rdo WHERE id_rdo = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de RDO
  delete: (id, callback) => {
    const del = "DELETE FROM rdo WHERE id_rdo = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo RDO
  create: (data, callback) => {
    const insert = `
      INSERT INTO rdo 
      (id_obra, data_rdo, turno, clima) 
      VALUES (?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_obra, 
        data.data_rdo, 
        data.turno, 
        data.clima
      ], 
      callback
    );
  },

  // Atualiza os dados de um RDO existente
  update: (id, data, callback) => {
    const update = `
      UPDATE rdo SET 
        id_obra = ?, 
        data_rdo = ?, 
        turno = ?, 
        clima = ? 
      WHERE id_rdo = ?
    `;
    bd.query(
      update, 
      [
        data.id_obra, 
        data.data_rdo, 
        data.turno, 
        data.clima, 
        id
      ], 
      callback
    );
  }
};

module.exports = Rdo;