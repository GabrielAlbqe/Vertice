const crypto=require('crypto');
const {productionOptions}=require('../config/environment');
function configure(app,env=process.env){
  const {origins,proxy}=productionOptions(env);
  app.disable('x-powered-by');app.set('trust proxy',proxy);
  app.use((req,res,next)=>{
    const requestId=crypto.randomUUID(),start=process.hrtime.bigint();req.requestId=requestId;
    res.set({'X-Request-ID':requestId,'X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer','Cache-Control':'no-store','Cross-Origin-Resource-Policy':'same-origin','Content-Security-Policy':"default-src 'none'; frame-ancestors 'none'; base-uri 'none'"});
    if(env.NODE_ENV==='production')res.set('Strict-Transport-Security','max-age=31536000');
    res.on('finish',()=>{if(env.NODE_ENV!=='test')console.log(JSON.stringify({event:'http',requestId,method:req.method,path:req.path,status:res.statusCode,durationMs:Number(process.hrtime.bigint()-start)/1e6}));});
    if(env.NODE_ENV==='production' && !req.secure && !(req.method==='GET' && req.path==='/api/health'))return res.status(426).json({message:'HTTPS obrigatório.'});
    if(env.NODE_ENV==='production' && req.path.startsWith('/api') && !(req.method==='GET'&&req.path==='/api/health')){
      const supplied=Buffer.from(req.get('x-origin-secret')||''),expected=Buffer.from(env.ORIGIN_SECRET);
      if(supplied.length!==expected.length||!crypto.timingSafeEqual(supplied,expected))return res.status(403).json({message:'Origem de acesso não autorizada.'});
      const visitor=req.get('x-real-ip');if(require('net').isIP(visitor||''))req.rateLimitIp=visitor;
    }
    next();
  });
  app.use(require('cors')({
    origin(origin,callback){
      const local=env.NODE_ENV!=='production' && /^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin || '');
      if(!origin||local||origins.includes(origin))return callback(null,true);
      const error=Error('Origem não autorizada.');error.status=403;callback(error);
    },credentials:true,methods:['GET','HEAD','POST','PUT','DELETE','OPTIONS'],allowedHeaders:['content-type','authorization','idempotency-key','x-csrf-token','x-session-mode'],exposedHeaders:['X-Request-ID','Retry-After'],maxAge:600,
  }));
}
// Limite por IP, sem persistir credenciais. Para múltiplas instâncias, usar limitador distribuído no proxy.
function loginLimit({limit=30,windowMs=15*60*1000,maxEntries=10000,namespace='login',sharedStore}={}){const entries=new Map();return async(req,res,next)=>{
  if(sharedStore || process.env.SECURITY_STORE==='mysql'){
    try{const {getStore,digest}=require('../security/store');const value=await (sharedStore||getStore()).count('rate:'+namespace+':'+digest(req.rateLimitIp||req.ip||''),windowMs);
      if(value.count>limit){res.set('Retry-After',String(Math.max(1,Math.ceil((value.until-Date.now())/1000))));return res.status(429).json({message:'Muitas tentativas. Tente novamente mais tarde.'});}return next();
    }catch{return res.status(503).json({message:'Proteção de acesso temporariamente indisponível.'});}
  }
  const now=Date.now(),key=req.rateLimitIp||req.ip;
  for(const [ip,value] of entries)if(value.until<=now)entries.delete(ip);
  const value=entries.get(key)||{count:0,until:now+windowMs};
  if(value.count>=limit || (!entries.has(key)&&entries.size>=maxEntries)){res.set('Retry-After',String(Math.ceil((value.until-now)/1000)));return res.status(429).json({message:'Muitas tentativas. Tente novamente mais tarde.'});}
  value.count++;entries.set(key,value);
  next();
};}
function validateInput(req,res,next){
  const bad=()=>res.status(400).json({message:'Formato de dados inválido.'});
  if(Object.entries(req.query).some(([key,value])=>/[\[\]]/.test(key)||typeof value!=='string'))return bad();
  const operational=req.path.split('/')[2]?.toLowerCase()==='operacional';
  if(req.body!==undefined && !Buffer.isBuffer(req.body)){
    if(!req.body || Array.isArray(req.body) || typeof req.body!=='object')return bad();
    if(!operational && Object.values(req.body).some(value=>value!==null && !['string','number','boolean'].includes(typeof value)))return bad();
    function unsafe(value){return value && typeof value==='object' && Object.entries(value).some(([key,item])=>['__proto__','constructor','prototype'].includes(key)||unsafe(item));}
    if(unsafe(req.body))return bad();
  }
  next();
}
module.exports={configure,loginLimit,validateInput};
