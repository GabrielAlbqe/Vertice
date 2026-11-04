process.env.SECURITY_STORE='mysql';
jest.setTimeout(30000);
const request=require('supertest'),bcrypt=require('bcryptjs'),jwt=require('jsonwebtoken'),crypto=require('crypto');
const app=require('../app'),pool=require('../config/operacional'),legacy=require('../config/connection');
const {MysqlStore}=require('../security/store');
const {preparePasswordResets}=require('../security/passwordReset');
const origin='http://localhost:5173';
let company,office,field,officeEmail,fieldEmail;
const password='Session-test-password-123';
beforeAll(async()=>{
  company=(await pool.query("INSERT INTO construtora(razao_social) VALUES ('Session security')"))[0].insertId;
  const hash=await bcrypt.hash(password,10);
  for(const role of ['Escritório','Canteiro']){
    const email=crypto.randomUUID()+'@teste.local';
    const id=(await pool.query('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Session user',email,hash,role,company]))[0].insertId;
    if(role==='Escritório'){office=id;officeEmail=email;}else{field=id;fieldEmail=email;}
  }
});
afterAll(async()=>{await pool.end();await new Promise(r=>legacy.end(r));});
const login=(agent,email)=>agent.post('/api/usuarios/login').set({'Origin':origin,'X-Session-Mode':'cookie'}).send({email,senha:password});

test('cadastro em modo office bloqueia visitantes sem criar contas',async()=>{
  expect(process.env.REGISTRATION_MODE).toBe('office');
  const email=crypto.randomUUID()+'@teste.local';
  const r=await request(app).post('/api/usuarios/insert').set('Origin',origin).send({nome:'Anonymous blocked',email,senha:password,ambiente:'Escritório',idconstrutora:company});
  expect(r.status).toBe(401);
  expect((await pool.query('SELECT COUNT(*) n FROM usuario WHERE email=?',[email]))[0][0].n).toBe(0);
});

