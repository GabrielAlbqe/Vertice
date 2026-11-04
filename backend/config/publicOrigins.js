function publicOrigin(value,key){
  if(!value)throw Error(`Configure ${key}.`);
  let url;try{url=new URL(value);}catch{throw Error(`${key} inválida.`);}
  if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||url.pathname!=='/'||/^(localhost$|127\.|0\.|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|\[|[^.]+$)/i.test(url.hostname)||url.hostname.endsWith('.localhost')||url.hostname.endsWith('.local'))throw Error(`${key} exige origem pública HTTPS, sem caminho ou credenciais.`);
  return url.origin;
}
function publicOrigins(env){return {frontend:publicOrigin(env.PUBLIC_FRONTEND_URL,'PUBLIC_FRONTEND_URL'),api:publicOrigin(env.PUBLIC_API_URL,'PUBLIC_API_URL')};}
module.exports={publicOrigin,publicOrigins};
