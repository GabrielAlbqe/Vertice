
const bd = require("../config/connection");

const CustoPlanejado = {
  getAll: (idConstrutora, callback) => {
    const sql = `
      SELECT cp.*
      FROM custo_planejado cp
      INNER JOIN obra o ON o.id_obra = cp.id_obra
      WHERE o.id_construtora = ?
    `;

    bd.query(sql, [idConstrutora], callback);
  },

  getByObra: (idObra, idConstrutora, callback) => {
    const sql = `
      SELECT cp.*
      FROM custo_planejado cp
      INNER JOIN obra o ON o.id_obra = cp.id_obra
      WHERE cp.id_obra = ?
        AND o.id_construtora = ?
    `;

    bd.query(sql, [idObra, idConstrutora], callback);
  },

  getById: (id, idConstrutora, callback) => {
    const sql = `
      SELECT cp.*
      FROM custo_planejado cp
      INNER JOIN obra o ON o.id_obra = cp.id_obra
      WHERE cp.id_custo_planejado = ?
        AND o.id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  },

  create: (dados, idConstrutora, callback) => {
    const sql = `
      INSERT INTO custo_planejado (
        id_obra,
        etapa,
        origem_custo,
        valor_planejado,
        data_inicio_prevista,
        data_fim_prevista
      )
      SELECT
        o.id_obra,
        ?, ?, ?, ?, ?
      FROM obra o
      WHERE o.id_obra = ?
        AND o.id_construtora = ?
    `;

    bd.query(
      sql,
      [
        dados.etapa,
        dados.origem_custo,
        dados.valor_planejado,
        dados.data_inicio_prevista,
        dados.data_fim_prevista,
        dados.id_obra,
        idConstrutora
      ],
      callback
    );
  },

  update: (id, dados, idConstrutora, callback) => {
    const sql = `
      UPDATE custo_planejado cp
      INNER JOIN obra origem
        ON origem.id_obra = cp.id_obra
      INNER JOIN obra destino
        ON destino.id_obra = ?
       AND destino.id_construtora = ?
      SET
        cp.id_obra = destino.id_obra,
        cp.etapa = ?,
        cp.origem_custo = ?,
        cp.valor_planejado = ?,
        cp.data_inicio_prevista = ?,
        cp.data_fim_prevista = ?
      WHERE cp.id_custo_planejado = ?
        AND origem.id_construtora = ?
    `;

    bd.query(
      sql,
      [
        dados.id_obra,
        idConstrutora,
        dados.etapa,
        dados.origem_custo,
        dados.valor_planejado,
        dados.data_inicio_prevista,
        dados.data_fim_prevista,
        id,
        idConstrutora
      ],
      callback
    );
  },

  delete: (id, idConstrutora, callback) => {
    const sql = `
      DELETE cp
      FROM custo_planejado cp
      INNER JOIN obra o ON o.id_obra = cp.id_obra
      WHERE cp.id_custo_planejado = ?
        AND o.id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  }
};

module.exports = CustoPlanejado;
