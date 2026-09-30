const bd = require("../config/connection");

const Maquinario = {
  getAll: (callback) => {
    const select = `
      SELECT *
      FROM cadastro_de_maquinario
      ORDER BY id_maquina DESC
    `;

    bd.query(
      select,
      callback
    );
  },

  getByObra: (
    idobra,
    callback
  ) => {
    const select = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE idobra = ?
      ORDER BY id_maquina DESC
    `;

    bd.query(
      select,
      [idobra],
      callback
    );
  },

  getById: (
    id,
    callback
  ) => {
    const select = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE id_maquina = ?
    `;

    bd.query(
      select,
      [id],
      callback
    );
  },

  delete: (
    id,
    callback
  ) => {
    const del = `
      DELETE FROM cadastro_de_maquinario
      WHERE id_maquina = ?
    `;

    bd.query(
      del,
      [id],
      callback
    );
  },

  create: (
    data,
    callback
  ) => {
    const insert = `
      INSERT INTO cadastro_de_maquinario (
        nome,
        quantidade,
        etapa_atuacao,
        custo_diario,
        status,
        idobra
      )
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
        data.idobra,
      ],
      callback
    );
  },

  update: (
    id,
    data,
    callback
  ) => {
    const update = `
      UPDATE cadastro_de_maquinario
      SET
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
        id,
      ],
      callback
    );
  },
};

module.exports =
  Maquinario;