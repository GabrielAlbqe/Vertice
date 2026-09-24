const bd = require("../config/connection");

const ProjecaoFinanceira = {
  // Lista projeções financeiras por obra
  getByObra: (id_obra, callback) => {
    const select = "SELECT * FROM projecao_financeira WHERE id_obra = ?";
    bd.query(select, [id_obra], callback);
  },

  // Busca detalhes de uma projeção por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM projecao_financeira WHERE id_projecao = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registo de projeção financeira
  delete: (id, callback) => {
    const del = "DELETE FROM projecao_financeira WHERE id_projecao = ?";
    bd.query(del, [id], callback);
  },

  // Regista uma nova projeção financeira
  create: (data, callback) => {
    // Trata 'Nenhum' para salvar NULL na base de dados se necessário
    const etapaValida = data.etapa === "Nenhum" ? null : data.etapa;

    const insert = `
      INSERT INTO projecao_financeira 
      (id_obra, etapa, data_projecao, custo_realizado, custo_restante_estimado, custo_final_projetado, desvio_projetado, desvio_projetado_percentual) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.id_obra, 
        etapaValida, 
        data.data_projecao, 
        data.custo_realizado, 
        data.custo_restante_estimado, 
        data.custo_final_projetado, 
        data.desvio_projetado, 
        data.desvio_projetado_percentual
      ], 
      callback
    );
  },

  // Atualiza um registo existente
  update: (id, data, callback) => {
    const etapaValida = data.etapa === "Nenhum" ? null : data.etapa;

    const update = `
      UPDATE projecao_financeira SET 
        id_obra = ?, 
        etapa = ?, 
        data_projecao = ?, 
        custo_realizado = ?, 
        custo_restante_estimado = ?, 
        custo_final_projetado = ?, 
        desvio_projetado = ?, 
        desvio_projetado_percentual = ? 
      WHERE id_projecao = ?
    `;
    bd.query(
      update, 
      [
        data.id_obra, 
        etapaValida, 
        data.data_projecao, 
        data.custo_realizado, 
        data.custo_restante_estimado, 
        data.custo_final_projetado, 
        data.desvio_projetado, 
        data.desvio_projetado_percentual, 
        id
      ], 
      callback
    );
  }
};

module.exports = ProjecaoFinanceira;