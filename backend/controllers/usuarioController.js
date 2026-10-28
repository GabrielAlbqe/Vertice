const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { timingSafeEqual } = require('node:crypto');
const Usuario = require('../models/usuarioModel');
const { validar } = require('../utils/validar');
const { dbStatus } = require('../utils/dbError');
const passwordValid = value => typeof value === 'string' && value.length >= 8 && Buffer.byteLength(value) <= 72;
const dbError = (res,err) => res.status(dbStatus(err)).json({ message: 'Não foi possível processar o usuário.' });
exports.criar = async (req,res) => {
  const body = req.body || {};
  if(!passwordValid(body.senha))return res.status(400).json({message:'Senha deve ter pelo menos 8 caracteres e até 72 bytes.'});
  const error=validar('usuario',body,true);
  if(error)return res.status(400).json({message:error});
  try {
    const data={...body,email:body.email.trim().toLowerCase(),senha:await bcrypt.hash(body.senha,12)};
    if(!req.usuarioAtual){data.status='Inativo';data.idconstrutora=null;data.ocupacao=null;data.ambiente=null;}
    Usuario.create(data,(err,result)=>{
      if(err)return dbError(res,err);
      res.status(201).json({message:req.usuarioAtual?'Usuário registrado com sucesso!':'Cadastro recebido. Aguarde a aprovação da gerência.',insertId:result.insertId});
    });
  }catch(err){return dbError(res,err);}
};
exports.listarTodos = (req,res) => Usuario.getByConstrutora(req.idConstrutora,(err,rows)=>err?dbError(res,err):res.json(rows));
exports.listarPorConstrutora = exports.listarTodos;
exports.buscarPorId = (req,res) => Usuario.getById(req.params.id,(err,rows)=>{
  if(err)return dbError(res,err);
  if(!rows.length)return res.status(404).json({message:'Usuário não encontrado.'});
  res.json(rows[0]);
});
exports.deletar = (req,res) => Usuario.delete(req.params.id,(err,result)=>{
  if(err)return dbError(res,err);
  if(!result.affectedRows)return res.status(404).json({message:'Usuário não encontrado.'});
  res.json({message:'Usuário desativado com sucesso!'});
});
exports.atualizar = async (req,res) => {
  const body=req.body || {}, data={};
  for(const key of ['nome','email','ocupacao','ambiente','status','idconstrutora'])if(Object.hasOwn(body,key))data[key]=body[key];
  if(typeof data.email==='string')data.email=data.email.trim().toLowerCase();
  if(Object.hasOwn(body,'senha') && body.senha!=='') {
    if(!passwordValid(body.senha))return res.status(400).json({message:'Senha deve ter pelo menos 8 caracteres e até 72 bytes.'});
    data.senha=await bcrypt.hash(body.senha,12);
  }
  if(!Object.keys(data).length)return res.status(400).json({message:'Informe dados para atualizar.'});
  Usuario.update(req.params.id,data,(err,result)=>{
    if(err)return dbError(res,err);
    if(!result.affectedRows)return res.status(404).json({message:'Usuário não encontrado.'});
    res.json({message:'Usuário atualizado com sucesso!'});
  });
};
exports.login = (req,res) => {
  const {email,senha}=req.body || {};
  if(typeof email!=='string'||!email.trim()||typeof senha!=='string'||!senha||Buffer.byteLength(senha)>72)return res.status(400).json({message:'E-mail e senha válidos são obrigatórios.'});
  Usuario.buscarPorEmail(email.trim().toLowerCase(),async(err,rows)=>{
    if(err)return dbError(res,err);
    const user=rows[0];
    const denied=()=>res.status(401).json({message:'Credenciais inválidas ou usuário inativo.'});
    if(!user || user.status!=='Ativo')return denied();
    try {
      const stored=String(user.senha || ''), hashed=/^\$2[aby]\$/.test(stored);
      const a=Buffer.from(senha),b=Buffer.from(stored);
      const correct=hashed?await bcrypt.compare(senha,stored):a.length===b.length&&timingSafeEqual(a,b);
      if(!correct)return denied();
      if(!hashed){const hash=await bcrypt.hash(senha,12);await new Promise((resolve,reject)=>Usuario.atualizarSenha(user.id_usuario,hash,e=>e?reject(e):resolve()));}
      const {senha:removed,...usuario}=user;
      const token=jwt.sign({id_usuario:user.id_usuario,idconstrutora:user.idconstrutora},process.env.JWT_SECRET,{algorithm:'HS256',subject:String(user.id_usuario),expiresIn:'8h'});
      res.json({message:'Login realizado com sucesso!',usuario,token});
    }catch(err){dbError(res,err);}
  });
};
