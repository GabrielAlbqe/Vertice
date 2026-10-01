const bd = require("../config/connection");

const ProjecaoFinanceira = {
  getByObra: (id_obra, callback) => {
    bd.query("SELECT * FROM projecao_financeira WHERE id_obra = ?", [id_obra], callback);
  },
  getById: (id, callback) => {
    bd.query("SELECT * FROM projecao_financeira WHERE id_projecao = ?", [id], callback);
  },
  delete: (id, callback) => {
    bd.query("DELETE FROM projecao_financeira WHERE id_projecao = ?", [id], callback);
  },
  create: (data, callback) => {
    const etapaValida = data.etapa === "Nenhum" ? null : data.etapa;
    const insert = `
      INSERT INTO projecao_financeira
      (id_obra, etapa, data_projecao, custo_realizado, custo_restante_estimado,
       desvio_projetado, desvio_projetado_percentual)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(insert, [
      data.id_obra, etapaValida, data.data_projecao, data.custo_realizado,
      data.custo_restante_estimado, data.desvio_projetado, data.desvio_projetado_percentual
    ], callback);
  },
  update: (id, data, callback) => {
    const etapaValida = data.etapa === "Nenhum" ? null : data.etapa;
    const update = `
      UPDATE projecao_financeira SET
        id_obra = ?, etapa = ?, data_projecao = ?, custo_realizado = ?,
        custo_restante_estimado = ?, desvio_projetado = ?, desvio_projetado_percentual = ?
      WHERE id_projecao = ?
    `;
    bd.query(update, [
      data.id_obra, etapaValida, data.data_projecao, data.custo_realizado,
      data.custo_restante_estimado, data.desvio_projetado,
      data.desvio_projetado_percentual, id
    ], callback);
  }
};

module.exports = ProjecaoFinanceira;
