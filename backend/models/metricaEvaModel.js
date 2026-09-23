const bd = require("../config/connection");

const MetricasEva = {
  // Lista todas as métricas EVA vinculadas a uma obra específica
  getByObra: (obra_idxx, callback) => {
    const select = "SELECT * FROM metricas_eva WHERE obra_idxx = ?";
    bd.query(select, [obra_idxx], callback);
  },

  // Busca uma métrica EVA específica por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM metricas_eva WHERE id_metrica = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de métrica EVA
  delete: (id, callback) => {
    const del = "DELETE FROM metricas_eva WHERE id_metrica = ?";
    bd.query(del, [id], callback);
  },

  // Insere uma nova métrica EVA
  create: (data, callback) => {
    const insert = `
      INSERT INTO metricas_eva 
      (data_calculo, idc, idp, eac, obra_idxx) 
      VALUES (?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.data_calculo, 
        data.idc, 
        data.idp, 
        data.eac, 
        data.obra_idxx
      ], 
      callback
    );
  },

  // Atualiza os dados de uma métrica EVA existente
  update: (id, data, callback) => {
    const update = `
      UPDATE metricas_eva SET 
        data_calculo = ?, 
        idc = ?, 
        idp = ?, 
        eac = ?, 
        obra_idxx = ? 
      WHERE id_metrica = ?
    `;
    bd.query(
      update, 
      [
        data.data_calculo, 
        data.idc, 
        data.idp, 
        data.eac, 
        data.obra_idxx, 
        id
      ], 
      callback
    );
  }
};

module.exports = MetricasEva;