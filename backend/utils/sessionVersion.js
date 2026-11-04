const {createHmac}=require('crypto');
// Nenhum segredo ou hash de senha é colocado no JWT. Mudanças de acesso invalidam tokens emitidos.
module.exports=user=>createHmac('sha256',process.env.JWT_SECRET)
  .update(JSON.stringify([user.id_usuario,user.senha,user.idconstrutora,user.ambiente,user.status]))
  .digest('hex');
