const fs=require('fs'),path=require('path'),crypto=require('crypto'),request=require('supertest'),mysql=require('mysql2/promise'),bcrypt=require('bcryptjs');
const execute=require('../database/executeSql');
const options=require('../config/environment').databaseOptions();
const base='/api/operacional/gestao/pessoas',origin='http://localhost:5173';
const database='vertice_test_profissionais_'+Date.now();
let app,pool,legacy,admin,agent,field,foreign,csrf,tenant,otherTenant,work,otherWork,own,external,foreignTeam,usersBefore;
const password='Profissionais-test-482kL';
const insert=async(sql,args=[])=>(await pool.query(sql,args))[0].insertId;
const headers=(key=crypto.randomUUID())=>({'Origin':origin,'X-CSRF-Token':csrf,'Idempotency-Key':key});
const create=(data={},client=agent,key=crypto.randomUUID())=>client.post(base).set(headers(key)).send({codigo:crypto.randomUUID(),nome:'Integrante isolado',cargo:'Pedreiro',ativo:true,...data});
const person=async id=>(await agent.get(base+'/'+id)).body;
const edit=(p,changes={},client=agent,key=crypto.randomUUID())=>client.put(base+'/'+p.id_profissional).set(headers(key)).send({nome:p.nome,codigo:p.codigo,cargo:p.cargo,ativo:p.ativo,equipe_id:p.equipe_id,terceirizada_id:p.terceirizada_id,versao:p.versao,...changes});
const migration=async name=>execute(pool,fs.readFileSync(path.join(__dirname,'../database/migrations',name),'utf8'));
beforeAll(async()=>{
 if(!/^vertice_test_/.test(options.database||'')||!/^vertice_test_/.test(database))throw Error('Isolated databases required');
 admin=await mysql.createConnection({...options,database:undefined,multipleStatements:true});
 await admin.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[database]);await admin.query('USE ??',[database]);
 await admin.query(fs.readFileSync(path.join(__dirname,'../database/valen_atualizado.sql'),'utf8'));await admin.query(fs.readFileSync(path.join(__dirname,'../database/migrations/004_security_state.sql'),'utf8'));
 process.env.DB_NAME=database;app=require('../app');pool=require('../config/operacional');legacy=require('../config/connection');
 tenant=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Profissionais isolado']);otherTenant=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Profissionais estrangeiro']);
 const hash=await bcrypt.hash(password,10);
 async function user(company,ambiente){const email=crypto.randomUUID()+'@professionals.test';await insert('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Teste isolado',email,hash,ambiente,company]);const client=request.agent(app),r=await client.post('/api/usuarios/login').set({'Origin':origin,'X-Session-Mode':'cookie'}).send({email,senha:password});expect(r.status).toBe(200);return {client,csrf:r.body.session.csrf};}
 const office=await user(tenant,'Escritorio');agent=office.client;csrf=office.csrf;field=(await user(tenant,'Canteiro'));foreign=await user(otherTenant,'Escritorio');
 const sql="INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES (?,?,1,'2026-01-01','2027-01-01',1000)";
 work=await insert(sql,['Obra isolada',tenant]);otherWork=await insert(sql,['Outra construtora',otherTenant]);
 const teamSql="INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES (?,'Infraestrutura',2,10,100,?)";
 own=await insert(teamSql,['Equipe interna',work]);foreignTeam=await insert(teamSql,['Equipe estrangeira',otherWork]);external=await insert('INSERT INTO cadastro_de_equipes_terceirizadas(nome_equipe,custo_diario_total,id_obra) VALUES (?,20,?)',['Terceira isolada',work]);
 usersBefore=(await pool.query('SELECT COUNT(*) n FROM usuario'))[0][0].n;
},30000);
afterAll(async()=>{if(pool)await pool.end();if(legacy)await new Promise(resolve=>legacy.end(resolve));await admin?.end();});
test('missing 005 reports blocked state without creating tables and still enforces access',async()=>{
 expect((await request(app).get(base+'/estado')).status).toBe(401);
 const r=await agent.get(base+'/estado');expect(r.body).toMatchObject({habilitado:false,pode_editar:true,migrations:[5]});
 expect((await field.client.get(base+'/estado')).body.pode_editar).toBe(false);
 expect((await agent.get(base)).body.code).toBe('SCHEMA_NOT_READY');
 expect((await field.client.post(base).set({...headers(),'X-CSRF-Token':field.csrf}).send({})).status).toBe(403);
 expect((await pool.query("SELECT COUNT(*) n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='profissional'"))[0][0].n).toBe(0);
});
test('005 alone enables CRUD without requiring history or team availability migrations',async()=>{
 await migration('005_profissionais.sql');await migration('005_profissionais.sql');
 expect((await agent.get(base+'/estado')).body).toMatchObject({habilitado:true,pode_editar:true,historico_habilitado:false});
 const r=await create({codigo:' L-001 ',nome:'  Ana da Silva  ',equipe_id:own});expect(r.status).toBe(201);
 const p=await person(r.body.insertId);expect(p).toMatchObject({codigo:'L-001',nome:'Ana da Silva',equipe_id:own,id_obra:work,ativo:true});expect(p.versao).toMatch(/^[a-f0-9]{64}$/);
 expect((await edit(p,{cargo:'Engenheira'})).status).toBe(201);
});
test('codes are unique per company, including inactive professionals, without provisioning users',async()=>{
 const a=await create({codigo:'UNIQUE-1',ativo:false});expect(a.status).toBe(201);
 expect((await create({codigo:'unique-1'})).status).toBe(409);
 const r=await foreign.client.post(base).set({...headers(),'X-CSRF-Token':foreign.csrf}).send({codigo:'UNIQUE-1',nome:'Outro cadastro isolado',cargo:'Pedreiro',ativo:true});expect(r.status).toBe(201);
 expect((await pool.query('SELECT COUNT(*) n FROM usuario'))[0][0].n).toBe(usersBefore);
});
test('link, transfer, unlink, deactivate and reactivate keep one current team',async()=>{
 const r=await create({codigo:'FLOW',equipe_id:own});let p=await person(r.body.insertId);
 expect((await edit(p,{equipe_id:null,terceirizada_id:external})).status).toBe(201);p=await person(p.id_profissional);expect(p.equipe_id).toBeNull();expect(p.terceirizada_id).toBe(external);
 expect((await edit(p,{terceirizada_id:null})).status).toBe(201);p=await person(p.id_profissional);expect(p.equipe).toBeNull();
 expect((await edit(p,{ativo:false})).status).toBe(201);p=await person(p.id_profissional);expect(p.ativo).toBe(false);
 expect((await edit(p,{ativo:true,equipe_id:own})).status).toBe(201);expect((await person(p.id_profissional)).ativo).toBe(true);
});
test('name, code, job, team, work and status filters combine and do not interpret wildcard SQL',async()=>{
 const r=await create({codigo:'FILTER-42',nome:'Maria Filter',cargo:'Eletricista',equipe_id:own});expect(r.status).toBe(201);
 const query=new URLSearchParams({nome:'maria',codigo:'FILTER-',cargo:'Eletricista',equipe_id:String(own),obra_id:String(work),situacao:'ativo'});
 expect((await agent.get(base+'?'+query)).body.map(p=>p.id_profissional)).toEqual([r.body.insertId]);
 expect((await agent.get(base+'?codigo=%25')).body).toEqual([]);
 expect((await agent.get(base+'?busca='+encodeURIComponent("' OR 1=1 --"))).body).toEqual([]);
 expect((await agent.get(base+'?sem_equipe=true')).body.every(p=>!p.equipe_id&&!p.terceirizada_id)).toBe(true);
 expect((await agent.get(base+'?situacao=unexpected')).status).toBe(400);
 expect((await agent.get(base+'?sem_equipe=true&equipe_id='+own)).status).toBe(400);
});
test('foreign professionals, teams, access identities and Canteiro writes remain forbidden',async()=>{
 const r=await create({equipe_id:own}),p=await person(r.body.insertId);
 expect((await foreign.client.get(base+'/'+p.id_profissional)).status).toBe(404);
 expect((await edit(p,{},foreign.client)).status).toBe(403);
 expect((await foreign.client.put(base+'/'+p.id_profissional).set({...headers(),'X-CSRF-Token':foreign.csrf}).send({nome:p.nome,codigo:p.codigo,cargo:p.cargo,ativo:true})).status).toBe(404);
 expect((await create({equipe_id:foreignTeam})).status).toBe(403);
 expect((await create({id_construtora:otherTenant})).status).toBe(400);
 expect((await field.client.post(base).set({...headers(),'X-CSRF-Token':field.csrf}).send({nome:'Forbidden'})).status).toBe(403);
 expect((await agent.put(base+'/'+p.id_profissional).set({'Origin':origin,'Idempotency-Key':crypto.randomUUID()}).send({})).status).toBe(403);
});
test.each([{nome:'  '},{codigo:' '},{cargo:' '},{nome:'x'.repeat(151)},{codigo:'x'.repeat(51)},{cargo:'x'.repeat(101)},{ativo:'false'},{equipe_id:0},{equipe_id:true},{equipe_id:1,terceirizada_id:1},{versao:'bad'},{email:'not-an-account'}])('invalid professional fields are rejected: %j',async changes=>{
 expect((await create(changes)).status).toBe(400);
});
test('empty requests are rejected with a validation error',async()=>{expect((await agent.post(base).set(headers())).status).toBe(400);});
test('stale edits fail without overwriting; replay is idempotent and cannot duplicate people',async()=>{
 const key=crypto.randomUUID(),body={codigo:'REPLAY',equipe_id:own};const a=await create(body,agent,key),again=await create(body,agent,key);expect(again.body.insertId).toBe(a.body.insertId);
 const p=await person(a.body.insertId),editKey=crypto.randomUUID();expect((await edit(p,{nome:'Updated'},agent,editKey)).status).toBe(201);
 expect((await edit(p,{nome:'Updated'},agent,editKey)).status).toBe(200);
 expect((await edit(p,{nome:'Stale write'})).status).toBe(409);expect((await person(p.id_profissional)).nome).toBe('Updated');
});
test('available teams without work are supported after 007; inactive and foreign teams cannot receive new people',async()=>{
 await migration('007_disponibilidade_equipes.sql');
 const team=await insert('INSERT INTO cadastro_de_equipes(nome_equipe,id_construtora,idobra,ativo,quantidade_profissionais,custo_diario,custo_mensal,etapa_atuacao) VALUES (?,?,NULL,1,2,10,100,?)',['Disponível isolada',tenant,'Infraestrutura']);
 const r=await create({equipe_id:team});expect(r.status).toBe(201);let p=await person(r.body.insertId);expect(p.id_obra).toBeNull();expect(p.equipe).toBe('Disponível isolada');
 await pool.query('UPDATE cadastro_de_equipes SET ativo=0 WHERE id_cadastro_equipes=?',[team]);
 expect((await create({equipe_id:team})).status).toBe(403);
 expect((await edit(p,{cargo:'Atualizado em equipe inativa'})).status).toBe(201);
 expect((await agent.get(base)).body.some(p=>p.equipe==='Equipe estrangeira')).toBe(false);
});
test('006 enables transactional history; repeated transfers do not duplicate audit events',async()=>{
 await migration('006_gestao_integrada.sql');expect((await agent.get(base+'/estado')).body.historico_habilitado).toBe(true);
 const r=await create({codigo:'AUDIT',equipe_id:own}),p=await person(r.body.insertId),key=crypto.randomUUID();
 await edit(p,{equipe_id:null,terceirizada_id:external},agent,key);await edit(p,{equipe_id:null,terceirizada_id:external},agent,key);
 const history=await agent.get('/api/operacional/gestao/operacoes/historico?recurso=pessoas&recurso_id='+p.id_profissional);expect(history.status).toBe(200);expect(history.body).toHaveLength(2);
 expect((await pool.query('SELECT COUNT(*) n FROM profissional WHERE id_profissional=?',[p.id_profissional]))[0][0].n).toBe(1);
});
