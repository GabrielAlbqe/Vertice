const {databaseOptions,productionOptions}=require('../config/environment');
const {publicOrigins}=require('../config/publicOrigins');
const {accountStatements,provisionAccount}=require('../deploy/mysql.cjs');
const {privateStorageConfiguration}=require('../deploy/s3.cjs');
const {dumpArguments}=require('../deploy/backup.cjs');
const {migrationOptions}=require('../database/migrate-isolated.cjs');
const env={NODE_ENV:'production',ORIGIN_SECRET:'Synthetic_origin_secret_48kPm72sQ9vx',PUBLIC_FRONTEND_URL:'https://app.company.test',PUBLIC_API_URL:'https://api.host.test',DB_HOST:'mysql.provider.test',DB_PORT:'3306',DB_USER:'vertice_runtime',DB_PASSWORD:'Synthetic-test-password-482kL',DB_NAME:'vertice_production',DB_ACCOUNT_HOST:'203.0.113.12',DB_SSL:'true',SECURITY_STORE:'mysql',JWT_SECRET:'Synthetic_test_Jwt_key_392mKr7pQs42',REGISTRATION_MODE:'office',PHOTO_STORAGE_DRIVER:'s3',S3_BUCKET:'vertice-private-test',S3_REGION:'us-east-1'};

test('migração manual bloqueia o banco principal e preserva TLS no ambiente isolado',()=>{
  for(const name of ['valen','vertice_production','','vertice_test_unsafe;DROP'])expect(()=>migrationOptions({...env,DB_NAME:name})).toThrow(/bloqueados/);
  expect(migrationOptions({...env,DB_NAME:'vertice_test_cloud'})).toMatchObject({database:'vertice_test_cloud',ssl:{rejectUnauthorized:true,verifyIdentity:true}});
});

test('origens públicas parametrizam CORS e não aceitam URLs incompletas ou inseguras',()=>{
  expect(publicOrigins(env)).toEqual({frontend:env.PUBLIC_FRONTEND_URL,api:env.PUBLIC_API_URL});
  expect(productionOptions(env).origins).toEqual([env.PUBLIC_FRONTEND_URL]);
  for(const key of ['PUBLIC_FRONTEND_URL','PUBLIC_API_URL'])for(const value of ['', 'http://app.company.test','https://localhost','https://127.0.0.1','https://192.168.1.1','https://user:secret@app.company.test','https://app.company.test/path','https://app.company.test/#fragment'])expect(()=>publicOrigins({...env,[key]:value})).toThrow();
  expect(()=>productionOptions({...env,CORS_ORIGINS:'https://another.company.test'})).toThrow(/PUBLIC_FRONTEND_URL/);
  expect(()=>productionOptions({...env,PASSWORD_RESET_BASE_URL:'https://another.company.test/login'})).toThrow(/PASSWORD_RESET_BASE_URL/);
});

test('MySQL dedicado exige SSL no servidor e concede apenas DML no banco da aplicação',async()=>{
  const statements=accountStatements(env),mysql=require('mysql2');
  expect(statements[0].sql).toContain('REQUIRE SSL');
  const grant=mysql.format(statements[1].sql,statements[1].values);
  expect(grant).toContain('ON `vertice_production`.*');expect(grant).toContain('SELECT, INSERT, UPDATE, DELETE');expect(grant).not.toMatch(/ALL PRIVILEGES|GRANT OPTION|CREATE|ALTER|DROP|SUPER|FILE/);
  expect(databaseOptions(env).ssl).toMatchObject({rejectUnauthorized:true,verifyIdentity:true,minVersion:'TLSv1.2'});
  const calls=[];await expect(provisionAccount({query:async(...args)=>calls.push(args)},env)).rejects.toThrow(/autorização/);expect(calls).toHaveLength(0);
  await provisionAccount({query:async(...args)=>calls.push(args)},env,{authorized:true});expect(calls).toHaveLength(2);
  for(const change of [{DB_USER:'root'},{DB_ACCOUNT_HOST:'%'},{DB_PASSWORD:'short'},{DB_SSL:'false'},{DB_HOST:'192.0.2.1'}])expect(()=>accountStatements({...env,...change})).toThrow();
});

