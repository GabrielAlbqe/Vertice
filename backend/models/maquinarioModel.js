const bd = require("../config/connection");

const Maquinario = {
  // Lista todos os maquinários vinculados a uma obra específica
  getByObra: (idobra, callback) => {
    const select = "SELECT * FROM cadastro_de_maquinario WHERE idobra = ?";
    bd.query(select, [idobra], callback);
  },

  // Busca um maquinário específico por ID
  getById: (id, callback) => {
    const select = "SELECT * FROM cadastro_de_maquinario WHERE id_maquina = ?";
    bd.query(select, [id], callback);
  },

  // Remove um registro de maquinário
  delete: (id, callback) => {
    const del = "DELETE FROM cadastro_de_maquinario WHERE id_maquina = ?";
    bd.query(del, [id], callback);
  },

  // Insere um novo maquinário
  create: (data, callback) => {
    const insert = `
      INSERT INTO cadastro_de_maquinario 
      (nome, quantidade, etapa_atuacao, custo_diario, status, idobra) 
      VALUES (?, ?, ?, ?, ?, ?)
    `;
    bd.query(
      insert, 
      [
        data.nome, 
        data.quantidade, 
        data.etapa_atuacao, 
        data.custo_diario, 
        data.status, 
        data.idobra
      ], 
      callback
    );
  },

  // Atualiza os dados de um maquinário existente
  update: (id, data, callback) => {
    const update = `
      UPDATE cadastro_de_maquinario SET 
        nome = ?, 
        quantidade = ?, 
        etapa_atuacao = ?, 
        custo_diario = ?, 
        status = ?, 
        idobra = ? 
      WHERE id_maquina = ?
    `;
    bd.query(
      update, 
      [
        data.nome, 
        data.quantidade, 
        data.etapa_atuacao, 
        data.custo_diario, 
        data.status, 
        data.idobra, 
        id
      ], 
      callback
    );
  }
};

module.exports = Maquinario;