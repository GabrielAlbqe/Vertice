const bd = require("../config/connection");

const Obra = {
  getAll: (callback) => {
    const select = `
      SELECT *
      FROM obra
      ORDER BY id_obra DESC
    `;

    bd.query(select, callback);
  },

  getByConstrutora: (id_construtora, callback) => {
    const select = `
      SELECT *
      FROM obra
      WHERE id_construtora = ?
      ORDER BY id_obra DESC
    `;

    bd.query(
      select,
      [id_construtora],
      callback
    );
  },

  getById: (id, callback) => {
    const select = `
      SELECT *
      FROM obra
      WHERE id_obra = ?
    `;

    bd.query(
      select,
      [id],
      callback
    );
  },

  delete: (id, callback) => {
    const del = `
      DELETE FROM obra
      WHERE id_obra = ?
    `;

    bd.query(
      del,
      [id],
      callback
    );
  },

  create: (data, callback) => {
    const insert = `
      INSERT INTO obra (
        nome,
        status,
        id_construtora,
        categoria,
        numero_pavimentos,
        data_inicio_planejada,
        data_termino_planejada,
        orcamento_planejado
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;

    bd.query(
      insert,
      [
        data.nome,
        data.status,
        data.id_construtora,
        data.categoria,
        data.numero_pavimentos,
        data.data_inicio_planejada,
        data.data_termino_planejada,
        data.orcamento_planejado,
      ],
      callback
    );
  },

  update: (id, data, callback) => {
    const update = `
      UPDATE obra
      SET
        nome = ?,
        status = ?,
        id_construtora = ?,
        categoria = ?,
        numero_pavimentos = ?,
        data_inicio_planejada = ?,
        data_termino_planejada = ?,
        orcamento_planejado = ?
      WHERE id_obra = ?
    `;

    bd.query(
      update,
      [
        data.nome,
        data.status,
        data.id_construtora,
        data.categoria,
        data.numero_pavimentos,
        data.data_inicio_planejada,
        data.data_termino_planejada,
        data.orcamento_planejado,
        id,
      ],
      callback
    );
  },
};

module.exports = Obra;