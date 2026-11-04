const fs=require('fs'),path=require('path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
function databaseOptions(env=process.env){
  for(const key of ['DB_HOST','DB_PORT','DB_USER','DB_PASSWORD','DB_NAME'])if(env[key]===undefined || (key!=='DB_PASSWORD' && !env[key]))throw Error(`Variável de ambiente obrigatória: ${key}`);
  const port=Number(env.DB_PORT);if(!Number.isInteger(port)||port<1||port>65535)throw Error('DB_PORT inválida.');
  if(env.NODE_ENV==='test'&&!/^vertice_test_[a-z0-9_]+$/.test(env.DB_NAME))throw Error('Testes exigem um banco isolado com prefixo vertice_test_.');
  const ssl=env.DB_SSL==='true';
  if(env.NODE_ENV==='production'&&!ssl)throw Error('Produção exige DB_SSL=true com verificação do certificado.');
  if(env.NODE_ENV==='production'&&require('net').isIP(env.DB_HOST))throw Error('Produção exige hostname DNS do MySQL para validar a identidade TLS.');
  if(env.NODE_ENV==='production' && (/^root(?:@|$)/i.test(env.DB_USER.trim()) || !env.DB_PASSWORD))throw Error('Produção exige usuário MySQL dedicado e senha não vazia.');
  const options={host:env.DB_HOST,port,user:env.DB_USER,password:env.DB_PASSWORD,database:env.DB_NAME,connectTimeout:10000,enableKeepAlive:true};
  if(ssl){options.ssl={rejectUnauthorized:true,verifyIdentity:true,minVersion:'TLSv1.2'};if(env.DB_SSL_CA_BASE64)options.ssl.ca=Buffer.from(env.DB_SSL_CA_BASE64,'base64').toString('utf8');else if(env.DB_SSL_CA_PATH)options.ssl.ca=fs.readFileSync(env.DB_SSL_CA_PATH,'utf8');}
  return options;
}
function productionOptions(env=process.env){
  const domains=env.NODE_ENV==='production'?require('./publicOrigins').publicOrigins(env):null;
  const origins=(env.CORS_ORIGINS||domains?.frontend||'').split(',').map(x=>x.trim()).filter(Boolean);
  for(const origin of origins){const u=new URL(origin);if(u.origin!==origin||!['http:','https:'].includes(u.protocol))throw Error('CORS_ORIGINS exige origens exatas, sem caminhos.');if(env.NODE_ENV==='production'&&u.protocol!=='https:')throw Error('Produção exige origens HTTPS.');}
  if(env.REGISTRATION_MODE&&!['office','public'].includes(env.REGISTRATION_MODE))throw Error('REGISTRATION_MODE inválido.');
  if(env.SECURITY_STORE&&!['mysql','memory'].includes(env.SECURITY_STORE))throw Error('SECURITY_STORE inválido.');
  if(env.SESSION_SAME_SITE&&!['lax','strict','none'].includes(env.SESSION_SAME_SITE))throw Error('SESSION_SAME_SITE inválido.');
  if(env.SESSION_SAME_SITE==='none'&&env.NODE_ENV!=='production')throw Error('SameSite=None exige HTTPS em produção.');
  if(env.NODE_ENV==='production'){
    if(!env.ORIGIN_SECRET||Buffer.byteLength(env.ORIGIN_SECRET)<32||new Set(env.ORIGIN_SECRET).size<8)throw Error('Produção exige ORIGIN_SECRET forte para autenticar o proxy.');
    if(!origins.includes(domains.frontend))throw Error('CORS_ORIGINS deve incluir PUBLIC_FRONTEND_URL.');
    if(env.PASSWORD_RESET_BASE_URL && env.PASSWORD_RESET_BASE_URL!==domains.frontend+'/login')throw Error('PASSWORD_RESET_BASE_URL deve usar o frontend público e /login.');
    if(env.SECURITY_STORE!=='mysql')throw Error('Produção exige SECURITY_STORE=mysql para revogação e rate limiting compartilhados.');
    if(!origins.length)throw Error('Configure CORS_ORIGINS em produção.');
    if(!env.JWT_SECRET || Buffer.byteLength(env.JWT_SECRET)<32 || new Set(env.JWT_SECRET).size<8 || /configure|change.?me|example|sua.?chave/i.test(env.JWT_SECRET))throw Error('Produção exige JWT_SECRET forte e aleatório com pelo menos 32 bytes.');
    if(env.REGISTRATION_MODE!=='office')throw Error('Produção exige aprovação e configuração explícita de REGISTRATION_MODE=office.');
    if(env.PHOTO_STORAGE_DRIVER!=='s3'||!env.S3_BUCKET||!env.S3_REGION)throw Error('Produção exige armazenamento privado S3 configurado.');
  }
  const proxy=Number(env.TRUST_PROXY_HOPS||0);if(!Number.isInteger(proxy)||proxy<0||proxy>5)throw Error('TRUST_PROXY_HOPS inválido.');
  return {origins,proxy};
}
module.exports={databaseOptions,productionOptions};
