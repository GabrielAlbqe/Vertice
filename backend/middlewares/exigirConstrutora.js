
const bd = require("../config/connection");

function idValido(valor) {
  const numero = Number(valor);

  return (
    Number.isSafeInteger(numero) &&
    numero > 0
  );
}

function exigirConstrutora(req, res, next) {
  const usuario = req.usuario;

  if (!usuario || !idValido(usuario.id_usuario)) {
    return res.status(401).json({
      message: "Usuário não autenticado."
    });
  }

  const sql = `
    SELECT id_usuario, idconstrutora, status
    FROM usuario
    WHERE id_usuario = ?
    LIMIT 1
  `;

  bd.query(sql, [usuario.id_usuario], (erro, registros) => {
    if (erro) {
      console.error("Erro ao verificar usuário:", erro.message);

      return res.status(500).json({
        message: "Erro ao verificar permissões."
      });
    }

    const cadastro = registros[0];

    if (!cadastro || cadastro.status !== "Ativo") {
      return res.status(403).json({
        message: "Usuário sem acesso ativo."
      });
    }

    if (
      !idValido(cadastro.idconstrutora) ||
      Number(cadastro.idconstrutora) !== Number(usuario.idconstrutora)
    ) {
      return res.status(403).json({
        message: "Construtora não autorizada. Faça login novamente se o vínculo mudou."
      });
    }

    req.idConstrutora = Number(cadastro.idconstrutora);

    return next();
  });
}

module.exports = exigirConstrutora;
