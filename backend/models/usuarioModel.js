const bd = require(
  "../config/scopedConnection"
);

// Não podemos criar UNIQUE(email) sem tratar os duplicados legados autorizadamente.
// Serializa os novos e-mails e as edições, inclusive entre construtoras, preservando os existentes.
async function emailWrite(sql,values,email,excludeId,callback){
  let connection,locked=false,result,error;
  try{
    connection=await require('../config/operacional').getConnection();
    const [lock]=await connection.query("SELECT GET_LOCK('vertice_usuario_email',10) acquired");
    if(lock[0].acquired!==1)throw Object.assign(Error('Cadastro ocupado'),{code:'ER_LOCK_WAIT_TIMEOUT'});
    locked=true;await connection.beginTransaction();
    let unchanged=false;
    if(excludeId){
      const current=bd.prepare('SELECT email=? unchanged FROM usuario WHERE id_usuario=?',[email,excludeId]);
      const [rows]=await connection.query(current.sql,current.values);unchanged=Boolean(rows[0]?.unchanged);
    }
    if(!unchanged){
      const [existing]=await connection.query('SELECT id_usuario FROM usuario WHERE email=? AND id_usuario<>? LIMIT 1',[email,excludeId||0]);
      if(existing.length)throw Object.assign(Error('Dados duplicados'),{code:'ER_DUP_ENTRY'});
    }
    const prepared=bd.prepare(sql,values);
    [result]=await connection.query(prepared.sql,prepared.values);
      const audit=require('../utils/auditoria'),actor=bd.context.getStore();
      if(actor&&await audit.disponivel(connection))await audit.registrarLegado(connection,actor,sql,result);
      await connection.commit();
  }catch(err){error=err;if(connection)try{await connection.rollback();}catch{}}
  finally{if(connection){try{if(locked)await connection.query("SELECT RELEASE_LOCK('vertice_usuario_email')");}catch{connection.destroy();}connection.release();}}
  callback(error,result);
}

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

    emailWrite(
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

      data.email, null, callback
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

    if(data.email!==undefined)return emailWrite(update,valores,data.email,id,callback);
    bd.query(update,valores,callback);
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
      LIMIT 2
    `;

    bd.query(
      select,
      [email],
      callback
    );
  },
};

module.exports = Usuario;
