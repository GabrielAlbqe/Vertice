const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { timingSafeEqual } = require("crypto");

const Usuario = require("../models/usuarioModel");
const { dbStatus } = require("../utils/dbError");

// =====================================================
// CRIAR USUÁRIO
// =====================================================

exports.criar = async (req, res) => {
  const { senha } = req.body || {};

  if (
    typeof senha !== "string" ||
    !senha ||
    Buffer.byteLength(senha, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "Informe uma senha válida com até 72 bytes.",
    });
  }

  let senhaHash;

  try {
    senhaHash = await bcrypt.hash(
      senha,
      12
    );
  } catch {
    return res.status(500).json({
      message:
        "Erro ao proteger a senha.",
    });
  }

  const dados = {
    ...req.body,

    email:
      typeof req.body.email === "string"
        ? req.body.email
            .trim()
            .toLowerCase()
        : req.body.email,

    senha: senhaHash,

    idconstrutora:
      req.body.idconstrutora ||
      null,
  };

  Usuario.create(
    dados,
    (err, result) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error:
              err.message || err,
          });
      }

      res.status(201).json({
        message:
          "Usuário registrado com sucesso!",

        insertId:
          result.insertId,
      });
    }
  );
};

// =====================================================
// LISTAR TODOS
// =====================================================

exports.listarTodos = (
  req,
  res
) => {
  Usuario.getAll(
    (err, results) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      res.json(results);
    }
  );
};

// =====================================================
// LISTAR POR CONSTRUTORA
// =====================================================

exports.listarPorConstrutora = (
  req,
  res
) => {
  const idconstrutora =
    req.query.idconstrutora ||
    req.params.idconstrutora;

  if (!idconstrutora) {
    return Usuario.getAll(
      (err, results) => {
        if (err) {
          return res
            .status(dbStatus(err))
            .json({
              error: err.message,
            });
        }

        res.json(results);
      }
    );
  }

  Usuario.getByConstrutora(
    idconstrutora,
    (err, results) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      res.json(results);
    }
  );
};

// =====================================================
// BUSCAR POR ID
// =====================================================

exports.buscarPorId = (
  req,
  res
) => {
  Usuario.getById(
    req.params.id,
    (err, results) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      if (
        !results ||
        results.length === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Usuário não encontrado.",
          });
      }

      res.json(results[0]);
    }
  );
};

// =====================================================
// DELETAR
// =====================================================

exports.deletar = (
  req,
  res
) => {
  Usuario.delete(
    req.params.id,
    (err, result) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Usuário não encontrado.",
          });
      }

      res.json({
        message:
          "Usuário removido com sucesso!",
      });
    }
  );
};

// =====================================================
// ATUALIZAR
// =====================================================

exports.atualizar = async (
  req,
  res
) => {
  const body =
    req.body || {};

  const dados = {};

  const camposPermitidos = [
    "nome",
    "email",
    "ocupacao",
    "ambiente",
    "status",
    "idconstrutora",
  ];

  // Copia somente os campos permitidos
  camposPermitidos.forEach(
    (campo) => {
      if (
        Object.prototype
          .hasOwnProperty.call(
            body,
            campo
          )
      ) {
        dados[campo] =
          body[campo];
      }
    }
  );

  // Normaliza e-mail
  if (
    typeof dados.email ===
    "string"
  ) {
    dados.email =
      dados.email
        .trim()
        .toLowerCase();
  }

  // Permite remover construtora
  if (
    dados.idconstrutora === ""
  ) {
    dados.idconstrutora =
      null;
  }

  // ===================================================
  // SENHA OPCIONAL
  // ===================================================

  if (
    Object.prototype
      .hasOwnProperty.call(
        body,
        "senha"
      ) &&
    body.senha !== "" &&
    body.senha !== null &&
    body.senha !== undefined
  ) {
    if (
      typeof body.senha !==
        "string" ||
      Buffer.byteLength(
        body.senha,
        "utf8"
      ) > 72
    ) {
      return res
        .status(400)
        .json({
          message:
            "Informe uma senha válida com até 72 bytes.",
        });
    }

    try {
      dados.senha =
        await bcrypt.hash(
          body.senha,
          12
        );
    } catch {
      return res
        .status(500)
        .json({
          message:
            "Erro ao proteger a senha.",
        });
    }
  }

  // Nenhum campo foi enviado
  if (
    Object.keys(dados)
      .length === 0
  ) {
    return res
      .status(400)
      .json({
        message:
          "Nenhum dado foi informado para atualização.",
      });
  }

  Usuario.update(
    req.params.id,
    dados,
    (err, result) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      if (
        result.affectedRows === 0
      ) {
        return res
          .status(404)
          .json({
            message:
              "Usuário não encontrado.",
          });
      }

      res.json({
        message:
          "Usuário atualizado com sucesso!",
      });
    }
  );
};

