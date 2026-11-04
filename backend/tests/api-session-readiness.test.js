const request=require('supertest'),bcrypt=require('bcryptjs'),crypto=require('crypto');
const app=require('../app'),pool=require('../config/operacional'),db=require('../config/connection');
const schema=require('../utils/schemaReadiness');
const origin='http://localhost:5173';
let actor,company,otherCompany,work,foreignWork,email;
const password='Isolated-cookie-login-482K';
const insert=async(sql,args=[])=>(await pool.query(sql,args))[0].insertId;
const login=agent=>agent.post('/api/usuarios/login').set({'Origin':origin,'X-Session-Mode':'cookie'}).send({email,senha:password});
beforeAll(async()=>{
 if(!/^vertice_test_/.test(process.env.DB_NAME||''))throw Error('Isolated database required');
 const path=require('path'),execute=require('../database/executeSql');
 const c=await pool.getConnection();try{for(const name of ['002_operacao_canteiro.sql','003_gestao_operacional.sql','005_profissionais.sql'])await execute(c,require('fs').readFileSync(path.join(__dirname,'../database/migrations',name),'utf8'));}finally{c.release();}
 company=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Session own']);
 otherCompany=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Session foreign']);
 email=crypto.randomUUID()+'@session.test';
 actor=await insert('INSERT INTO usuario(nome,email,senha,ambiente,ocupacao,idconstrutora) VALUES (?,?,?,?,?,?)',['Session office',email,await bcrypt.hash(password,10),'Escritorio','Gerencia',company]);
 const sql='INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES (?,?,?,?,?,?)';
 work=await insert(sql,['Own work',company,1,'2026-01-01','2027-01-01',1000]);
 foreignWork=await insert(sql,['Foreign work',otherCompany,1,'2026-01-01','2027-01-01',1000]);
},30000);
afterAll(async()=>{await pool.end();await new Promise(resolve=>db.end(resolve));});
test('legitimate HttpOnly login accesses works, people, summary and recovered analytics without bearer',async()=>{
 const agent=request.agent(app),r=await login(agent);expect(r.status).toBe(200);expect(r.body.token).toBeUndefined();
 expect(r.headers['set-cookie'][0]).toMatch(/HttpOnly/);expect(r.headers['set-cookie'][0]).toMatch(/SameSite=Lax/);
 const works=await agent.get('/api/obras?id_construtora='+company).set('Origin',origin);
 expect(works.status).toBe(200);expect(works.body.map(o=>o.id_obra)).toEqual([work]);
 expect((await agent.get('/api/obras?id_construtora='+otherCompany)).body).toEqual([]);
 for(const route of ['/api/operacional/gestao/pessoas','/api/operacional/gestao/resumo','/api/inteligencia-operacional?id_obra='+work,'/api/historico-preditivo?id_obra='+work]){
  const response=await agent.get(route).set('Origin',origin);expect(response.status).toBe(200);
  expect(response.headers['access-control-allow-origin']).toBe(origin);expect(response.headers['access-control-allow-credentials']).toBe('true');
  if(route.endsWith('/resumo'))expect(response.body.obras.map(o=>o.id_obra)).toEqual([work]);
 }
 expect((await agent.get('/api/operacional/gestao/resumo?obra_id='+foreignWork)).status).toBe(403);
 expect((await agent.get('/api/inteligencia-operacional?id_obra='+foreignWork)).status).toBe(404);
});
test('both local frontend origins are allowed; unknown origins and absent cookies remain rejected',async()=>{
 const agent=request.agent(app);expect((await login(agent)).status).toBe(200);
 for(const allowed of [origin,'http://127.0.0.1:5173']){const r=await agent.get('/api/obras').set('Origin',allowed);expect(r.status).toBe(200);expect(r.headers['access-control-allow-origin']).toBe(allowed);}
 expect((await agent.get('/api/obras').set('Origin','https://attacker.invalid')).status).toBe(403);
 for(const route of ['/api/obras','/api/operacional/gestao/pessoas','/api/operacional/gestao/resumo'])expect((await request(app).get(route)).status).toBe(401);
});
test('CSRF remains mandatory and logout revokes legitimate cookie sessions',async()=>{
 const agent=request.agent(app),r=await login(agent),cookie=r.headers['set-cookie'][0].split(';')[0];
 const route='/api/usuarios/insert/'+actor;
 expect((await agent.put(route).set('Origin',origin).send({nome:'Changed'})).status).toBe(403);
 expect((await agent.put(route).set({'Origin':origin,'X-CSRF-Token':r.body.session.csrf}).send({nome:'Changed'})).status).toBe(200);
 expect((await agent.post('/api/usuarios/logout').set({'Origin':origin,'X-CSRF-Token':r.body.session.csrf})).status).toBe(200);
 expect((await request(app).get('/api/obras').set('Cookie',cookie)).status).toBe(401);
});
test('schema diagnostics detect missing tables and columns without writes or cached readiness',async()=>{
 let available=[];const statements=[];
 const fake={query:async(sql,args)=>{statements.push(sql);return [available];}};
 const r=await schema.inspectSchema(fake);expect(r.pessoas.migrations).toEqual([5]);expect(r.resumo.migrations).toEqual([2,3]);
 await expect(schema.requireSchema(fake,'pessoas')).rejects.toMatchObject({status:503,code:'SCHEMA_NOT_READY',migrations:[5]});
 available=['id_profissional','id_construtora','codigo','nome','cargo','equipe_id','terceirizada_id','ativo'].map(COLUMN_NAME=>({TABLE_NAME:'profissional',COLUMN_NAME}));
 await expect(schema.requireSchema(fake,'pessoas')).resolves.toBeUndefined();expect(statements.every(sql=>sql.startsWith('SELECT '))).toBe(true);
});
test('missing migrations produce an explicit 503 after authentication and no SQL disclosure',async()=>{
 const agent=request.agent(app);expect((await login(agent)).status).toBe(200);
 const check=jest.spyOn(schema,'requireSchema').mockRejectedValue(Object.assign(new Error('private SQL'),{status:503,code:'SCHEMA_NOT_READY',module:'pessoas',migrations:[5]}));
 try{const r=await agent.get('/api/operacional/gestao/pessoas');expect(r.status).toBe(503);expect(r.body).toMatchObject({code:'SCHEMA_NOT_READY',migrations:[5]});expect(JSON.stringify(r.body)).not.toMatch(/private SQL|SELECT|password/);}
 finally{check.mockRestore();}
});