test('backup remoto verifica identidade TLS e não expõe a senha nos argumentos',()=>{
  const args=dumpArguments({...env,DB_SSL_CA_BASE64:Buffer.from('isolated-test-ca').toString('base64')},'/private/backup.sql','/private/ca.pem');
  expect(args).toContain('--ssl-mode=VERIFY_IDENTITY');expect(args).toContain('--ssl-ca=/private/ca.pem');
  expect(args).toContain('--single-transaction');expect(args.join(' ')).not.toContain(env.DB_PASSWORD);
  expect(()=>dumpArguments({...env,DB_SSL:'false'},'/private/backup.sql')).toThrow(/DB_SSL/);
  expect(()=>dumpArguments({...env,DB_SSL_CA_BASE64:'Y2E='},'/private/backup.sql')).toThrow(/temporário/);
  expect(dumpArguments({...env,NODE_ENV:'development',DB_SSL:'false'},'/private/backup.sql')).toContain('--ssl-mode=PREFERRED');
});

test('S3 privado usa apenas Get/Put/Delete no prefixo, sem ACLs públicas ou administração',()=>{
  const config=privateStorageConfiguration({...env,S3_PREFIX:'vertice/photos'}),allow=config.iamPolicy.Statement[0];
  expect(allow.Action).toEqual(['s3:GetObject','s3:PutObject','s3:DeleteObject']);expect(allow.Resource).toBe('arn:aws:s3:::vertice-private-test/vertice/photos/*');expect(allow.Condition.Bool['aws:SecureTransport']).toBe('true');
  expect(Object.values(config.publicAccessBlock).every(Boolean)).toBe(true);expect(config.ownershipControls.Rules[0].ObjectOwnership).toBe('BucketOwnerEnforced');expect(config.encryption.Rules[0].ApplyServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
  expect(config.bucketPolicy.Statement[0]).toMatchObject({Effect:'Deny',Condition:{Bool:{'aws:SecureTransport':'false'}}});
  expect(()=>privateStorageConfiguration({...env,S3_PREFIX:'*'})).toThrow();
});

test('proxy autenticado protege a API e limita cada visitante sem confiar em IP forjado',async()=>{
  const app=require('express')(),request=require('supertest'),http=require('../middlewares/http');
  http.configure(app,{...env,TRUST_PROXY_HOPS:'1'});app.use(http.loginLimit({limit:1}));app.get('/api/check',(req,res)=>res.json({ok:true}));
  const base={'X-Forwarded-Proto':'https',Origin:env.PUBLIC_FRONTEND_URL,'X-Real-IP':'203.0.113.1'};
  expect((await request(app).get('/api/check').set(base)).status).toBe(403);
  expect((await request(app).get('/api/check').set({...base,'X-Origin-Secret':'wrong'})).status).toBe(403);
  expect((await request(app).get('/api/check').set({...base,'X-Origin-Secret':env.ORIGIN_SECRET})).status).toBe(200);
  expect((await request(app).get('/api/check').set({...base,'X-Origin-Secret':env.ORIGIN_SECRET,'X-Real-IP':'203.0.113.2'})).status).toBe(200);
  expect((await request(app).get('/api/check').set({...base,'X-Origin-Secret':env.ORIGIN_SECRET})).status).toBe(429);
});

test('Render parametriza URLs e segredos e mantém publicação automática desligada',()=>{
  const fs=require('fs'),path=require('path'),yaml=require('js-yaml');
  const config=yaml.load(fs.readFileSync(path.join(__dirname,'../../render.yaml.example'),'utf8'));
  const service=config.services[0],vars=Object.fromEntries(service.envVars.map(item=>[item.key,item]));
  expect(service.rootDir).toBe('backend');expect(service.autoDeployTrigger).toBe('off');expect(service.healthCheckPath).toBe('/api/health');
  for(const key of ['PUBLIC_FRONTEND_URL','PUBLIC_API_URL','ORIGIN_SECRET','JWT_SECRET','DB_PASSWORD','DB_SSL_CA_BASE64','S3_BUCKET','AWS_SECRET_ACCESS_KEY'])expect(vars[key].sync).toBe(false);
  expect(vars.DB_SSL.value).toBe('true');expect(vars.SECURITY_STORE.value).toBe('mysql');
  const template=fs.readFileSync(path.join(__dirname,'../.env.production.example'),'utf8');expect(template).toMatch(/^PUBLIC_FRONTEND_URL=$/m);expect(template).toMatch(/^PUBLIC_API_URL=$/m);expect(template).not.toMatch(/https:\/\/configure-/);
});
