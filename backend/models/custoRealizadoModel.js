
const bd = require("../config/connection");

const CustoRealizado = {
  // Lista custos de uma obra da construtora.
  getByObra: (idObra, idConstrutora, callback) => {
    const sql = `
      SELECT cr.*
      FROM custo_realizado cr
      INNER JOIN obra o
        ON o.id_obra = cr.id_obra
      WHERE cr.id_obra = ?
        AND o.id_construtora = ?
      ORDER BY cr.data DESC, cr.id_custo_realizado DESC
    `;

    bd.query(sql, [idObra, idConstrutora], callback);
  },

  // Lista custos de um RDO pertencente à construtora.
  getByRdo: (idRdo, idConstrutora, callback) => {
    const sql = `
      SELECT cr.*
      FROM custo_realizado cr
      INNER JOIN obra o
        ON o.id_obra = cr.id_obra
      INNER JOIN rdo r
        ON r.id_rdo = cr.id_rdo
       AND r.id_obra = cr.id_obra
      WHERE cr.id_rdo = ?
        AND o.id_construtora = ?
      ORDER BY cr.id_custo_realizado DESC
    `;

    bd.query(sql, [idRdo, idConstrutora], callback);
  },

  // Consulta custo pelo ID com isolamento por empresa.
  getById: (id, idConstrutora, callback) => {
    const sql = `
      SELECT cr.*
      FROM custo_realizado cr
      INNER JOIN obra o
        ON o.id_obra = cr.id_obra
      WHERE cr.id_custo_realizado = ?
        AND o.id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  },

  // Cadastra somente quando obra, etapa e RDO combinam.
  create: (dados, idConstrutora, callback) => {
    const sql = `
      INSERT INTO custo_realizado (
        id_obra,
        id_etapa,
        id_rdo,
        origem_custo,
        id_origem,
        data,
        quantidade,
        custo_unitario
      )
      SELECT
        o.id_obra,
        e.id_etapa,
        r.id_rdo,
        ?, ?, ?, ?, ?
      FROM obra o
      INNER JOIN etapa e
        ON e.id_etapa = ?
       AND e.id_obra = o.id_obra
      INNER JOIN rdo r
        ON r.id_rdo = ?
       AND r.id_obra = o.id_obra
      WHERE o.id_obra = ?
        AND o.id_construtora = ?
    `;

    bd.query(
      sql,
      [
        dados.origem_custo,
        dados.id_origem,
        dados.data,
        dados.quantidade,
        dados.custo_unitario,
        dados.id_etapa,
        dados.id_rdo,
        dados.id_obra,
        idConstrutora
      ],
      callback
    );
  },

  // Atualiza apenas custos próprios e vínculos válidos.
  update: (id, dados, idConstrutora, callback) => {
    const sql = `
      UPDATE custo_realizado cr
      INNER JOIN obra atual
        ON atual.id_obra = cr.id_obra
       AND atual.id_construtora = ?
      INNER JOIN obra destino
        ON destino.id_obra = ?
       AND destino.id_construtora = ?
      INNER JOIN etapa e
        ON e.id_etapa = ?
       AND e.id_obra = destino.id_obra
      INNER JOIN rdo r
        ON r.id_rdo = ?
       AND r.id_obra = destino.id_obra
      SET
        cr.id_obra = destino.id_obra,
        cr.id_etapa = e.id_etapa,
        cr.id_rdo = r.id_rdo,
        cr.origem_custo = ?,
        cr.id_origem = ?,
        cr.data = ?,
        cr.quantidade = ?,
        cr.custo_unitario = ?
      WHERE cr.id_custo_realizado = ?
    `;

    bd.query(
      sql,
      [
        idConstrutora,
        dados.id_obra,
        idConstrutora,
        dados.id_etapa,
        dados.id_rdo,
        dados.origem_custo,
        dados.id_origem,
        dados.data,
        dados.quantidade,
        dados.custo_unitario,
        id
      ],
      callback
    );
  },

  // Exclui apenas custos pertencentes à construtora.
  delete: (id, idConstrutora, callback) => {
    const sql = `
      DELETE cr
      FROM custo_realizado cr
      INNER JOIN obra o
        ON o.id_obra = cr.id_obra
      WHERE cr.id_custo_realizado = ?
        AND o.id_construtora = ?
    `;

    bd.query(sql, [id, idConstrutora], callback);
  }
};

module.exports = CustoRealizado;
