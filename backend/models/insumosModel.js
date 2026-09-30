const bd = require("../config/connection");

const Insumos = {
  getAll: (callback) => {
    const select = `
      SELECT *
      FROM cadastro_de_insumos
      ORDER BY id_insumos DESC
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
      FROM cadastro_de_insumos
      WHERE idobra = ?
      ORDER BY id_insumos DESC
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
      FROM cadastro_de_insumos
      WHERE id_insumos = ?
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
      DELETE FROM cadastro_de_insumos
      WHERE id_insumos = ?
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
      INSERT INTO cadastro_de_insumos (
        nome,
        quantidade_disponivel,
        valor_unitario,
        idobra
      )
      VALUES (?, ?, ?, ?)
    `;

    bd.query(
      insert,
      [
        data.nome,
        data.quantidade_disponivel,
        data.valor_unitario,
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
      UPDATE cadastro_de_insumos
      SET
        nome = ?,
        quantidade_disponivel = ?,
        valor_unitario = ?,
        idobra = ?
      WHERE id_insumos = ?
    `;

    bd.query(
      update,
      [
        data.nome,
        data.quantidade_disponivel,
        data.valor_unitario,
        data.idobra,
        id,
      ],
      callback
    );
  },
};

module.exports =
  Insumos;