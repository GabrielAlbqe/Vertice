const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { randomBytes, timingSafeEqual } = require("crypto");
// Sem JWT_SECRET, tokens locais expiram tambem ao reiniciar o processo.
const jwtSecret = process.env.JWT_SECRET || randomBytes(32).toString("hex");
const Usuario = require("../models/usuarioModel");
const { dbStatus } = require("../utils/dbError");

exports.criar = async (req, res) => {
  if (typeof req.body?.senha !== "string" || !req.body.senha || Buffer.byteLength(req.body.senha, "utf8") > 72) {
    return res.status(400).json({ message: "Informe uma senha com ate 72 bytes." });
  }
  let senhaHash;
  try { senhaHash = await bcrypt.hash(req.body.senha, 12); }
  catch { return res.status(500).json({ message: "Erro ao proteger a senha." }); }
  Usuario.create({ ...req.body, senha: senhaHash }, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message || err });
    
    res.status(201).json({
      message: "Usuário registrado com sucesso!",
      insertId: result.insertId
    });
  });
};

exports.listarTodos = (req, res) => {
  Usuario.getAll((err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    res.json(results);
  });
};

exports.listarPorConstrutora = (req, res) => {
  const idconstrutora = req.query.idconstrutora || req.params.idconstrutora;

  if (!idconstrutora) {
    return Usuario.getAll((err, results) => {
      if (err) return res.status(dbStatus(err)).json({ error: err.message });
      res.json(results);
    });
  }

  Usuario.getByConstrutora(idconstrutora, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    res.json(results);
  });
};

exports.buscarPorId = (req, res) => {
  Usuario.getById(req.params.id, (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    if (!results || results.length === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json(results[0]);
  });
};

exports.deletar = (req, res) => {
  Usuario.delete(req.params.id, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json({ message: "Usuário removido com sucesso!" });
  });
};

exports.atualizar = async (req, res) => {
  if (typeof req.body?.senha !== "string" || !req.body.senha || Buffer.byteLength(req.body.senha, "utf8") > 72) {
    return res.status(400).json({ message: "Informe uma senha com ate 72 bytes." });
  }
  let senhaHash;
  try { senhaHash = await bcrypt.hash(req.body.senha, 12); }
  catch { return res.status(500).json({ message: "Erro ao proteger a senha." }); }
  Usuario.update(req.params.id, { ...req.body, senha: senhaHash }, (err, result) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Usuário não encontrado." });
    res.json({ message: "Usuário atualizado com sucesso!" });
  });
};

// Senhas legadas continuam aceitas sem migracao automatica no login.
exports.login = (req, res) => {
  const { email, senha } = req.body || {};
  if (typeof email !== "string" || !email.trim() || typeof senha !== "string" || !senha) {
    return res.status(400).json({ message: "Email e senha sao obrigatorios." });
  }
  Usuario.buscarPorEmail(email.trim(), async (err, results) => {
    if (err) return res.status(dbStatus(err)).json({ error: err.message });
    const registro = results?.[0];
    if (!registro) return res.status(401).json({ message: "Credenciais invalidas ou usuario inativo." });
    try {
      const armazenada = String(registro.senha || "");
      const bcryptHash = /^\$2[aby]\$/.test(armazenada);
      const recebida = Buffer.from(senha);
      const legada = Buffer.from(armazenada);
      const correta = bcryptHash
        ? await bcrypt.compare(senha, armazenada)
        : recebida.length === legada.length && timingSafeEqual(recebida, legada);
      if (!correta) return res.status(401).json({ message: "Credenciais invalidas ou usuario inativo." });
      const { senha: removida, ...usuario } = registro;
      const token = jwt.sign({ id_usuario: usuario.id_usuario, idconstrutora: usuario.idconstrutora }, jwtSecret, {
        algorithm: "HS256", subject: String(usuario.id_usuario), expiresIn: "8h"
      });
      res.json({ message: "Login realizado com sucesso!", usuario, token });
    } catch {
      res.status(500).json({ message: "Erro ao realizar login." });
    }
  });
};