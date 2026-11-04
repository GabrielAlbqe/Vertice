const request = require('supertest');
const crypto = require('crypto');
const sharp = require('sharp');
const app = require('../app');
const legacy = require('../config/connection');
const { pool } = require('../utils/operacional');
const jwt = require('jsonwebtoken');
let user, work, otherWork, activity, supply, team, machine, token, outsider, diary, occurrence, photo;
const headers = key => ({ Authorization: `Bearer ${token}`, 'Idempotency-Key': key || crypto.randomUUID() });
beforeAll(async () => {
  const [co] = await pool.query("INSERT INTO construtora(razao_social) VALUES ('Teste operacional')");
  const [other] = await pool.query("INSERT INTO construtora(razao_social) VALUES ('Outra construtora de teste')");
  const [u] = await pool.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Operador',?,'hash_teste',?)", [`op_${Date.now()}@teste.local`,co.insertId]); user=u.insertId;
  const [u2] = await pool.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Outro',?,'hash_teste',?)", [`out_${Date.now()}@teste.local`,other.insertId]);
  token=jwt.sign({id_usuario:user},process.env.JWT_SECRET);
  outsider=jwt.sign({id_usuario:u2.insertId},process.env.JWT_SECRET);
  async function newWork(company) { return (await pool.query("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Obra teste',?,1,'2026-01-01','2027-01-01',10000)",[company]))[0].insertId; }
  work=await newWork(co.insertId); otherWork=await newWork(other.insertId);
  activity=(await pool.query("INSERT INTO atividade_eap(descricao,idx_obra) VALUES ('Teste atividade',?)",[work]))[0].insertId;
  supply=(await pool.query("INSERT INTO cadastro_de_insumos(nome,quantidade_disponivel,idobra) VALUES ('Material teste',100,?)",[work]))[0].insertId;
  team=(await pool.query("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Equipe teste','Infraestrutura',2,100,2000,?)",[work]))[0].insertId;
  machine=(await pool.query("INSERT INTO cadastro_de_maquinario(nome,quantidade,idobra) VALUES ('Maquina teste',2,?)",[work]))[0].insertId;
});
afterAll(async()=>{await pool.end();await new Promise(resolve=>legacy.end(resolve));});
async function officeHeaders(){
  const company=(await pool.query('SELECT idconstrutora FROM usuario WHERE id_usuario=?',[user]))[0][0].idconstrutora;
  const actor=(await pool.query("INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES ('Auditor',?,'hash_teste','Escritório',?)",[crypto.randomUUID()+'@teste.local',company]))[0].insertId;
  return {Authorization:'Bearer '+jwt.sign({id_usuario:actor},process.env.JWT_SECRET)};
}
const payload=()=>({obrax_id:work,data:'2026-10-01',clima:'Ensolarado',turno:'Manhã',etapa_atuacao:'Infraestrutura',equipes:[team],terceirizadas:[],maquinarios:[{id:machine,quantidade:1}],observacoes:'Serviço do turno'});
test('diário transacional confirma recursos e replay não duplica',async()=>{
  const h=headers(),b=payload(); const first=await request(app).post('/api/operacional/diarios').set(h).send(b);expect(first.status).toBe(201);diary=first.body.insertId;
  const replay=await request(app).post('/api/operacional/diarios').set(h).send(b);expect(replay.status).toBe(200);expect(replay.body.insertId).toBe(diary);
  const detail=await request(app).get(`/api/operacional/diarios/${diary}`).set(headers());expect(detail.status).toBe(200);expect(detail.body.equipes).toHaveLength(1);expect(detail.body.maquinarios).toHaveLength(1);expect(detail.body.observacoes).toBe(b.observacoes);
  expect((await request(app).post('/api/operacional/diarios').set(headers()).send(b)).status).toBe(409);
  expect((await request(app).post('/api/operacional/diarios').set(h).send({...b,clima:'Chuvoso'})).status).toBe(409);
});
test('diário rejeita data, quantidade e obra de outra construtora',async()=>{
  for(const b of [{...payload(),data:'2026-02-30'},{...payload(),turno:'Tarde',maquinarios:[{id:machine,quantidade:3}]},{...payload(),obrax_id:otherWork}])expect((await request(app).post('/api/operacional/diarios').set(headers()).send(b)).status).toBeGreaterThanOrEqual(400);
  expect((await request(app).get(`/api/operacional/diarios/${diary}`).set('Authorization',`Bearer ${outsider}`)).status).toBe(404);
});
test('atividade valida avanço acumulado e mantém idempotência',async()=>{
  const h=headers(),b={obra_id:work,diario_id:diary,atividade_eap_id:activity,percentual_dia:70,url_foto:''};
  expect((await request(app).post('/api/operacional/atividades').set(h).send(b)).status).toBe(201);
  expect((await request(app).post('/api/operacional/atividades').set(h).send(b)).status).toBe(200);
  expect((await request(app).post('/api/operacional/atividades').set(headers()).send({...b,percentual_dia:40})).status).toBe(409);
});
test('material tem diário, autor e data sem baixa de estoque',async()=>{
  const h=headers(),b={obra_id:work,diario_id:diary,id_insumo:supply,id_atividade:activity,quantidade_consumida:2.5,tipo_compra:'Planejada',id_usuario:999999};
  const a=await request(app).post('/api/operacional/materiais').set(h).send(b);expect(a.status).toBe(201);
  const replay=await request(app).post('/api/operacional/materiais').set(h).send(b);expect(replay.body.insertId).toBe(a.body.insertId);
  const list=await request(app).get(`/api/operacional/materiais?obra_id=${work}`).set(headers());expect(list.status).toBe(200);expect(list.body[0].id_usuario).toBe(user);expect(list.body[0].diario_id).toBe(diary);expect(list.body[0].registrado_em).toBeTruthy();
  expect((await pool.query('SELECT quantidade_disponivel FROM cadastro_de_insumos WHERE id_insumos=?',[supply]))[0][0].quantidade_disponivel).toBe(100);
});
test('ocorrência tem resolução, histórico e replay sem duplicar',async()=>{
  const create=await request(app).post('/api/operacional/ocorrencias').set(headers()).send({obra_id:work,descricao:'Interferência',localizacao:'Pavimento 1',prioridade:'Alta'});expect(create.status).toBe(201);occurrence=create.body.insertId;
  const h=headers();const resolve=await request(app).post(`/api/operacional/ocorrencias/${occurrence}/resolver`).set(h).send({resolucao:'Interferência removida'});expect(resolve.status).toBe(200);
  expect((await request(app).post(`/api/operacional/ocorrencias/${occurrence}/resolver`).set(h).send({resolucao:'Interferência removida'})).status).toBe(200);
  const history=await request(app).get(`/api/operacional/ocorrencias/${occurrence}/historico`).set(headers());expect(history.body.map(h=>h.acao)).toEqual(['Criada','Resolvida']);
  expect((await request(app).get(`/api/operacional/ocorrencias?obra_id=${work}`).set('Authorization',`Bearer ${outsider}`)).status).toBe(403);
});
test('upload decodifica imagem, confirma e repete sem duplicar',async()=>{
  const image=await sharp({create:{width:12,height:12,channels:3,background:'#123456'}}).jpeg().toBuffer();const h={...headers(),'Content-Type':'image/jpeg'},url=`/api/operacional/fotos?obra_id=${work}&descricao=Foto%20teste`;
  const first=await request(app).post(url).set(h).send(image);expect(first.status).toBe(201);photo=first.body.insertId;
  const repeat=await request(app).post(url).set(h).send(image);expect(repeat.status).toBe(200);expect(repeat.body.insertId).toBe(photo);
  const file=await request(app).get(`/api/operacional/fotos/${photo}/arquivo`).set(headers());expect(file.status).toBe(200);expect(file.headers['content-type']).toMatch(/image\/webp/);expect(file.headers['cache-control']).toContain('no-store');
  expect((await request(app).get(`/api/operacional/fotos/${photo}/arquivo`).set('Authorization',`Bearer ${outsider}`)).status).toBe(404);
  expect((await request(app).get(`/api/operacional/fotos/${photo}/arquivo`)).status).toBe(401);
});
test('upload rejeita arquivos falsos, SVG e mais de 5 MB',async()=>{
  const url=`/api/operacional/fotos?obra_id=${work}&descricao=invalida`;
  expect((await request(app).post(url).set({...headers(),'Content-Type':'image/jpeg'}).send(Buffer.from('<script>bad</script>'))).status).toBe(400);
  expect((await request(app).post(url).set({...headers(),'Content-Type':'image/svg+xml'}).send('<svg/>')).status).toBe(415);
  expect((await request(app).post(url).set({...headers(),'Content-Type':'image/jpeg'}).send(Buffer.alloc(5*1024*1024+1))).status).toBe(413);
});
test('endpoints legados isolam listagem, leitura e escrita entre construtoras',async()=>{
  const h=await officeHeaders();
  const works=await request(app).get('/api/obras').set(h);expect(works.status).toBe(200);expect(works.body.some(w=>w.id_obra===work)).toBe(true);expect(works.body.some(w=>w.id_obra===otherWork)).toBe(false);
  const foreign=await request(app).get(`/api/obras/${otherWork}`).set(h);expect(foreign.status).toBe(404);
  const edit=await request(app).put(`/api/obras/insert/${otherWork}`).set(h).send({nome:'Tentativa',id_construtora:(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[work]))[0][0].id_construtora});expect(edit.status).toBe(404);
  const deletion=await request(app).delete(`/api/obras/del/${otherWork}`).set(h);expect(deletion.status).toBe(404);
  const company=(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[otherWork]))[0][0].id_construtora;
  const transfer=await request(app).put(`/api/obras/insert/${work}`).set(h).send({id_construtora:company});expect(transfer.status).toBe(403);
  const cross=await request(app).post('/api/atividades-eap/insert').set(h).send({descricao:'Invasão',idx_obra:otherWork});expect(cross.status).toBe(403);
  const fake=jwt.sign({id_usuario:user,idconstrutora:company},process.env.JWT_SECRET);
  const spoof=await request(app).get('/api/obras').set('Authorization',`Bearer ${fake}`);expect(spoof.body.some(w=>w.id_obra===otherWork)).toBe(false);
  const diaries=await request(app).get(`/api/diarios-obra?obrax_id=${work}`).set('Authorization',`Bearer ${outsider}`);expect(diaries.status).toBe(200);expect(diaries.body).toEqual([]);
});
test('modo office bloqueia cadastro anônimo, cadastro por Canteiro e escalada de perfil',async()=>{
  const b={nome:'Tentativa',email:`novo_${Date.now()}@teste.local`,senha:'teste-nao-real',idconstrutora:1};
  expect((await request(app).post('/api/usuarios/insert').send(b)).status).toBe(401);
  expect((await request(app).post('/api/usuarios/insert').set(headers()).send(b)).status).toBe(403);
  expect((await request(app).put(`/api/usuarios/insert/${user}`).set(headers()).send({ambiente:'Escritório'})).status).toBe(403);
});
test('CORS, preflight de upload e cabeçalhos de segurança',async()=>{
  const allowed=await request(app).get('/api/health').set('Origin','http://localhost:5173');expect(allowed.status).toBe(200);expect(allowed.headers['access-control-allow-origin']).toBe('http://localhost:5173');expect(allowed.headers['x-content-type-options']).toBe('nosniff');expect(allowed.headers['x-request-id']).toBeTruthy();expect(allowed.headers['x-powered-by']).toBeUndefined();
  const denied=await request(app).get('/api/health').set('Origin','https://outra.test');expect(denied.status).toBe(403);
  const options=await request(app).options('/api/operacional/fotos').set({'Origin':'http://localhost:5173','Access-Control-Request-Method':'POST','Access-Control-Request-Headers':'content-type,idempotency-key,authorization'});expect(options.status).toBe(204);expect(options.headers['access-control-allow-headers']).toContain('idempotency-key');
});
test('cadastro pelo Escritório cria usuário da própria construtora e permite login',async()=>{
  const company=(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[work]))[0][0].id_construtora;
  const office=(await pool.query("INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES ('Escritorio',?,'hash_teste','Escritório',?)",[`office_${Date.now()}@teste.local`,company]))[0].insertId;
  const h={Authorization:`Bearer ${jwt.sign({id_usuario:office},process.env.JWT_SECRET)}`};
  const body={nome:'Colega cadastrado',email:`colega_${Date.now()}@teste.local`,senha:'teste-unitario-123',ambiente:'Canteiro',ocupacao:'Operador',idconstrutora:company};
  const created=await request(app).post('/api/usuarios/insert').set(h).send(body);expect(created.status).toBe(201);
  const login=await request(app).post('/api/usuarios/login').send({email:body.email,senha:body.senha});expect(login.status).toBe(200);expect(login.body.usuario.idconstrutora).toBe(company);expect(login.body.usuario.senha).toBeUndefined();
  const foreign=(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[otherWork]))[0][0].id_construtora;
  expect((await request(app).post('/api/usuarios/insert').set(h).send({...body,email:'foreign@teste.local',idconstrutora:foreign})).status).toBe(403);
});
test('documento CSV tem dados reais e bloqueia acesso de outra construtora',async()=>{
  const r=await request(app).get(`/api/operacional/diarios/${diary}/documento`).set(headers());expect(r.status).toBe(200);expect(r.headers['content-type']).toContain('text/csv');expect(r.headers['content-disposition']).toContain('attachment');expect(r.text).toContain('Serviço do turno');expect(r.text).toContain('Equipe teste');
  expect((await request(app).get(`/api/operacional/diarios/${diary}/documento`).set('Authorization',`Bearer ${outsider}`)).status).toBe(404);
  expect(require('../utils/csv').cell(' =HYPERLINK("invalido")')).toContain("' =HYPERLINK");
});
test('JWT expirado ou algoritmo diferente é rejeitado',async()=>{
  for(const t of [jwt.sign({id_usuario:user},process.env.JWT_SECRET,{expiresIn:-1}),jwt.sign({id_usuario:user},process.env.JWT_SECRET,{algorithm:'HS512'})])expect((await request(app).get('/api/obras').set('Authorization',`Bearer ${t}`)).status).toBe(401);
});
test('gestão agrega dados reais, filtra período, exporta CSV e isola construtora',async()=>{
  const url=`/api/operacional/gestao/resumo?obra_id=${work}&inicio=2026-10-01&fim=2026-10-01`;
  const r=await request(app).get(url).set(headers());expect(r.status).toBe(200);expect(r.body.diarios).toHaveLength(1);expect(Number(r.body.atividades.find(a=>a.id_atividade===activity).avanco_periodo)).toBe(70);expect(r.body.obras[0].id_obra).toBe(work);
  expect(r.body.periodo_anterior.inicio).toBe('2026-09-30');expect(r.body.periodo_anterior.fim).toBe('2026-09-30');
  const empty=await request(app).get(`/api/operacional/gestao/resumo?obra_id=${work}&inicio=2026-09-01&fim=2026-09-30`).set(headers());expect(empty.status).toBe(200);expect(empty.body.diarios).toEqual([]);expect(empty.body.atividades.find(a=>a.id_atividade===activity).avanco_periodo).toBeNull();
  expect((await request(app).get(url).set('Authorization',`Bearer ${outsider}`)).status).toBe(403);
  for(const period of ['inicio=2026-02-30','inicio=2026-10-10&fim=2026-10-01','inicio[]=2026-10-01'])expect((await request(app).get(`/api/operacional/gestao/resumo?${period}`).set(headers())).status).toBe(400);
  const report=await request(app).get(`/api/operacional/gestao/relatorio.csv?obra_id=${work}`).set(headers());expect(report.status).toBe(200);expect(report.headers['content-type']).toContain('text/csv');expect(report.text).toContain('Material teste');expect(report.text).toContain('Equipe');
  const resources=await request(app).get('/api/operacional/gestao/recursos').set(headers());expect(resources.status).toBe(200);expect(resources.body.insumos.some(i=>i.id_insumos===supply)).toBe(true);expect(resources.body.insumos.every(i=>i.idobra===work)).toBe(true);
});
test('foto duplicada preserva registro original; filtros e paginação são privados',async()=>{
  const image=await sharp({create:{width:12,height:12,channels:3,background:'#123456'}}).jpeg().toBuffer();
  const duplicate=await request(app).post(`/api/operacional/fotos?obra_id=${work}&descricao=Outra%20descricao`).set({...headers(),'Content-Type':'image/jpeg'}).send(image);
  expect(duplicate.status).toBe(201);expect(duplicate.body.insertId).toBe(photo);expect(duplicate.body.deduplicada).toBe(true);
  const list=await request(app).get(`/api/operacional/fotos?obra_id=${work}&busca=Foto%20teste&limite=1`).set(headers());expect(list.status).toBe(200);expect(list.body).toHaveLength(1);expect(list.body[0].descricao).toBe('Foto teste');
  expect((await request(app).get(`/api/operacional/fotos?obra_id=${work}&antes=${photo}`).set(headers())).body).toEqual([]);
  expect((await request(app).get(`/api/operacional/fotos?obra_id=${work}&limite=201`).set(headers())).status).toBe(400);
});
test('edição parcial não associa recursos de obras distintas da mesma construtora',async()=>{
  const h=await officeHeaders();
  const company=(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[work]))[0][0].id_construtora;
  const w=(await pool.query("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Outra obra própria',?,1,'2026-01-01','2027-01-01',1000)",[company]))[0].insertId;
  const a=(await pool.query("INSERT INTO atividade_eap(descricao,idx_obra) VALUES ('Outra atividade',?)",[w]))[0].insertId;
  const point=(await pool.query('SELECT id_apontamento FROM apontamento_fisico WHERE diario_id=?',[diary]))[0][0].id_apontamento;
  const r=await request(app).put(`/api/apontamentos-fisicos/insert/${point}`).set(h).send({atividade_eap_id:a});expect(r.status).toBe(400);
  expect((await pool.query('SELECT atividade_eap_id FROM apontamento_fisico WHERE id_apontamento=?',[point]))[0][0].atividade_eap_id).toBe(activity);
});
test('erro SQL legado mantém contrato e não expõe comando, coluna ou valores',async()=>{
  const [actors]=await pool.query("SELECT id_usuario,idconstrutora FROM usuario WHERE ambiente='Escritório' ORDER BY id_usuario LIMIT 1");
  const actor=actors[0],h={Authorization:`Bearer ${jwt.sign({id_usuario:actor.id_usuario},process.env.JWT_SECRET)}`};
  const r=await request(app).post('/api/usuarios/insert').set(h).send({nome:null,email:'erro-sql@teste.local',senha:'senha-somente-teste',idconstrutora:actor.idconstrutora});
  expect(r.status).toBe(400);expect(r.body.error).toBe('Dados inválidos, duplicados ou vinculados a outros registros.');expect(JSON.stringify(r.body)).not.toMatch(/INSERT|Column|senha-somente-teste|cannot be null/);
});
test('ocorrência tem classificação, encarregado, prazo e atualização com conflito e histórico',async()=>{
  const created=await request(app).post('/api/operacional/ocorrencias').set(headers()).send({obra_id:work,descricao:'Pendência com prazo',localizacao:'Setor de teste',prioridade:'Critica',classificacao:'Segurança',responsavel_id:user,prazo_previsto:'2026-11-01'});expect(created.status).toBe(201);
  const identifier=created.body.insertId;
  const old={prioridade:'Critica',classificacao:'Segurança',responsavel_id:user,prazo_previsto:'2026-11-01'};
  const body={...old,classificacao:'Qualidade',prazo_previsto:'2026-11-02',anterior:old},h=headers();
  expect((await request(app).post(`/api/operacional/ocorrencias/${identifier}/acompanhar`).set(h).send(body)).status).toBe(200);
  expect((await request(app).post(`/api/operacional/ocorrencias/${identifier}/acompanhar`).set(h).send(body)).status).toBe(200);
  expect((await request(app).post(`/api/operacional/ocorrencias/${identifier}/acompanhar`).set(headers()).send({...body,classificacao:'Conflito'})).status).toBe(409);
  const otherUser=jwt.decode(outsider).id_usuario;
  expect((await request(app).post('/api/operacional/ocorrencias').set(headers()).send({obra_id:work,descricao:'Inválida',localizacao:'Teste',prioridade:'Alta',responsavel_id:otherUser})).status).toBe(400);
  const history=await request(app).get(`/api/operacional/ocorrencias/${identifier}/historico`).set(headers());expect(history.body.map(h=>h.acao)).toEqual(['Criada','Atualizada']);
});
test('foto vincula atividade e retirada lógica é autorizada, idempotente e auditada',async()=>{
  const image=await sharp({create:{width:10,height:10,channels:3,background:'#abcdef'}}).jpeg().toBuffer();
  const r=await request(app).post(`/api/operacional/fotos?obra_id=${work}&descricao=Foto%20auditada&atividade_id=${activity}`).set({...headers(),'Content-Type':'image/jpeg'}).send(image);expect(r.status).toBe(201);
  const identifier=r.body.insertId;
  const list=await request(app).get(`/api/operacional/fotos?obra_id=${work}&atividade_id=${activity}`).set(headers());expect(list.body.some(f=>f.id_foto===identifier&&f.atividade==='Teste atividade')).toBe(true);
  expect((await request(app).delete(`/api/operacional/fotos/${identifier}`).set('Authorization',`Bearer ${outsider}`).set('Idempotency-Key',crypto.randomUUID()).send({motivo:'Invasão'})).status).toBe(404);
  const h=headers();expect((await request(app).delete(`/api/operacional/fotos/${identifier}`).set(h).send({motivo:'Arquivo repetido no relatório'})).status).toBe(200);
  expect((await request(app).delete(`/api/operacional/fotos/${identifier}`).set(h).send({motivo:'Arquivo repetido no relatório'})).status).toBe(200);
  expect((await request(app).get(`/api/operacional/fotos/${identifier}/arquivo`).set(headers())).status).toBe(404);
  expect((await pool.query('SELECT excluido_em,arquivo FROM foto_obra WHERE id_foto=?',[identifier]))[0][0].excluido_em).toBeTruthy();
  const archived=await request(app).get(`/api/operacional/fotos?obra_id=${work}&excluidas=true`).set(headers());expect(archived.body.some(f=>f.id_foto===identifier)).toBe(true);
  const history=await request(app).get(`/api/operacional/fotos/${identifier}/historico`).set(headers());expect(history.body.map(h=>h.acao)).toEqual(['Enviada','Excluida']);
});
test('login rejeita e-mail ambíguo sem escolher a primeira empresa nem alterar contas',async()=>{
  const email=`ambiguo_${Date.now()}@teste.local`,company=(await pool.query('SELECT id_construtora FROM obra WHERE id_obra=?',[work]))[0][0].id_construtora;
  for(let i=0;i<2;i++)await pool.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Duplicado de teste',?,'senha-teste-legada',?)",[email,company]);
  const r=await request(app).post('/api/usuarios/login').send({email,senha:'senha-teste-legada'});expect(r.status).toBe(401);expect(r.body.token).toBeUndefined();
  const [rows]=await pool.query('SELECT senha FROM usuario WHERE email=?',[email]);expect(rows).toHaveLength(2);expect(rows.every(u=>u.senha==='senha-teste-legada')).toBe(true);
});
