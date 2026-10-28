const bd = require('../config/connection');

const Equipe = {
  getAll: (idConstrutora, callback) => {
    bd.query(
      'SELECT * FROM cadastro_de_equipes WHERE id_construtora = ? ORDER BY id_cadastro_equipes DESC',
      [idConstrutora], callback
    );
  },

  getByObra: (idobra, idConstrutora, callback) => {
    bd.query(
      'SELECT * FROM cadastro_de_equipes WHERE idobra = ? AND id_construtora = ? ORDER BY id_cadastro_equipes DESC',
      [idobra, idConstrutora], callback
    );
  },

  getSemObra: (idConstrutora, callback) => {
    bd.query(
      'SELECT * FROM cadastro_de_equipes WHERE idobra IS NULL AND id_construtora = ? ORDER BY id_cadastro_equipes DESC',
      [idConstrutora], callback
    );
  },

  getById: (id, idConstrutora, callback) => {
    bd.query(
      'SELECT * FROM cadastro_de_equipes WHERE id_cadastro_equipes = ? AND id_construtora = ?',
      [id, idConstrutora], callback
    );
  },

  verificarObra: (idobra, idConstrutora, callback) => {
    bd.query(
      'SELECT id_obra FROM obra WHERE id_obra = ? AND id_construtora = ?',
      [idobra, idConstrutora], callback
    );
  },

  create: (dados, idConstrutora, callback) => {
    const sql = `
      INSERT INTO cadastro_de_equipes
      (nome_equipe, etapa_atuacao, quantidade_profissionais,
       custo_diario, custo_mensal, idobra, id_construtora)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;
    bd.query(sql, [
      dados.nome_equipe, dados.etapa_atuacao,
      dados.quantidade_profissionais, dados.custo_diario,
      dados.custo_mensal, dados.idobra ?? null, idConstrutora
    ], callback);
  },

  update: (id, dados, idConstrutora, callback) => {
    const sql = `
      UPDATE cadastro_de_equipes
      SET nome_equipe = ?, etapa_atuacao = ?, quantidade_profissionais = ?,
          custo_diario = ?, custo_mensal = ?, idobra = ?
      WHERE id_cadastro_equipes = ? AND id_construtora = ?
    `;
    bd.query(sql, [
      dados.nome_equipe, dados.etapa_atuacao,
      dados.quantidade_profissionais, dados.custo_diario,
      dados.custo_mensal, dados.idobra ?? null, id, idConstrutora
    ], callback);
  },

  updateObra: (id, idobra, idConstrutora, callback) => {
    bd.query(
      'UPDATE cadastro_de_equipes SET idobra = ? WHERE id_cadastro_equipes = ? AND id_construtora = ?',
      [idobra, id, idConstrutora], callback
    );
  },

  delete: (id, idConstrutora, callback) => {
    bd.query(
      'DELETE FROM cadastro_de_equipes WHERE id_cadastro_equipes = ? AND id_construtora = ?',
      [id, idConstrutora], callback
    );
  }
};

module.exports = Equipe;
