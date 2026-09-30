const bd = require("../config/connection");

const Equipe = {
  // =====================================================
  // LISTAR TODAS AS EQUIPES
  // =====================================================

  getAll: (callback) => {
    const select = `
      SELECT *
      FROM cadastro_de_equipes
    `;

    bd.query(select, callback);
  },

  // =====================================================
  // LISTAR EQUIPES POR OBRA
  // =====================================================

  getByObra: (idobra, callback) => {
    const select = `
      SELECT *
      FROM cadastro_de_equipes
      WHERE idobra = ?
    `;

    bd.query(
      select,
      [idobra],
      callback
    );
  },

  // =====================================================
  // BUSCAR POR ID
  // =====================================================

  getById: (id, callback) => {
    const select = `
      SELECT *
      FROM cadastro_de_equipes
      WHERE id_cadastro_equipes = ?
    `;

    bd.query(
      select,
      [id],
      callback
    );
  },

  // =====================================================
  // EXCLUIR
  // =====================================================

  delete: (id, callback) => {
    const del = `
      DELETE FROM cadastro_de_equipes
      WHERE id_cadastro_equipes = ?
    `;

    bd.query(
      del,
      [id],
      callback
    );
  },

  // =====================================================
  // CRIAR
  // =====================================================

  create: (data, callback) => {
    const insert = `
      INSERT INTO cadastro_de_equipes (
        nome_equipe,
        etapa_atuacao,
        quantidade_profissionais,
        custo_diario,
        custo_mensal,
        idobra
      )
      VALUES (?, ?, ?, ?, ?, ?)
    `;

    bd.query(
      insert,
      [
        data.nome_equipe,
        data.etapa_atuacao,
        data.quantidade_profissionais,
        data.custo_diario,
        data.custo_mensal,
        data.idobra,
      ],
      callback
    );
  },

  // =====================================================
  // ATUALIZAR
  // =====================================================

  update: (id, data, callback) => {
    const update = `
      UPDATE cadastro_de_equipes
      SET
        nome_equipe = ?,
        etapa_atuacao = ?,
        quantidade_profissionais = ?,
        custo_diario = ?,
        custo_mensal = ?,
        idobra = ?
      WHERE id_cadastro_equipes = ?
    `;

    bd.query(
      update,
      [
        data.nome_equipe,
        data.etapa_atuacao,
        data.quantidade_profissionais,
        data.custo_diario,
        data.custo_mensal,
        data.idobra,
        id,
      ],
      callback
    );
  },
};

module.exports = Equipe;