const bd = require("../config/connection");

const Obra = {
  // Lista todas as obras vinculadas a uma construtora específica
  getByConstrutora: (id_construtora, callback) => {
    const select = "SELECT * FROM obra WHERE id_construtora = ?";
    bd.query(select, [id_construtora], callback);
  },

  // Busca uma obra específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM obra WHERE id_obra = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de obra
  delete: (id, callback) => {
    const del = "DELETE FROM obra WHERE id_obra = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova obra
  create: (data, callback) => {
    const insert = `
      INSERT INTO obra 
      (nome, status, id_construtora, categoria, numero_pavimentos, data_inicio_planejada, data_termino_planejada, orcamento_planejado) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome, 
        data.status, 
        data.id_construtora, 
        data.categoria, 
        data.numero_pavimentos, 
        data.data_inicio_planejada, 
        data.data_termino_planejada, 
        data.orcamento_planejado
      ], 
      callback
    );
  },

  // Atualiza os dados de uma obra existente
  update: (id, data, callback) => {
    const update = `
      UPDATE obra SET 
        nome = ?, 
        status = ?, 
        id_construtora = ?, 
        categoria = ?, 
        numero_pavimentos = ?, 
        data_inicio_planejada = ?, 
        data_termino_planejada = ?, 
        orcamento_planejado = ? 
      WHERE id_obra = ?
    `;
    bd.query(
      update, 
      [
        data.nome, 
        data.status, 
        data.id_construtora, 
        data.categoria, 
        data.numero_pavimentos, 
        data.data_inicio_planejada, 
        data.data_termino_planejada, 
        data.orcamento_planejado, 
        id
      ], 
      callback
    );
  }
};

module.exports = Obra;