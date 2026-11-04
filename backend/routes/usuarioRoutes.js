const express = require("express");
const router = express.Router();
const usuarioController = require("../controllers/usuarioController");

// Endpoints da API para controle de Usuários
router.post("/login", usuarioController.login); // Rota de Login
router.post('/logout',require('../utils/operacional').wrap(async(req,res)=>{
  const sessions=require('../security/sessions');await sessions.revoke(req.authToken,req.usuario);
  res.clearCookie(sessions.cookieName(),{...sessions.cookieOptions(),maxAge:undefined});res.json({message:'Sessão encerrada.'});
}));
router.get('/session',require('../utils/operacional').wrap(async(req,res)=>{
  const sessions=require('../security/sessions');res.json({id:req.usuario.jti,expiresAt:(req.usuario.exp||req.usuario.iat+8*3600)*1000,csrf:sessions.csrf(req.usuario.jti)});
}));
router.post('/reset-password',require('../utils/operacional').wrap(async(req,res)=>{
  const id_usuario=await require('../security/passwordReset').resetPassword(require('../config/operacional'),req.body?.ticket,req.body?.senha);
  res.json({message:'Senha redefinida. Entre novamente.',id_usuario});
}));
router.get("/", usuarioController.listarPorConstrutora);
router.get("/:id", usuarioController.buscarPorId);
router.delete("/del/:id", usuarioController.deletar);
router.post("/insert", usuarioController.criar);
router.put("/insert/:id", usuarioController.atualizar);

module.exports = router;
