const bd = require("../config/connection");

const ApontamentoFisico = {
  // Lista todos os apontamentos vinculados a um diário de obras específico
  getByDiario: (diario_id, callback) => {
    const select = "SELECT * FROM apontamento_fisico WHERE diario_id = ?";
    bd.query(select, [diario_id], callback);
  },

  // Busca um apontamento específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM apontamento_fisico WHERE id_apontamento = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de apontamento físico
  delete: (id, callback) => {
    const del = "DELETE FROM apontamento_fisico WHERE id_apontamento = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo apontamento físico diário
  create: (data, callback) => {
    const insert = `
      INSERT INTO apontamento_fisico 
      (percentual_dia, url_foto, diario_id, atividade_eap_id) 
      VALUES (?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.percentual_dia, 
        data.url_foto, 
        data.diario_id, 
        data.atividade_eap_id
      ], 
      callback
    );
  },

  // Atualiza as informações de um apontamento existente
  update: (id, data, callback) => {
    const update = `
      UPDATE apontamento_fisico SET 
        percentual_dia = ?, 
        url_foto = ?, 
        diario_id = ?, 
        atividade_eap_id = ? 
      WHERE id_apontamento = ?
    `;
    bd.query(
      update, 
      [
        data.percentual_dia, 
        data.url_foto, 
        data.diario_id, 
        data.atividade_eap_id, 
        id
      ], 
      callback
    );
  }
};

module.exports = ApontamentoFisico;