test.each(['office','field'])('login %s usa cookie HttpOnly e não devolve JWT ao JavaScript',async role=>{
  const agent=request.agent(app),r=await login(agent,role==='office'?officeEmail:fieldEmail);
  expect(r.status).toBe(200);expect(r.body.token).toBeUndefined();expect(r.body.session.csrf).toMatch(/^[a-f0-9]{64}$/);
  expect(r.headers['set-cookie'][0]).toMatch(/HttpOnly/);expect(r.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
  expect((await agent.get('/api/obras').set('Origin',origin)).status).toBe(200);
});

test('cookie em produção usa Secure, prefixo __Host e caminho sem Domain',()=>{
  const old=process.env.NODE_ENV;process.env.NODE_ENV='production';
  try{const sessions=require('../security/sessions');expect(sessions.cookieName()).toBe('__Host-vertice_session');expect(sessions.cookieOptions()).toMatchObject({secure:true,httpOnly:true,sameSite:'lax',path:'/'});expect(sessions.cookieOptions().domain).toBeUndefined();}finally{process.env.NODE_ENV=old;}
});

test('office com cookie cadastra na própria empresa e Canteiro não cadastra nem promove perfis',async()=>{
  const admin=request.agent(app),signed=await login(admin,officeEmail),headers={'Origin':origin,'X-CSRF-Token':signed.body.session.csrf};
  const email=crypto.randomUUID()+'@teste.local',body={nome:'Office-created account',email,senha:password,ambiente:'Canteiro'};
  const created=await admin.post('/api/usuarios/insert').set(headers).send(body);expect(created.status).toBe(201);
  const [rows]=await pool.query('SELECT idconstrutora,ambiente FROM usuario WHERE id_usuario=?',[created.body.insertId]);expect(rows[0]).toEqual({idconstrutora:company,ambiente:'Canteiro'});
  const worker=request.agent(app),session=await login(worker,email),workerHeaders={'Origin':origin,'X-CSRF-Token':session.body.session.csrf};expect(session.status).toBe(200);
  expect((await worker.post('/api/usuarios/insert').set(workerHeaders).send({...body,email:crypto.randomUUID()+'@teste.local'})).status).toBe(403);
  expect((await worker.put(`/api/usuarios/insert/${created.body.insertId}`).set(workerHeaders).send({ambiente:'Escritório'})).status).toBe(403);
  const foreign=(await pool.query("INSERT INTO construtora(razao_social) VALUES ('Other registration tenant')"))[0].insertId;
  expect((await admin.post('/api/usuarios/insert').set(headers).send({...body,email:crypto.randomUUID()+'@teste.local',idconstrutora:foreign})).status).toBe(403);
});

test('CSRF ausente, incorreto ou de outra sessão é rejeitado',async()=>{
  const agent=request.agent(app),r=await login(agent,officeEmail),other=await login(request.agent(app),officeEmail);
  for(const csrf of ['', 'invalid',other.body.session.csrf])expect((await agent.put(`/api/usuarios/insert/${office}`).set({'Origin':origin,'X-CSRF-Token':csrf}).send({nome:'Forbidden'})).status).toBe(403);
  expect((await agent.put(`/api/usuarios/insert/${office}`).set({'Origin':origin,'X-CSRF-Token':r.body.session.csrf}).send({nome:'Allowed profile'})).status).toBe(200);
  expect((await agent.post('/api/usuarios/logout').set({'Origin':'https://attacker.test','X-CSRF-Token':r.body.session.csrf})).status).toBe(403);
});

test('logout revoga a sessão no servidor e impede replay do cookie copiado',async()=>{
  const agent=request.agent(app),r=await login(agent,fieldEmail),cookie=r.headers['set-cookie'][0].split(';')[0];
  expect((await agent.post('/api/usuarios/logout').set({'Origin':origin,'X-CSRF-Token':r.body.session.csrf})).status).toBe(200);
  expect((await request(app).get('/api/obras').set('Cookie',cookie)).status).toBe(401);
  const store=new MysqlStore(pool);expect((await store.get('session:'+r.body.session.id)).revoked).toBe(true);
});

test('logout revoga também o bearer de integrações e não renova a expiração',async()=>{
  const r=await request(app).post('/api/usuarios/login').send({email:officeEmail,senha:password});
  const claims=jwt.decode(r.body.token);expect(claims.exp-claims.iat).toBe(8*3600);
  expect((await request(app).post('/api/usuarios/logout').set('Authorization','Bearer '+r.body.token)).status).toBe(200);
  expect((await request(app).get('/api/obras').set('Authorization','Bearer '+r.body.token)).status).toBe(401);
});

test('sessão expirada no armazenamento compartilhado não aceita cookie nem se renova',async()=>{
  const agent=request.agent(app),r=await login(agent,fieldEmail);
  await new MysqlStore(pool).set('session:'+r.body.session.id,{user:field,revoked:false},Date.now()-1);
  expect((await agent.get('/api/usuarios/session').set('Origin',origin)).status).toBe(401);
  expect((await agent.get('/api/obras').set('Origin',origin)).status).toBe(401);
});

test('duas instâncias compartilham contador atômico sem liberar requisições extras',async()=>{
  const a=new MysqlStore(pool),b=new MysqlStore(pool),key='test-rate:'+crypto.randomUUID();
  const values=await Promise.all(Array.from({length:20},(_,i)=>(i%2?a:b).count(key,60000)));
  expect(values.map(v=>v.count).sort((a,b)=>a-b)).toEqual(Array.from({length:20},(_,i)=>i+1));
  const express=require('express'),limiter=require('../middlewares/http').loginLimit;
  const first=express(),second=express(),namespace=crypto.randomUUID();
  for(const [server,store]of [[first,a],[second,b]]){server.use(limiter({limit:2,namespace,sharedStore:store}));server.get('/',(req,res)=>res.sendStatus(200));}
  expect((await request(first).get('/')).status).toBe(200);expect((await request(second).get('/')).status).toBe(200);expect((await request(first).get('/')).status).toBe(429);
});

test('falha do armazenamento compartilhado bloqueia acesso sem fallback silencioso',async()=>{
  const server=require('express')();server.use(require('../middlewares/http').loginLimit({sharedStore:{count:async()=>{throw Error('unavailable');}}}));server.get('/',(req,res)=>res.sendStatus(200));
  expect((await request(server).get('/')).status).toBe(503);
});

test('redefinição individual revoga credencial antiga, preserva perfis e permite login por ID com e-mail duplicado',async()=>{
  const email=crypto.randomUUID()+'@teste.local',ids=[];
  for(let i=0;i<2;i++)ids.push((await pool.query("INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES ('Reset user',?,?,'Canteiro',?)",[email,'Legacy-only-test',company]))[0].insertId);
  expect((await request(app).post('/api/usuarios/login').send({email,senha:'Legacy-only-test',id_usuario:ids[0]})).status).toBe(401);
  const c=await pool.getConnection();let tickets;
  try{await c.beginTransaction();tickets=await preparePasswordResets(c,ids);await c.commit();}catch(e){await c.rollback();throw e;}finally{c.release();}
  const first=tickets.find(t=>t.id_usuario===ids[0]),second=tickets.find(t=>t.id_usuario===ids[1]);expect(first.ticket).not.toBe(second.ticket);
  expect((await request(app).get('/api/obras').set('Authorization','Bearer '+first.ticket)).status).toBe(401);
  const replacements=['New-personal-password-A','New-personal-password-B'];
  for(let i=0;i<ids.length;i++){
    const ticket=tickets.find(t=>t.id_usuario===ids[i]).ticket;
    expect((await request(app).post('/api/usuarios/reset-password').send({ticket,senha:replacements[i]})).status).toBe(200);
    expect((await request(app).post('/api/usuarios/reset-password').send({ticket,senha:'Another-password-test'})).status).toBe(400);
    const r=await request(app).post('/api/usuarios/login').send({email,senha:replacements[i],id_usuario:ids[i]});expect(r.status).toBe(200);expect(r.body.usuario).toMatchObject({id_usuario:ids[i],ambiente:'Canteiro',idconstrutora:company,email});
    expect((await request(app).post('/api/usuarios/login').send({email,senha:'Legacy-only-test',id_usuario:ids[i]})).status).toBe(401);
  }
});

test('ticket expirado ou token de sessão não redefine senha',async()=>{
  const expired=jwt.sign({id_usuario:office,purpose:'password-reset'},process.env.JWT_SECRET,{audience:'vertice-password-reset',expiresIn:-1});
  const wrong=jwt.sign({id_usuario:office,purpose:'session'},process.env.JWT_SECRET,{expiresIn:'1h'});
  for(const ticket of [expired,wrong,'invalid'])expect((await request(app).post('/api/usuarios/reset-password').send({ticket,senha:'New-personal-password'})).status).toBe(400);
});

test('migração 004 é idempotente e preserva estados existentes',async()=>{
  const sql=require('fs').readFileSync(require('path').join(__dirname,'../database/migrations/004_security_state.sql'),'utf8');const key='migration-test:'+crypto.randomUUID();
  const store=new MysqlStore(pool);await store.set(key,{preserved:true},Date.now()+60000);await pool.query(sql);await pool.query(sql);expect(await store.get(key)).toEqual({preserved:true});
});

test('reemissão autorizada substitui o link anterior sem alterar identidade e permissões',async()=>{
  async function reissue(){const c=await pool.getConnection();try{await c.beginTransaction();const tickets=await preparePasswordResets(c,[field]);await c.commit();return tickets[0].ticket;}finally{c.release();}}
  const old=await reissue(),fresh=await reissue();expect(fresh).not.toBe(old);
  expect((await request(app).post('/api/usuarios/reset-password').send({ticket:old,senha:'Fresh-personal-password'})).status).toBe(400);
  expect((await request(app).post('/api/usuarios/reset-password').send({ticket:fresh,senha:'Fresh-personal-password'})).status).toBe(200);
  const [rows]=await pool.query('SELECT id_usuario,ambiente,idconstrutora,email FROM usuario WHERE id_usuario=?',[field]);expect(rows[0]).toEqual({id_usuario:field,ambiente:'Canteiro',idconstrutora:company,email:fieldEmail});
});
