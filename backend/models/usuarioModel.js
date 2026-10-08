const bd = require(
  "../config/connection"
);

const Usuario = {
  // ===================================================
  // LISTAR TODOS
  // ===================================================

  getAll: (callback) => {
    const select = `
      SELECT
        id_usuario,
        nome,
        email,
        ocupacao,
        ambiente,
        status,
        data_cadastro,
        idconstrutora
      FROM usuario
    `;

    bd.query(
      select,
      callback
    );
  },

  // ===================================================
  // LISTAR POR CONSTRUTORA
  // ===================================================

  getByConstrutora: (
    idconstrutora,
    callback
  ) => {
    const select = `
      SELECT
        id_usuario,
        nome,
        email,
        ocupacao,
        ambiente,
        status,
        data_cadastro,
        idconstrutora
      FROM usuario
      WHERE idconstrutora = ?
    `;

    bd.query(
      select,
      [idconstrutora],
      callback
    );
  },

  // ===================================================
  // BUSCAR POR ID
  // ===================================================

  getById: (
    id,
    callback
  ) => {
    const select = `
      SELECT
        id_usuario,
        nome,
        email,
        ocupacao,
        ambiente,
        status,
        data_cadastro,
        idconstrutora
      FROM usuario
      WHERE id_usuario = ?
    `;

    bd.query(
      select,
      [id],
      callback
    );
  },

  // ===================================================
  // DELETAR
  // ===================================================

  delete: (
    id,
    callback
  ) => {
    const del = `
      DELETE FROM usuario
      WHERE id_usuario = ?
    `;

    bd.query(
      del,
      [id],
      callback
    );
  },

  // ===================================================
  // CRIAR
  // ===================================================

  create: (
    data,
    callback
  ) => {
    const insert = `
      INSERT INTO usuario
      (
        nome,
        email,
        senha,
        ocupacao,
        ambiente,
        status,
        idconstrutora
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `;

    bd.query(
      insert,
      [
        data.nome,
        data.email,
        data.senha,

        data.ocupacao ||
          null,

        data.ambiente ||
          null,

        data.status ||
          "Ativo",

        data.idconstrutora ||
          null,
      ],

      callback
    );
  },

  // ===================================================
  // ATUALIZAÇÃO PARCIAL
  // ===================================================

  update: (
    id,
    data,
    callback
  ) => {
    const camposPermitidos = [
      "nome",
      "email",
      "senha",
      "ocupacao",
      "ambiente",
      "status",
      "idconstrutora",
    ];

    const campos = [];
    const valores = [];

    camposPermitidos.forEach(
      (campo) => {
        if (
          Object.prototype
            .hasOwnProperty.call(
              data,
              campo
            )
        ) {
          campos.push(
            `${campo} = ?`
          );

          valores.push(
            data[campo]
          );
        }
      }
    );

    if (
      campos.length === 0
    ) {
      return callback(
        new Error(
          "Nenhum campo informado para atualização."
        )
      );
    }

    const update = `
      UPDATE usuario
      SET ${campos.join(", ")}
      WHERE id_usuario = ?
    `;

    valores.push(id);

    bd.query(
      update,
      valores,
      callback
    );
  },

  // ===================================================
  // ATUALIZAR SOMENTE A SENHA
  // Usado para migrar senhas antigas para bcrypt
  // ===================================================

  atualizarSenha: (
    id,
    senhaHash,
    callback
  ) => {
    const update = `
      UPDATE usuario
      SET senha = ?
      WHERE id_usuario = ?
    `;

    bd.query(
      update,
      [
        senhaHash,
        id,
      ],
      callback
    );
  },

  // ===================================================
  // LOGIN
  // ===================================================

  buscarPorEmail: (
    email,
    callback
  ) => {
    const select = `
      SELECT
        id_usuario,
        nome,
        email,
        senha,
        ocupacao,
        ambiente,
        status,
        data_cadastro,
        idconstrutora
      FROM usuario
      WHERE email = ?
        AND status = 'Ativo'
      LIMIT 1
    `;

    bd.query(
      select,
      [email],
      callback
    );
  },
};

module.exports = Usuario;