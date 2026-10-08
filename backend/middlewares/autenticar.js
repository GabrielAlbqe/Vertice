const jwt = require("jsonwebtoken");

function autenticar(req, res, next) {
  const authorization =
    req.headers.authorization || "";

  const [tipo, token] =
    authorization.split(" ");

  if (
    tipo !== "Bearer" ||
    !token
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
      jwt.verify(token, secret);

    req.usuario = usuario;

    return next();
  } catch {
    return res.status(401).json({
      message:
        "Token inválido ou expirado.",
    });
  }
}

module.exports = autenticar;