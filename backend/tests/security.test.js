const request=require('supertest');
jest.setTimeout(30000);
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const crypto=require('crypto');
const app=require('../app');
const db=require('../config/connection');
const pool=require('../config/operacional');
const {preparePasswordResets}=require('../security/passwordReset');
const fixtures=[];
let company,otherCompany,office,field,otherUser,work,otherWork,token,fieldToken;
const password='Security-test-1234';
const auth=value=>({Authorization:'Bearer '+value});
async function insert(sql,args=[]){return (await pool.query(sql,args))[0].insertId;}
beforeAll(async()=>{
  company=await insert("INSERT INTO construtora(razao_social) VALUES ('Security own')");
  otherCompany=await insert("INSERT INTO construtora(razao_social) VALUES ('Security foreign')");
  const hash=await bcrypt.hash(password,10);
  async function user(tenant,role){return insert('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Security',crypto.randomUUID()+'@teste.local',hash,role,tenant]);}
  office=await user(company,'Escritório');field=await user(company,'Canteiro');otherUser=await user(otherCompany,'Escritório');
  token=jwt.sign({id_usuario:office,idconstrutora:otherCompany},process.env.JWT_SECRET,{expiresIn:'1h'});
  fieldToken=jwt.sign({id_usuario:field},process.env.JWT_SECRET,{expiresIn:'1h'});
  async function newWork(tenant){return insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Security',?,1,'2026-01-01','2027-01-01',1000)",[tenant]);}
  work=await newWork(company);otherWork=await newWork(otherCompany);
  const activity=await insert("INSERT INTO atividade_eap(descricao,idx_obra) VALUES ('Security',?)",[otherWork]);
  const supply=await insert("INSERT INTO cadastro_de_insumos(nome,idobra) VALUES ('Security',?)",[otherWork]);
  const team=await insert("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Security','Infraestrutura',1,1,1,?)",[otherWork]);
  const machine=await insert("INSERT INTO cadastro_de_maquinario(nome,quantidade,idobra) VALUES ('Security',1,?)",[otherWork]);
  const diary=await insert("INSERT INTO diario_obra(data,clima,turno,etapa_atuacao,usuario_id,obrax_id) VALUES ('2026-10-01','Ensolarado','Manhã','Infraestrutura',?,?)",[otherUser,otherWork]);
  const point=await insert("INSERT INTO apontamento_fisico(percentual_dia,url_foto,diario_id,atividade_eap_id) VALUES (1,'',?,?)",[diary,activity]);
  const appropriation=await insert('INSERT INTO apropriacao(quantidade_consumida,id_insumo,id_atividade,id_usuario) VALUES (1,?,?,?)',[supply,activity,otherUser]);
  fixtures.push(['obras',otherWork],['usuarios',otherUser],['construtoras',otherCompany],['equipes',team],['insumos',supply],['maquinarios',machine],['atividades-eap',activity],['diarios-obra',diary],['apontamentos-fisicos',point],['apropriacoes',appropriation]);
});
afterAll(async()=>{await pool.end();await new Promise(resolve=>db.end(resolve));});

// Os nomes vêm de contratos públicos; os registros são criados somente no banco isolado.
for(const resource of ['obras','usuarios','construtoras','equipes','insumos','maquinarios','atividades-eap','diarios-obra','apontamentos-fisicos','apropriacoes']){
  for(const method of ['get','put','delete'])test(`${method.toUpperCase()} ${resource}: não acessa registro de outra construtora`,async()=>{
    const id=fixtures.find(([name])=>name===resource)[1];
    const route=`/api/${resource}/${method==='put'?'insert/':method==='delete'?'del/':''}${id}`;
    let req=request(app)[method](route).set(auth(token));if(method==='put')req=req.send({});
    expect((await req).status).toBe(404);
  });
}

test('URLs com maiúsculas não contornam vínculos nem privilégios',async()=>{
  expect((await request(app).post('/api/Atividades-Eap/insert').set(auth(token)).send({descricao:'Forbidden',idx_obra:otherWork})).status).toBe(403);
  expect((await request(app).put(`/api/Usuarios/insert/${field}`).set(auth(fieldToken)).send({ambiente:'Escritório'})).status).toBe(403);
  expect((await request(app).put(`/api/Obras/insert/${work}`).set(auth(token)).send({id_construtora:otherCompany})).status).toBe(403);
});

