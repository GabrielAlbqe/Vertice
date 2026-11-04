const jwt = require("jsonwebtoken");

async function autenticar(req, res, next) {
  const sessions=require('../security/sessions');
  const authorization =
    req.headers.authorization || "";

  let [tipo, token, extra] =
    authorization.split(" ");
  const cookie=!authorization && sessions.readCookie(req);
  if(cookie){tipo='Bearer';token=cookie;}

  if (
    tipo !== "Bearer" ||
    !token || extra
  ) {
    return res.status(401).json({
      message:
        "Token de autenticação não informado.",
    });
  }

  const secret =
    process.env.JWT_SECRET;

  if (!secret) {
    console.error(
      "JWT_SECRET não configurado."
    );

    return res.status(500).json({
      message:
        "Erro de configuração do servidor.",
    });
  }

  try {
    const usuario =
      jwt.verify(token, secret, { algorithms: ['HS256'], maxAge:'8h' });

    if(!Number.isSafeInteger(usuario.id_usuario)||usuario.id_usuario<=0)throw Error('Identidade inválida');
    if(usuario.purpose && usuario.purpose!=='session')throw Error('Token não é de sessão');
    if(process.env.NODE_ENV!=='test' && (!Number.isFinite(usuario.exp)||typeof usuario.ver!=='string'||!usuario.jti||usuario.purpose!=='session'))throw Error('Sessão antiga');
    await sessions.validate(token,usuario);
    if(cookie && !['GET','HEAD','OPTIONS'].includes(req.method)){
      if(!req.headers.origin || !sessions.safeEqual(req.get('X-CSRF-Token'),sessions.csrf(usuario.jti)))return res.status(403).json({message:'Verificação CSRF inválida.'});
    }
    if(usuario.ver!==undefined){
      const [rows]=await require('../config/operacional').query('SELECT id_usuario,senha,idconstrutora,ambiente,status FROM usuario WHERE id_usuario=?',[usuario.id_usuario]);
      const expected=rows[0] && require('../utils/sessionVersion')(rows[0]);
      if(!expected || rows[0].status!=='Ativo' || typeof usuario.ver!=='string' || !/^[a-f0-9]{64}$/.test(usuario.ver) || !require('crypto').timingSafeEqual(Buffer.from(expected),Buffer.from(usuario.ver)))throw Error('Sessão revogada');
    }

    req.usuario = usuario;
    req.authToken=token;
    req.cookieSession=Boolean(cookie);

    return next();
  } catch (err) {
    if(err.code)return next(err);
    return res.status(401).json({
      message:
        "Token inválido ou expirado.",
    });
  }
}

module.exports = autenticar;
