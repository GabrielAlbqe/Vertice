
const bd = require("../config/connection");

const Maquinario = {
  getAll: (idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE id_construtora = ?
      ORDER BY id_maquina DESC
    `;

    bd.query(sql, [idConstrutora], callback);
  },

  getByObra: (idObra, idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE idobra = ?
        AND id_construtora = ?
      ORDER BY id_maquina DESC
    `;

    bd.query(sql, [idObra, idConstrutora], callback);
  },

  getSemObra: (idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE idobra IS NULL
        AND id_construtora = ?
      ORDER BY id_maquina DESC
    `;

    bd.query(sql, [idConstrutora], callback);
  },

  getById: (id, idConstrutora, callback) => {
    const sql = `
      SELECT *
      FROM cadastro_de_maquinario
      WHERE id_maquina = ?
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
      INSERT INTO cadastro_de_maquinario (
        nome,
        quantidade,
        etapa_atuacao,
        custo_diario,
        status,
        idobra,
        id_construtora
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    bd.query(sql, [
      dados.nome,
      dados.quantidade,
      dados.etapa_atuacao,
      dados.custo_diario,
      dados.status,
      dados.idobra ?? null,
      idConstrutora
    ], callback);
  },

  update: (id, dados, idConstrutora, callback) => {
    const sql = `
      UPDATE cadastro_de_maquinario
      SET
        nome = ?,
        quantidade = ?,
        etapa_atuacao = ?,
        custo_diario = ?,
        status = ?,
        idobra = ?
      WHERE id_maquina = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [
      dados.nome,
      dados.quantidade,
      dados.etapa_atuacao,
      dados.custo_diario,
      dados.status,
      dados.idobra ?? null,
      id,
      idConstrutora
    ], callback);
  },

  updateObra: (id, idObra, idConstrutora, callback) => {
    const sql = `
      UPDATE cadastro_de_maquinario
      SET idobra = ?
      WHERE id_maquina = ?
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
      DELETE FROM cadastro_de_maquinario
      WHERE id_maquina = ?
        AND id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  }
};

module.exports = Maquinario;