test.each(['public','office'])('modo %s: Canteiro não administra usuários nem obras',async mode=>{
  const previous=process.env.REGISTRATION_MODE;process.env.REGISTRATION_MODE=mode;
  try{
    expect((await request(app).put(`/api/usuarios/insert/${field}`).set(auth(fieldToken)).send({ambiente:'Escritório'})).status).toBe(403);
    expect((await request(app).delete(`/api/usuarios/del/${office}`).set(auth(fieldToken))).status).toBe(403);
    expect((await request(app).put(`/api/obras/insert/${work}`).set(auth(fieldToken)).send({nome:'Forbidden'})).status).toBe(403);
    expect((await request(app).put(`/api/usuarios/insert/${field}`).set(auth(fieldToken)).send({nome:'Own profile'})).status).toBe(200);
  }finally{process.env.REGISTRATION_MODE=previous;}
});

test('cadastro público não permite escolher construtora nem perfil privilegiado',async()=>{
  const previous=process.env.REGISTRATION_MODE;process.env.REGISTRATION_MODE='public';
  try{
    const body={nome:'Guest',email:crypto.randomUUID()+'@teste.local',senha:password};
    for(const extra of [{idconstrutora:company},{ambiente:'Escritório'},{status:'Inativo'}])expect((await request(app).post('/api/usuarios/insert').send({...body,...extra})).status).toBe(403);
    const result=await request(app).post('/api/usuarios/insert').send(body);expect(result.status).toBe(403);
    const [rows]=await pool.query('SELECT id_usuario FROM usuario WHERE email=?',[body.email]);expect(rows).toHaveLength(0);
    expect((await request(app).post('/api/usuarios/insert').set(auth(token)).send({...body,email:crypto.randomUUID()+'@teste.local',ambiente:'Canteiro',idconstrutora:company})).status).toBe(201);
  }finally{process.env.REGISTRATION_MODE=previous;}
});

test('objetos SQL, arrays, poluição de protótipo e JSON inválido são rejeitados',async()=>{
  const attempts=[
    request(app).get('/api/insumos?idobra=1&idobra=2').set(auth(token)),
    request(app).get('/api/insumos?idobra[idobra]=1').set(auth(token)),
    request(app).put(`/api/usuarios/insert/${field}`).set(auth(token)).send({nome:{nome:'unexpected'}}),
    request(app).post('/api/operacional/ocorrencias').set(auth(token)).set('Content-Type','application/json').send('{"constructor":{"prototype":{"polluted":true}}}'),
    request(app).post('/api/usuarios/login').set('Content-Type','application/json').send('{invalid'),
  ];
  for(const req of attempts){const r=await req;expect(r.status).toBe(400);expect(JSON.stringify(r.body)).not.toMatch(/SELECT|INSERT|SyntaxError|stack/);}
  expect({}.polluted).toBeUndefined();
});

test('corpo JSON acima do limite recebe 413 e não retorna detalhes internos',async()=>{
  const r=await request(app).post('/api/usuarios/login').send({email:'x'.repeat(110000),senha:password});expect(r.status).toBe(413);expect(r.body.stack).toBeUndefined();
});

test('cadastros concorrentes e edições não criam novos e-mails ambíguos entre construtoras',async()=>{
  const email=crypto.randomUUID()+'@teste.local';
  const otherToken=jwt.sign({id_usuario:otherUser},process.env.JWT_SECRET,{expiresIn:'1h'});
  const results=await Promise.all([[token,company],[otherToken,otherCompany]].map(([actor,tenant])=>request(app).post('/api/usuarios/insert').set(auth(actor)).send({nome:'Concurrent',email,senha:password,ambiente:'Canteiro',idconstrutora:tenant})));
  expect(results.map(r=>r.status).sort()).toEqual([201,400]);
  expect((await pool.query('SELECT COUNT(*) n FROM usuario WHERE email=?',[email]))[0][0].n).toBe(1);
  expect((await request(app).put(`/api/usuarios/insert/${field}`).set(auth(token)).send({email})).status).toBe(400);
});

test('e-mails legados duplicados são preservados em edições que não mudam o endereço',async()=>{
  const email=crypto.randomUUID()+'@teste.local';const ids=[];
  for(let i=0;i<2;i++)ids.push(await insert("INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES ('Legacy duplicate',?,'test-only','Canteiro',?)",[email,company]));
  expect((await request(app).put(`/api/usuarios/insert/${ids[0]}`).set(auth(token)).send({nome:'Edited legacy',email})).status).toBe(200);
  expect((await pool.query('SELECT id_usuario FROM usuario WHERE email=?',[email]))[0].map(r=>r.id_usuario)).toEqual(ids);
});

test('cadastro pelo Escritório valida senha, e-mail e ambiente antes de gravar',async()=>{
  const body={nome:'Validation',email:crypto.randomUUID()+'@teste.local',senha:password,ambiente:'Canteiro',idconstrutora:company};
  for(const extra of [{senha:'short'},{senha:'á'.repeat(37)},{email:'invalid'},{ambiente:'Administrador'},{status:'Unexpected'}])expect((await request(app).post('/api/usuarios/insert').set(auth(token)).send({...body,...extra})).status).toBe(400);
});

