const request=require('supertest');
const jwt=require('jsonwebtoken');
const app=require('../app');
const pool=require('../config/operacional');
const db=require('../config/connection');
let tenant,foreignTenant,actor,work,foreignWork,token;
const insert=async(sql,args)=>(await pool.query(sql,args))[0].insertId;
const get=url=>request(app).get(url).set('Authorization','Bearer '+token);
beforeAll(async()=>{
 if(!/^vertice_test_/.test(process.env.DB_NAME||''))throw Error('Isolated database required');
 tenant=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Analytics own']);
 foreignTenant=await insert('INSERT INTO construtora(razao_social) VALUES (?)',['Analytics foreign']);
 actor=await insert('INSERT INTO usuario(nome,email,senha,ocupacao,ambiente,idconstrutora) VALUES (?,?,?,?,?,?)',['Analytics',Date.now()+'@analytics.test','unused','Gerencia','Escritorio',tenant]);
 work=await insert('INSERT INTO obra(nome,id_construtora,numero_pavimentos,orcamento_planejado,data_inicio_planejada,data_termino_planejada) VALUES (?,?,?,?,?,?)',['Analytics own',tenant,1,1000,'2026-01-01','2027-01-01']);
 foreignWork=await insert('INSERT INTO obra(nome,id_construtora,numero_pavimentos,orcamento_planejado,data_inicio_planejada,data_termino_planejada) VALUES (?,?,?,1000,?,?)',['Analytics foreign',foreignTenant,1,'2026-01-01','2027-01-01']);
 await pool.query('INSERT INTO diario_obra(data,obrax_id,usuario_id,atrasos) VALUES (?,?,?,?)',['2026-10-01',work,actor,'Atraso de entrega']);
 await pool.query('INSERT INTO metricas_eva(data_calculo,idc,idp,eac,obra_idxx) VALUES (?,?,?,?,?)',['2026-10-01',0.9,0.8,1200,work]);
 token=jwt.sign({id_usuario:actor,idconstrutora:tenant},process.env.JWT_SECRET,{expiresIn:'1h'});
});
afterAll(async()=>{await pool.end();await new Promise(resolve=>db.end(resolve));});
test('metadata uses current schema and excludes foreign works',async()=>{
 const r=await get('/api/inteligencia-operacional/filtros');expect(r.status).toBe(200);expect(r.body.obras.map(o=>o.id_obra)).toEqual([work]);
});
test.each(['inteligencia-operacional','historico-preditivo'])('%s authenticates, scopes and reads current SQL schema',async route=>{
 expect((await request(app).get('/api/'+route+'?id_obra='+work)).status).toBe(401);
 expect((await get('/api/'+route+'?id_obra='+foreignWork)).status).toBe(404);
 const r=await get('/api/'+route+'?id_obra='+work);expect(r.status).toBe(200);
 expect(r.body.resumo[route==='historico-preditivo'?'ocorrencias':'total_ocorrencias']).toBe(1);
 expect((await get('/api/'+route+'?id_obra='+work+'&fonte=rdo')).status).toBe(200);
 expect((await get('/api/'+route+'?id_obra='+work+'&inicio=2026-02-30')).status).toBe(400);
 expect((await request(app).post('/api/'+route).set('Authorization','Bearer '+token)).status).toBe(405);
});
test('history reads dated EVA values from current pool',async()=>{
 const r=await get('/api/historico-preditivo?id_obra='+work);expect(r.status).toBe(200);expect(r.body.eva[0].data).toBe('2026-10-01');expect(r.body.ultimo.eac).toBe(1200);
});
test('analyses reject field users, inactive users and non-manager roles',async()=>{
 for(const [column,value] of [['ambiente','Canteiro'],['ocupacao','Operacional'],['status','Inativo']]){
  await pool.query('UPDATE usuario SET ??=? WHERE id_usuario=?',[column,value,actor]);
  expect((await get('/api/inteligencia-operacional?id_obra='+work)).status).toBe(403);
  expect((await get('/api/historico-preditivo?id_obra='+work)).status).toBe(403);
  await pool.query('UPDATE usuario SET ambiente=?,ocupacao=?,status=? WHERE id_usuario=?',['Escritorio','Gerencia','Ativo',actor]);
 }
});
