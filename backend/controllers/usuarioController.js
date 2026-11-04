const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { timingSafeEqual } = require("crypto");

const Usuario = require("../models/usuarioModel");
const { dbStatus, safeDbMessage } = require("../utils/dbError");
function validProfile(body,creating=false){
  if((creating||body.nome!==undefined)&&(typeof body.nome!=='string'||!body.nome.trim()||body.nome.length>150))return false;
  if((creating||body.email!==undefined)&&(typeof body.email!=='string'||body.email.length>191||!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email.trim())))return false;
  if(body.ocupacao!=null&&(typeof body.ocupacao!=='string'||body.ocupacao.length>100))return false;
  if(body.ambiente!=null&&!['Escritório','Canteiro'].includes(body.ambiente))return false;
  if(body.status!==undefined&&!['Ativo','Inativo'].includes(body.status))return false;
  return true;
}

// =====================================================
// CRIAR USUÁRIO
// =====================================================

exports.criar = async (req, res) => {
  req.body ||= {};
  const { senha } = req.body || {};
  // O esquema exige uma construtora. Um visitante não pode provar associação apenas enviando seu ID.
  if(!req.acesso)return res.status(403).json({message:'A associação a uma construtora e a definição de permissões exigem cadastro pelo Escritório.'});
  if(!validProfile(req.body,true))return res.status(400).json({error:safeDbMessage({code:'ER_BAD_NULL_ERROR'})});

  if (
    typeof senha !== "string" ||
    senha.length < 10 ||
    Buffer.byteLength(senha, "utf8") > 72
  ) {
    return res.status(400).json({
      message:
        "Informe uma senha com pelo menos 10 caracteres e até 72 bytes.",
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
      (req.acesso ? req.acesso.idconstrutora : null) ||
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
              safeDbMessage(err) || err,
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
            error: safeDbMessage(err),
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
              error: safeDbMessage(err),
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
            error: safeDbMessage(err),
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
            error: safeDbMessage(err),
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
            error: safeDbMessage(err),
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
  if(!validProfile(body))return res.status(400).json({error:safeDbMessage({code:'ER_BAD_NULL_ERROR'})});

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
      body.senha.length < 10 ||
      Buffer.byteLength(
        body.senha,
        "utf8"
      ) > 72
    ) {
      return res
        .status(400)
        .json({
          message:
        "Informe uma senha com pelo menos 10 caracteres e até 72 bytes.",
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
            error: safeDbMessage(err),
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

exports.login = async(req,res)=>{
  const {email,senha,id_usuario}=req.body||{};
  if(typeof email!=='string'||!email.trim()||email.length>191||typeof senha!=='string'||!senha||Buffer.byteLength(senha)>72||id_usuario!==undefined&&(!Number.isSafeInteger(Number(id_usuario))||Number(id_usuario)<=0))return res.status(400).json({message:'Email e senha validos sao obrigatorios.'});
  try{
    const [rows]=await require('../config/operacional').query("SELECT id_usuario,nome,email,senha,ocupacao,ambiente,status,data_cadastro,idconstrutora FROM usuario WHERE email=? AND status='Ativo'"+(id_usuario!==undefined?' AND id_usuario=?':'')+' LIMIT 2',[email.trim().toLowerCase(),...(id_usuario!==undefined?[Number(id_usuario)]:[])]);
    const row=rows.length===1?rows[0]:null;
    const validHash=row&&require('../security/passwordReset').isHash(row.senha);
    const correct=await bcrypt.compare(senha,validHash?row.senha:'$2b$12$viZNCEsMphNejGYDXDiQouJGoIVT9LSKDjQ9Oit9OGeFIogHeepDy');
    if(!validHash||!correct)return res.status(401).json({message:'Credenciais invalidas ou usuario inativo.'});
    const secret=process.env.JWT_SECRET;if(!secret)throw Error('JWT_NOT_CONFIGURED');
    const claims={id_usuario:row.id_usuario,idconstrutora:row.idconstrutora,ver:require('../utils/sessionVersion')(row),jti:require('crypto').randomUUID(),purpose:'session'};
    const token=jwt.sign(claims,secret,{algorithm:'HS256',subject:String(row.id_usuario),expiresIn:'8h'}),payload=jwt.decode(token);
    const sessions=require('../security/sessions');await sessions.issue(token,payload);
    const {senha:removed,...usuario}=row;
    if(req.get('X-Session-Mode')==='cookie'){
      res.cookie(sessions.cookieName(),token,sessions.cookieOptions());
      return res.json({message:'Login realizado com sucesso!',usuario,session:{id:claims.jti,expiresAt:payload.exp*1000,csrf:sessions.csrf(claims.jti)}});
    }
    return res.json({message:'Login realizado com sucesso!',usuario,token});
  }catch(error){console.error('Login failure',{code:error.code||'LOGIN_FAILURE'});return res.status(500).json({message:'Erro ao realizar login.'});}
};