test('catálogo global de cargos permite consulta e rejeita alterações por qualquer construtora',async()=>{
  expect((await request(app).get('/api/cargos').set(auth(token))).status).toBe(200);
  for(const [method,path] of [['post','insert'],['put','insert/1'],['delete','del/1']])expect((await request(app)[method]('/api/cargos/'+path).set(auth(token)).send({nome_cargo:'Forbidden'})).status).toBe(403);
});

test('tokens inválidos, antigos, futuros e com campos inesperados são rejeitados',async()=>{
  const tokens=['invalid',jwt.sign({id_usuario:office},process.env.JWT_SECRET,{algorithm:'HS512'}),jwt.sign({id_usuario:office},process.env.JWT_SECRET,{expiresIn:-1}),jwt.sign({id_usuario:office,iat:Math.floor(Date.now()/1000)-9*3600},process.env.JWT_SECRET),jwt.sign({id_usuario:office},process.env.JWT_SECRET,{notBefore:'1h'}),jwt.sign({id_usuario:{id_usuario:office}},process.env.JWT_SECRET)];
  for(const t of tokens)expect((await request(app).get('/api/obras').set(auth(t))).status).toBe(401);
  expect((await request(app).get('/api/obras').set('Authorization','Bearer '+token+' extra')).status).toBe(401);
  expect((await request(app).get('/api/obras')).status).toBe(401);
});

test('login não enumera e-mail existente, inexistente, inativo ou duplicado',async()=>{
  const [rows]=await pool.query('SELECT email FROM usuario WHERE id_usuario=?',[field]);const email=rows[0].email;
  const known=await request(app).post('/api/usuarios/login').send({email,senha:'Wrong-password'});
  const unknown=await request(app).post('/api/usuarios/login').send({email:crypto.randomUUID()+'@teste.local',senha:'Wrong-password'});
  expect(known.status).toBe(401);expect(unknown.body).toEqual(known.body);
  await pool.query("UPDATE usuario SET status='Inativo' WHERE id_usuario=?",[field]);
  const inactive=await request(app).post('/api/usuarios/login').send({email,senha:password});expect(inactive.body).toEqual(known.body);
  await pool.query("UPDATE usuario SET status='Ativo' WHERE id_usuario=?",[field]);
});

test('troca de senha ou permissões invalida JWT emitido pelo login',async()=>{
  const [rows]=await pool.query('SELECT email FROM usuario WHERE id_usuario=?',[field]);
  const login=()=>request(app).post('/api/usuarios/login').send({email:rows[0].email,senha:password});
  let r=await login();expect(r.status).toBe(200);expect(jwt.decode(r.body.token).exp-jwt.decode(r.body.token).iat).toBe(8*3600);expect(r.body.usuario.senha).toBeUndefined();
  const old=r.body.token;
  expect((await request(app).get('/api/obras').set(auth(old))).status).toBe(200);
  await pool.query("UPDATE usuario SET ambiente='Escritório' WHERE id_usuario=?",[field]);
  expect((await request(app).get('/api/obras').set(auth(old))).status).toBe(401);
  r=await login();expect(r.status).toBe(200);
  await pool.query('UPDATE usuario SET senha=? WHERE id_usuario=?',[await bcrypt.hash('New-password-1234',10),field]);
  expect((await request(app).get('/api/obras').set(auth(r.body.token))).status).toBe(401);
  await pool.query("UPDATE usuario SET senha=?,ambiente='Canteiro' WHERE id_usuario=?",[await bcrypt.hash(password,10),field]);
});

test('migração de senhas legadas preserva conta, e-mail duplicado e login, com rollback no teste',async()=>{
  const c=await pool.getConnection();
  try{await c.beginTransaction();
    const email=crypto.randomUUID()+'@teste.local';
    const ids=[];for(let i=0;i<2;i++)ids.push((await c.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Legacy security',?,?,?)",[email,password,company]))[0].insertId);
    const tickets=await preparePasswordResets(c);expect(tickets.length).toBeGreaterThanOrEqual(2);
    const [rows]=await c.query('SELECT id_usuario,email,senha,idconstrutora FROM usuario WHERE email=?',[email]);
    expect(rows.map(r=>r.id_usuario)).toEqual(ids);expect(rows.every(r=>r.email===email&&r.idconstrutora===company)).toBe(true);
    for(const row of rows)expect(await bcrypt.compare(password,row.senha)).toBe(false);
    expect(await preparePasswordResets(c)).toEqual([]);
  }finally{await c.rollback();c.release();}
});
