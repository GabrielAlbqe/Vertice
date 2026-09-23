const bd = require("../config/connection");

const DiarioObra = {
  // Lista todos os diários vinculados a uma obra específica
  getByObra: (obrax_id, callback) => {
    const select = "SELECT * FROM diario_obra WHERE obrax_id = ?";
    bd.query(select, [obrax_id], callback);
  },

  // Busca um diário específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM diario_obra WHERE id_diario = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de diário de obra
  delete: (id, callback) => {
    const del = "DELETE FROM diario_obra WHERE id_diario = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo diário de obra
  create: (data, callback) => {
    const insert = `
      INSERT INTO diario_obra 
      (data, clima, turno, etapa_atuacao, equipe_interna, equipe_terceirizada, paralisacoes, origem_paralisacoes, atrasos, origem_atrasos, obrax_id, usuario_id) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.data, 
        data.clima, 
        data.turno, 
        data.etapa_atuacao, 
        data.equipe_interna || null, 
        data.equipe_terceirizada || null, 
        data.paralisacoes, 
        data.origem_paralisacoes, 
        data.atrasos, 
        data.origem_atrasos, 
        data.obrax_id, 
        data.usuario_id
      ], 
      callback
    );
  },

  // Atualiza os dados de um diário existente
  update: (id, data, callback) => {
    const update = `
      UPDATE diario_obra SET 
        data = ?, 
        clima = ?, 
        turno = ?, 
        etapa_atuacao = ?, 
        equipe_interna = ?, 
        equipe_terceirizada = ?, 
        paralisacoes = ?, 
        origem_paralisacoes = ?, 
        atrasos = ?, 
        origem_atrasos = ?, 
        obrax_id = ?, 
        usuario_id = ? 
      WHERE id_diario = ?
    `;
    bd.query(
      update, 
      [
        data.data, 
        data.clima, 
        data.turno, 
        data.etapa_atuacao, 
        data.equipe_interna || null, 
        data.equipe_terceirizada || null, 
        data.paralisacoes, 
        data.origem_paralisacoes, 
        data.atrasos, 
        data.origem_atrasos, 
        data.obrax_id, 
        data.usuario_id, 
        id
      ], 
      callback
    );
  }
};

module.exports = DiarioObra;