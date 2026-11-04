const crypto=require('crypto');
const {getStore,digest}=require('./store');
function cookieName(){return process.env.NODE_ENV==='production'?'__Host-vertice_session':'vertice_session';}
function cookieOptions(){return {httpOnly:true,secure:process.env.NODE_ENV==='production',sameSite:process.env.SESSION_SAME_SITE||'lax',path:'/',maxAge:8*3600000};}
function readCookie(req){const parts=(req.headers.cookie||'').split(';').map(x=>x.trim());const found=parts.filter(x=>x.startsWith(cookieName()+'='));if(found.length!==1)return null;try{return decodeURIComponent(found[0].slice(cookieName().length+1));}catch{return null;}}
function csrf(jti){return crypto.createHmac('sha256',process.env.JWT_SECRET).update('csrf:'+jti).digest('hex');}
function safeEqual(a,b){if(typeof a!=='string'||typeof b!=='string')return false;const left=Buffer.from(a),right=Buffer.from(b);return left.length===right.length&&crypto.timingSafeEqual(left,right);}
async function issue(token,payload){await getStore().set('session:'+payload.jti,{user:payload.id_usuario,revoked:false},payload.exp*1000);}
async function validate(token,payload){
  if(payload.jti){const state=await getStore().get('session:'+payload.jti);if(!state||state.revoked||state.user!==payload.id_usuario)throw Error('SESSION_REVOKED');}
  else if(process.env.NODE_ENV==='production')throw Error('SESSION_UNTRACKED');
  else if(await getStore().get('revoked:'+digest(token)))throw Error('SESSION_REVOKED');
}
async function revoke(token,payload){if(payload.jti)await getStore().set('session:'+payload.jti,{user:payload.id_usuario,revoked:true},payload.exp*1000);else await getStore().set('revoked:'+digest(token),true,(payload.exp||payload.iat+8*3600)*1000);}
module.exports={cookieName,cookieOptions,readCookie,csrf,safeEqual,issue,validate,revoke};
