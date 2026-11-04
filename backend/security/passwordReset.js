const crypto=require('crypto'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken');
const version=require('../utils/sessionVersion');
const isHash=value=>/^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/.test(String(value));
async function preparePasswordResets(c,selectedIds){
  // Não lê nem tenta recuperar senhas legadas.
  if(selectedIds!==undefined&&(!Array.isArray(selectedIds)||!selectedIds.length||selectedIds.length>100||selectedIds.some(id=>!Number.isSafeInteger(id)||id<=0)||new Set(selectedIds).size!==selectedIds.length))throw Error('RESET_USERS_INVALID');
  const filter=selectedIds?'id_usuario IN ('+selectedIds.map(()=>'?').join(',')+')':"senha NOT REGEXP '^[$]2[aby][$][0-9]{2}[$][./A-Za-z0-9]{53}$'";
  const [rows]=await c.query('SELECT id_usuario,idconstrutora,ambiente,status FROM usuario WHERE '+filter+' FOR UPDATE',selectedIds||[]);
  if(selectedIds&&rows.length!==selectedIds.length)throw Error('RESET_USERS_MISSING');
  const result=[];
  for(const row of rows){
    row.senha=await bcrypt.hash(crypto.randomBytes(48).toString('base64'),12);
    await c.query('UPDATE usuario SET senha=? WHERE id_usuario=?',[row.senha,row.id_usuario]);
    const ticket=jwt.sign({id_usuario:row.id_usuario,ver:version(row),purpose:'password-reset'},process.env.JWT_SECRET,{algorithm:'HS256',audience:'vertice-password-reset',expiresIn:'30m'});
    result.push({id_usuario:row.id_usuario,ticket});
  }
  return result;
}
async function resetPassword(pool,ticket,password){
  if(typeof ticket!=='string'||ticket.length>2048||typeof password!=='string'||password.length<12||Buffer.byteLength(password)>72)throw Object.assign(Error('Informe o link válido e uma senha de 12 caracteres ou mais, até 72 bytes.'),{status:400});
  let claims;
  try{claims=jwt.verify(ticket,process.env.JWT_SECRET,{algorithms:['HS256'],audience:'vertice-password-reset',maxAge:'30m'});if(claims.purpose!=='password-reset'||!Number.isSafeInteger(claims.id_usuario))throw Error();}
  catch{throw Object.assign(Error('Link de redefinição inválido ou expirado.'),{status:400});}
  const c=await pool.getConnection();
  try{await c.beginTransaction();const [rows]=await c.query('SELECT id_usuario,senha,idconstrutora,ambiente,status FROM usuario WHERE id_usuario=? FOR UPDATE',[claims.id_usuario]);
    if(!rows[0]||!require('./sessions').safeEqual(version(rows[0]),claims.ver))throw Object.assign(Error('Link de redefinição inválido ou expirado.'),{status:400});
    await c.query('UPDATE usuario SET senha=? WHERE id_usuario=?',[await bcrypt.hash(password,12),claims.id_usuario]);await c.commit();return claims.id_usuario;
  }catch(e){await c.rollback();throw e;}finally{c.release();}
}
module.exports={preparePasswordResets,resetPassword,isHash};
