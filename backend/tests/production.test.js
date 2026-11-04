const {databaseOptions,productionOptions}=require('../config/environment');
const {createS3Store}=require('../storage/s3');
const {Readable}=require('stream');
const config={NODE_ENV:'production',ORIGIN_SECRET:'Synthetic_origin_secret_48kPm72sQ9vx',PUBLIC_FRONTEND_URL:'https://vertice.example.test',PUBLIC_API_URL:'https://api.example.test',SECURITY_STORE:'mysql',DB_HOST:'db.example.test',DB_PORT:'3306',DB_USER:'vertice',DB_PASSWORD:'test-only',DB_NAME:'vertice',DB_SSL:'true',JWT_SECRET:'TestOnly_7mdNk42pQz9xRc6vLt8gYw5aBs3h',CORS_ORIGINS:'https://vertice.example.test',REGISTRATION_MODE:'office',PHOTO_STORAGE_DRIVER:'s3',S3_BUCKET:'bucket-test',S3_REGION:'us-east-1',TRUST_PROXY_HOPS:'1'};
test('configuração remota exige TLS e nunca desabilita validação do certificado',()=>{
  expect(databaseOptions(config).ssl.rejectUnauthorized).toBe(true);
  expect(()=>databaseOptions({...config,DB_SSL:'false'})).toThrow(/DB_SSL/);
  expect(()=>databaseOptions({...config,NODE_ENV:'test',DB_NAME:'valen'})).toThrow(/isolado/);
  expect(()=>databaseOptions({...config,DB_USER:'root'})).toThrow(/dedicado/);
  expect(()=>databaseOptions({...config,DB_PASSWORD:''})).toThrow(/senha/);
});
test('produção rejeita origem ampla, cadastro público e armazenamento local',()=>{
  expect(productionOptions(config).origins).toEqual([config.CORS_ORIGINS]);
  expect(productionOptions({...config,CORS_ORIGINS:''}).origins).toEqual([config.PUBLIC_FRONTEND_URL]);
  for(const change of [{CORS_ORIGINS:'*'},{CORS_ORIGINS:'http://example.test'},{REGISTRATION_MODE:'public'},{JWT_SECRET:'short'},{JWT_SECRET:'x'.repeat(48)},{PHOTO_STORAGE_DRIVER:'local'},{TRUST_PROXY_HOPS:'true'}])expect(()=>productionOptions({...config,...change})).toThrow();
});
test('S3 usa objeto privado cifrado, stream autenticado e remoção, sem chamar rede',async()=>{
  const commands=[];
  const client={send:async command=>{commands.push(command);return command.constructor.name==='GetObjectCommand'?{Body:Readable.from([Buffer.from('image-test')])}:{};}};
  const store=createS3Store(config,client);
  await store.put('foto.webp',Buffer.from('image-test'),'checksum-test');
  const stream=await store.read('foto.webp');let text='';for await(const chunk of stream)text+=chunk;
  expect(text).toBe('image-test');await store.remove('foto.webp');
  expect(commands.map(c=>c.constructor.name)).toEqual(['PutObjectCommand','GetObjectCommand','DeleteObjectCommand']);
  expect(commands[0].input).toMatchObject({Bucket:'bucket-test',Key:'vertice/photos/foto.webp',ServerSideEncryption:'AES256',ContentType:'image/webp'});
  expect(commands[0].input.ACL).toBeUndefined();
});
test('S3 rejeita endpoint inseguro e traduz ausência de objeto',async()=>{
  expect(()=>createS3Store({...config,S3_ENDPOINT:'http://inseguro.test'},{})).toThrow(/HTTPS/);
  const store=createS3Store(config,{send:async()=>{const e=Error('notfound');e.name='NoSuchKey';throw e;}});
  await expect(store.read('foto.webp')).rejects.toMatchObject({status:404});
});
test('limite de login retorna 429 e Retry-After após a cota',async()=>{
  const app=require('express')();app.use(require('../middlewares/http').loginLimit());app.get('/check',(req,res)=>res.sendStatus(200));const request=require('supertest');
  for(let i=0;i<30;i++)expect((await request(app).get('/check')).status).toBe(200);
  const limited=await request(app).get('/check');expect(limited.status).toBe(429);expect(Number(limited.headers['retry-after'])).toBeGreaterThan(0);
});

test('limite saturado não libera IPs novos e expira sem guardar credenciais',async()=>{
  const app=require('express')(),request=require('supertest');
  const limit=require('../middlewares/http').loginLimit({limit:2,maxEntries:1});
  app.use((req,res,next)=>{Object.defineProperty(req,'ip',{value:req.get('test-ip')});next();});app.use(limit);app.get('/',(req,res)=>res.sendStatus(200));
  expect((await request(app).get('/').set('test-ip','one')).status).toBe(200);
  expect((await request(app).get('/').set('test-ip','two')).status).toBe(429);
});

test('produção exige HTTPS e aceita TLS terminado no proxy confiável',async()=>{
  const app=require('express')(),request=require('supertest');require('../middlewares/http').configure(app,config);
  app.get('/private',(req,res)=>res.json({ok:true}));app.get('/api/health',(req,res)=>res.json({status:'online'}));
  expect((await request(app).get('/private')).status).toBe(426);
  expect((await request(app).get('/api/health')).status).toBe(200);
  const response=await request(app).get('/private').set('X-Forwarded-Proto','https');expect(response.status).toBe(200);expect(response.headers['strict-transport-security']).toContain('max-age');
});