// =====================================================
// LOGIN
// =====================================================

exports.login = (
  req,
  res
) => {
  const {
    email,
    senha,
  } = req.body || {};

  if (
    typeof email !== "string" ||
    !email.trim() ||
    typeof senha !== "string" ||
    !senha
  ) {
    return res
      .status(400)
      .json({
        message:
          "Email e senha são obrigatórios.",
      });
  }

  Usuario.buscarPorEmail(
    email
      .trim()
      .toLowerCase(),

    async (
      err,
      results
    ) => {
      if (err) {
        return res
          .status(dbStatus(err))
          .json({
            error: err.message,
          });
      }

      const registro =
        results?.[0];

      if (!registro) {
        return res
          .status(401)
          .json({
            message:
              "Credenciais inválidas ou usuário inativo.",
          });
      }

      try {
        const armazenada =
          String(
            registro.senha ||
              ""
          );

        const bcryptHash =
          /^\$2[aby]\$/.test(
            armazenada
          );

        let correta = false;

        // ===============================================
        // SENHA JÁ ESTÁ EM BCRYPT
        // ===============================================

        if (bcryptHash) {
          correta =
            await bcrypt.compare(
              senha,
              armazenada
            );
        }

        // ===============================================
        // SENHA LEGADA
        // ===============================================

        else {
          const recebida =
            Buffer.from(senha);

          const legada =
            Buffer.from(
              armazenada
            );

          correta =
            recebida.length ===
              legada.length &&
            timingSafeEqual(
              recebida,
              legada
            );
        }

        if (!correta) {
          return res
            .status(401)
            .json({
              message:
                "Credenciais inválidas ou usuário inativo.",
            });
        }

        // ===============================================
        // MIGRAR SENHA ANTIGA PARA BCRYPT
        // ===============================================

        if (!bcryptHash) {
          const novaSenhaHash =
            await bcrypt.hash(
              senha,
              12
            );

          await new Promise(
            (
              resolve,
              reject
            ) => {
              Usuario.atualizarSenha(
                registro.id_usuario,
                novaSenhaHash,
                (
                  erroMigracao
                ) => {
                  if (
                    erroMigracao
                  ) {
                    return reject(
                      erroMigracao
                    );
                  }

                  resolve();
                }
              );
            }
          );
        }

        // ===============================================
        // NÃO DEVOLVER SENHA PARA O FRONTEND
        // ===============================================

        const {
          senha: senhaRemovida,
          ...usuario
        } = registro;

        // ===============================================
        // JWT SECRET
        // ===============================================

        const jwtSecret =
          process.env.JWT_SECRET;

        if (!jwtSecret) {
          console.error(
            "JWT_SECRET não configurado."
          );

          return res
            .status(500)
            .json({
              message:
                "Erro de configuração do servidor.",
            });
        }

        // ===============================================
        // GERAR TOKEN
        // ===============================================

        const token =
          jwt.sign(
            {
              id_usuario:
                usuario.id_usuario,

              idconstrutora:
                usuario.idconstrutora,
            },

            jwtSecret,

            {
              algorithm:
                "HS256",

              subject:
                String(
                  usuario.id_usuario
                ),

              expiresIn:
                "8h",
            }
          );

        return res.json({
          message:
            "Login realizado com sucesso!",

          usuario,

          token,
        });
      } catch (erro) {
        console.error(
          "Erro no login:",
          erro
        );

        return res
          .status(500)
          .json({
            message:
              "Erro ao realizar login.",
          });
      }
    }
  );
};