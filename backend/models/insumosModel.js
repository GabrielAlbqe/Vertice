
const bd = require("../config/connection");

const Insumos = {
  getAll: (idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_insumos
      WHERE id_construtora = ?
      ORDER BY id_insumos DESC
    `;

    bd.query(sql, [idConstrutora], callback);
  },

  getByObra: (idObra, idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_insumos
      WHERE idobra = ?
        AND id_construtora = ?
      ORDER BY id_insumos DESC
    `;

    bd.query(sql, [idObra, idConstrutora], callback);
  },

  getSemObra: (idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_insumos
      WHERE idobra IS NULL
        AND id_construtora = ?
      ORDER BY id_insumos DESC
    `;

    bd.query(sql, [idConstrutora], callback);
  },

  getById: (id, idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_insumos
      WHERE id_insumos = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  },

  verificarObra: (idObra, idConstrutora, callback) => {
    const sql = `
      SELECT id_obra
      FROM obra
      WHERE id_obra = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [idObra, idConstrutora], callback);
  },

  create: (dados, idConstrutora, callback) => {
    const sql = `
      INSERT INTO cadastro_de_insumos
      (
        nome,
        quantidade_disponivel,
        valor_unitario,
        idobra,
        id_construtora
      )
      VALUES (?, ?, ?, ?, ?)
    `;

    bd.query(sql, [
      dados.nome,
      dados.quantidade_disponivel,
      dados.valor_unitario,
      dados.idobra ?? null,
      idConstrutora
    ], callback);
  },

  update: (id, dados, idConstrutora, callback) => {
    const sql = `
      UPDATE cadastro_de_insumos
      SET
        nome = ?,
        quantidade_disponivel = ?,
        valor_unitario = ?,
        idobra = ?
      WHERE id_insumos = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [
      dados.nome,
      dados.quantidade_disponivel,
      dados.valor_unitario,
      dados.idobra ?? null,
      id,
      idConstrutora
    ], callback);
  },

  updateObra: (id, idObra, idConstrutora, callback) => {
    const sql = `
      UPDATE cadastro_de_insumos
      SET idobra = ?
      WHERE id_insumos = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [
      idObra,
      id,
      idConstrutora
    ], callback);
  },

  delete: (id, idConstrutora, callback) => {
    const sql = `
      DELETE FROM cadastro_de_insumos
      WHERE id_insumos = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  }
};

module.exports = Insumos;
