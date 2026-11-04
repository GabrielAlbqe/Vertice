const fs=require('fs');
const path=require('path');
const request=require('supertest');
const crypto=require('crypto');
const jwt=require('jsonwebtoken');
const app=require('../app');
const pool=require('../config/operacional');
const legacy=require('../config/connection');
let company,otherCompany,work,foreignWork,team,foreignTeam,external,stage,rdo,token,fieldToken,otherToken;
const insert=async(sql,args=[])=>(await pool.query(sql,args))[0].insertId;
const headers=(value=token,key=crypto.randomUUID())=>({Authorization:'Bearer '+value,'Idempotency-Key':key});
beforeAll(async()=>{
  if(!/^vertice_test_/.test(process.env.DB_NAME||''))throw Error('Banco isolado obrigatório.');
  const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/005_profissionais.sql'),'utf8');
  await pool.query(sql);await pool.query(sql);
  company=await insert("INSERT INTO construtora(razao_social) VALUES ('Office3 fixture')");
  otherCompany=await insert("INSERT INTO construtora(razao_social) VALUES ('Office3 foreign')");
  async function user(tenant,role){const id=await insert('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Office3',crypto.randomUUID()+'@teste.local','isolated-fixture',role,tenant]);return jwt.sign({id_usuario:id},process.env.JWT_SECRET);}
  token=await user(company,'Escritório');fieldToken=await user(company,'Canteiro');otherToken=await user(otherCompany,'Escritório');
  work=await insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Office3',?,1,'2026-01-01','2027-01-01',1000)",[company]);
  foreignWork=await insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Office3 foreign',?,1,'2026-01-01','2027-01-01',1000)",[otherCompany]);
  async function newTeam(w){return insert("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Fixture','Infraestrutura',2,10,100,?)",[w]);}
  team=await newTeam(work);foreignTeam=await newTeam(foreignWork);
  external=await insert("INSERT INTO cadastro_de_equipes_terceirizadas(nome_equipe,custo_diario_total,id_obra) VALUES ('External',20,?)",[work]);
  stage=await insert("INSERT INTO etapa(id_obra,nome_etapa) VALUES (?,'Infraestrutura')",[work]);
  rdo=await insert("INSERT INTO rdo(id_obra,data_rdo,turno,clima) VALUES (?,'2026-10-01','Integral','Ensolarado')",[work]);
});
afterAll(async()=>{await pool.end();await new Promise(r=>legacy.end(r));});
const person=()=>({codigo:'P-1',nome:'Integrante isolado',cargo:'Pedreiro',equipe_id:team,ativo:true});
test('profissionais: cadastro, replay, código único, edição e distinção de acessos',async()=>{
  const h=headers(),a=await request(app).post('/api/operacional/gestao/pessoas').set(h).send(person());expect(a.status).toBe(201);
  const replay=await request(app).post('/api/operacional/gestao/pessoas').set(h).send(person());expect(replay.body.insertId).toBe(a.body.insertId);
  expect((await request(app).post('/api/operacional/gestao/pessoas').set(headers()).send(person())).status).toBe(409);
  const edit=await request(app).put('/api/operacional/gestao/pessoas/'+a.body.insertId).set(headers()).send({...person(),equipe_id:null,terceirizada_id:external});expect(edit.status).toBe(201);
  const list=await request(app).get('/api/operacional/gestao/pessoas').set(headers());expect(list.body).toHaveLength(1);expect(list.body[0].terceirizada_id).toBe(external);
  expect((await request(app).get('/api/operacional/gestao/pessoas').set(headers(otherToken))).body).toEqual([]);
  expect((await request(app).put('/api/operacional/gestao/pessoas/'+a.body.insertId).set(headers(otherToken)).send({...person(),equipe_id:null})).status).toBe(404);
});
test('profissionais: impede obra estrangeira, duas equipes, Canteiro e falta de idempotência',async()=>{
  for(const b of [{...person(),codigo:'P-2',equipe_id:foreignTeam},{...person(),codigo:'P-2',terceirizada_id:external}])expect((await request(app).post('/api/operacional/gestao/pessoas').set(headers()).send(b)).status).toBeGreaterThanOrEqual(400);
  expect((await request(app).post('/api/operacional/gestao/pessoas').set(headers(fieldToken)).send(person())).status).toBe(403);
  expect((await request(app).post('/api/operacional/gestao/pessoas').set({Authorization:'Bearer '+token}).send(person())).status).toBe(400);
});
const expense=()=>({id_obra:work,id_etapa:stage,id_rdo:rdo,origem_custo:'Equipe',id_origem:team,data:'2026-10-01',quantidade:2,custo_unitario:30});
test('despesas: preço histórico, cálculo, replay, duplicidade e integração do resumo',async()=>{
  const h=headers(),first=await request(app).post('/api/operacional/gestao/custos').set(h).send(expense());expect(first.status).toBe(201);
  expect((await request(app).post('/api/operacional/gestao/custos').set(h).send(expense())).body.insertId).toBe(first.body.insertId);
  expect((await request(app).post('/api/operacional/gestao/custos').set(headers()).send(expense())).status).toBe(409);
  const history=await request(app).get('/api/operacional/gestao/custos?obra_id='+work).set(headers());expect(history.body).toHaveLength(1);expect(Number(history.body[0].valor_total)).toBe(60);
  const summary=await request(app).get(`/api/operacional/gestao/resumo?obra_id=${work}&inicio=2026-10-01&fim=2026-10-01`).set(headers());expect(summary.status).toBe(200);expect(Number(summary.body.financeiro[0].realizado)).toBe(60);
  const empty=await request(app).get(`/api/operacional/gestao/resumo?obra_id=${work}&inicio=2026-09-01&fim=2026-09-30`).set(headers());expect(empty.body.financeiro).toEqual([]);
});
test('despesas: bloqueia Canteiro, obra estrangeira, datas divergentes, valores inválidos e origem estrangeira',async()=>{
  expect((await request(app).post('/api/operacional/gestao/custos').set(headers(fieldToken)).send(expense())).status).toBe(403);
  expect((await request(app).get('/api/operacional/gestao/custos?obra_id='+work).set(headers(otherToken))).status).toBe(403);
  for(const change of [{id_obra:foreignWork},{id_origem:foreignTeam},{data:'2026-10-02'},{data:'2026-02-30'},{quantidade:-1},{custo_unitario:null},{custo_unitario:-1},{origem_custo:'Outros'}])expect((await request(app).post('/api/operacional/gestao/custos').set(headers()).send({...expense(),...change})).status).toBeGreaterThanOrEqual(400);
});
test('Diário do Canteiro só origina custo mediante confirmação do Escritório, com RDO atômico e replay',async()=>{
  const diary=await request(app).post('/api/operacional/diarios').set(headers(fieldToken)).send({obrax_id:work,data:'2026-10-02',turno:'Manhã',clima:'Ensolarado',etapa_atuacao:'Infraestrutura',equipes:[team],terceirizadas:[],maquinarios:[]});expect(diary.status).toBe(201);
  expect((await pool.query('SELECT COUNT(*) n FROM custo_realizado WHERE id_obra=?',[work]))[0][0].n).toBe(1);
  const b={...expense(),id_rdo:null,diario_id:diary.body.insertId,data:'2026-10-02'},h=headers();
  const created=await request(app).post('/api/operacional/gestao/custos').set(h).send(b);expect(created.status).toBe(201);
  expect((await request(app).post('/api/operacional/gestao/custos').set(h).send(b)).body.insertId).toBe(created.body.insertId);
  expect((await pool.query("SELECT COUNT(*) n FROM rdo WHERE id_obra=? AND data_rdo='2026-10-02'",[work]))[0][0].n).toBe(1);
  expect((await pool.query('SELECT COUNT(*) n FROM custo_realizado WHERE id_obra=?',[work]))[0][0].n).toBe(2);
});
