const fs=require('fs'),path=require('path'),crypto=require('crypto'),request=require('supertest'),jwt=require('jsonwebtoken');
const app=require('../app'),pool=require('../config/operacional'),legacy=require('../config/connection');
const base='/api/operacional/gestao/operacoes';
const migration=fs.readFileSync(path.join(__dirname,'../database/migrations/006_gestao_integrada.sql'),'utf8');
const execute=require('../database/executeSql');
let company,foreign,work,otherWork,material,machine,stage,team,activity,user,fieldUser,token,field,outsider,firstPreserved;
const insert=async(sql,args=[])=>(await pool.query(sql,args))[0].insertId;
const headers=(value=token,key=crypto.randomUUID())=>({Authorization:'Bearer '+value,'Idempotency-Key':key});
const get=(route,t=token)=>request(app).get(base+route).set(headers(t));
const post=(route,body,t=token,h=headers(t))=>request(app).post(base+route).set(h).send({obra_id:work,...body});
const put=(route,body,t=token)=>request(app).put(base+route).set(headers(t)).send({obra_id:work,...body});
async function snapshot(c){const [tables]=await c.query("SELECT TABLE_NAME n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");const result={};for(const t of tables){const [rows]=await c.query('SELECT * FROM ??',[t.n]);result[t.n]=crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex');}return result;}
beforeAll(async()=>{
 if(!/^vertice_test_/.test(process.env.DB_NAME||''))throw Error('Banco isolado obrigatório.');
 await pool.query(fs.readFileSync(path.join(__dirname,'../database/migrations/005_profissionais.sql'),'utf8'));
 company=await insert("INSERT INTO construtora(razao_social) VALUES ('Gestao4')");foreign=await insert("INSERT INTO construtora(razao_social) VALUES ('Gestao4 foreign')");
 async function newUser(tenant,role){const id=await insert('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Gestao4',crypto.randomUUID()+'@teste.local','isolated-fixture',role,tenant]);return {id,token:jwt.sign({id_usuario:id},process.env.JWT_SECRET)};}
 const a=await newUser(company,'Escritório'),b=await newUser(company,'Canteiro');user=a.id;fieldUser=b.id;token=a.token;field=b.token;outsider=(await newUser(foreign,'Escritório')).token;
 async function newWork(tenant){return insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Gestao4',?,1,'2026-01-01','2027-01-01',1000)",[tenant]);}
 work=await newWork(company);otherWork=await newWork(foreign);
 material=await insert("INSERT INTO cadastro_de_insumos(nome,quantidade_disponivel,valor_unitario,idobra) VALUES ('Cimento4',10,5,?)",[work]);
 machine=await insert("INSERT INTO cadastro_de_maquinario(nome,quantidade,custo_diario,status,idobra) VALUES ('Maquina4',1,100,'Ativo',?)",[work]);
 stage=await insert("INSERT INTO etapa(id_obra,nome_etapa) VALUES (?,'Infraestrutura')",[work]);
 activity=await insert("INSERT INTO atividade_eap(descricao,idx_obra) VALUES ('Atividade4',?)",[work]);
 team=await insert("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Equipe4','Infraestrutura',2,10,100,?)",[work]);
 const c=await pool.getConnection();try{const before=await snapshot(c);await execute(c,migration);const after=await snapshot(c);firstPreserved=Object.entries(before).every(([name,hash])=>after[name]===hash);}finally{c.release();}
},30000);
afterAll(async()=>{await pool.end();await new Promise(r=>legacy.end(r));});
test('006: primeira execução preserva integralmente as tabelas anteriores',()=>expect(firstPreserved).toBe(true));
test('estoque: exige configuração e não altera saldo incompleto',async()=>{
 const r=await post('/estoque',{insumo_id:material,tipo:'Saida',quantidade:1,competencia:'2026-10-01',descricao:'Teste'});expect(r.status).toBe(409);
 expect((await put('/estoque/'+material,{unidade:'saco',minimo:5})).status).toBe(201);
 expect((await put('/estoque/'+material,{unidade:'saco',minimo:5},field)).status).toBe(403);
});
test('estoque: entrada transacional, replay e saldo preservado em erro',async()=>{
 const body={obra_id:work,insumo_id:material,tipo:'Entrada',quantidade:3,competencia:'2026-10-01',descricao:'Recebimento'},h=headers();
 const first=await post('/estoque',body,token,h);expect(first.status).toBe(201);expect(first.body.saldo).toBe(13);
 expect((await post('/estoque',body,token,h)).body.insertId).toBe(first.body.insertId);
 for(const quantity of [-1,0,1.5,1000])expect((await post('/estoque',{...body,tipo:'Saida',quantidade:quantity})).status).toBeGreaterThanOrEqual(400);
 const r=await get('/estoque?obra_id='+work);expect(r.body.materiais[0].quantidade_disponivel).toBe(13);expect(r.body.movimentos).toHaveLength(1);
});
test('estoque: concorrência não permite saldo negativo',async()=>{
 const b={insumo_id:material,tipo:'Saida',quantidade:8,competencia:'2026-10-01',descricao:'Saída concorrente'};
 const responses=await Promise.all([post('/estoque',b),post('/estoque',b)]);expect(responses.map(r=>r.status).sort()).toEqual([201,409]);
 expect((await get('/estoque?obra_id='+work)).body.materiais[0].quantidade_disponivel).toBe(5);
});
test('estoque: consumo operacional só baixa mediante confirmação explícita única',async()=>{
 const b={obra_id:work,id_insumo:material,id_atividade:activity,quantidade_consumida:2,tipo_compra:'Planejada'};
 const use=await request(app).post('/api/operacional/materiais').set(headers(field)).send(b);expect(use.status).toBe(201);
 expect((await get('/estoque?obra_id='+work)).body.materiais[0].quantidade_disponivel).toBe(5);
 const move={insumo_id:material,tipo:'Saida',quantidade:2,competencia:'2026-10-02',descricao:'Confirmação',apropriacao_id:use.body.insertId};
 expect((await get('/estoque?obra_id='+work,field)).body.consumos.some(r=>r.id_apropriacao===use.body.insertId)).toBe(true);
 expect((await post('/estoque',move,field)).status).toBe(201);
 expect((await get('/estoque?obra_id='+work,field)).body.consumos.some(r=>r.id_apropriacao===use.body.insertId)).toBe(false);expect((await post('/estoque',move,field)).status).toBe(409);
 expect((await post('/estoque',{...move,tipo:'Entrada'},field)).status).toBe(403);
 expect((await request(app).put('/api/insumos/insert/'+material).set(headers()).send({idobra:work,nome:'Cimento4',valor_unitario:5,quantidade_disponivel:10})).status).toBe(409);
});
const plan=()=>({inicio_previsto:'2026-10-01',fim_previsto:'2026-10-02',inicio_real:null,fim_real:null,responsavel_id:user,situacao:'Planejada',progresso:null,critica:true,atividade_id:activity});
test('cronograma: planejamento com dados explícitos, alertas e ausência de avanço inventado',async()=>{
 expect((await put('/cronograma/'+stage,plan())).status).toBe(201);
 const r=await get('/cronograma?obra_id='+work);expect(r.status).toBe(200);expect(r.body[0].progresso).toBeNull();expect(r.body[0].atrasada).toBe(1);expect(r.body[0].atividade_id).toBe(activity);
});
test('cronograma: Canteiro atualiza execução sem alterar planejamento ou responsáveis',async()=>{
 expect((await put('/cronograma/'+stage,{situacao:'Em andamento',progresso:20,inicio_real:'2026-10-02',fim_real:null},field)).status).toBe(201);
 expect((await put('/cronograma/'+stage,{...plan(),fim_previsto:'2026-12-30'},field)).status).toBe(403);
 expect((await put('/cronograma/'+stage,{...plan(),progresso:101})).status).toBe(400);
 expect((await put('/cronograma/'+stage,{...plan(),situacao:'Concluida',progresso:100})).status).toBe(400);
});
test('cronograma: cadastro evita duplicidade e impede datas e referências inválidas',async()=>{
 expect((await post('/cronograma',{nome:'Instalações'})).status).toBe(201);expect((await post('/cronograma',{nome:'Instalações'})).status).toBe(409);
 for(const b of [{fim_previsto:'2026-09-01'},{inicio_previsto:'2026-02-30'},{responsavel_id:99999999},{atividade_id:99999999}])expect((await put('/cronograma/'+stage,{...plan(),...b})).status).toBeGreaterThanOrEqual(400);
});
const usage=()=>({maquinario_id:machine,tipo:'Utilizacao',inicio:'2026-10-01',fim:'2026-10-01',horas:4,descricao:'Uso real declarado'});
test('maquinários: horas, replay e sobreposição sem despesas automáticas',async()=>{
 const h=headers(field),first=await post('/maquinas',usage(),field,h);expect(first.status).toBe(201);expect((await post('/maquinas',usage(),field,h)).body.insertId).toBe(first.body.insertId);
 expect((await post('/maquinas',usage(),field)).status).toBe(409);expect((await post('/maquinas',{...usage(),inicio:'2026-10-02',fim:'2026-10-02',horas:25})).status).toBe(400);
 expect((await pool.query('SELECT COUNT(*) n FROM custo_realizado WHERE id_obra=?',[work]))[0][0].n).toBe(0);
});
test('maquinários: manutenção vinculada, conclusão única e notificações atualizadas',async()=>{
 const p=await post('/maquinas',{...usage(),tipo:'Manutencao prevista',inicio:'2026-10-02',fim:'2026-10-05',horas:null});expect(p.status).toBe(201);
 expect((await post('/maquinas',{...usage(),inicio:'2026-10-03',fim:'2026-10-03'})).status).toBe(409);
 expect((await post('/maquinas',{...usage(),tipo:'Manutencao concluida',inicio:'2026-10-03',fim:'2026-10-03',manutencao_id:p.body.insertId,horas:null})).status).toBe(201);
 expect((await post('/maquinas',{...usage(),inicio:'2026-10-04',fim:'2026-10-04'})).status).toBe(201);
 expect((await get('/notificacoes?obra_id='+work)).body.some(n=>n.chave==='manutencao:'+p.body.insertId)).toBe(false);
});
test('maquinários: Canteiro não altera custos, manutenção ou disponibilidade',async()=>{
 for(const change of [{tipo:'Indisponibilidade'},{tipo:'Manutencao prevista'},{custo:100}])expect((await post('/maquinas',{...usage(),...change},field)).status).toBe(403);
});
test('notificações: deduplicação, leitura individual, referência válida e isolamento',async()=>{
 const r=await get('/notificacoes?obra_id='+work);expect(r.status).toBe(200);expect(r.body.some(n=>n.chave==='estoque:'+material)).toBe(true);expect(new Set(r.body.map(n=>n.chave)).size).toBe(r.body.length);
 const note=r.body[0];expect((await post('/notificacoes/lida',{chave:note.chave})).status).toBe(201);
 expect((await get('/notificacoes?obra_id='+work)).body.find(n=>n.chave===note.chave).lida).toBe(true);
 expect((await get('/notificacoes?obra_id='+work,field)).body.find(n=>n.chave===note.chave).lida).toBe(false);
 expect((await post('/notificacoes/lida',{chave:'estoque:999999'})).status).toBe(404);
});
test('profissionais: histórico transacional dos vínculos, sem duplicar em replay',async()=>{
 const p={codigo:'V4-P',nome:'Profissional4',cargo:'Operador',equipe_id:team,ativo:true},h=headers();
 const created=await request(app).post('/api/operacional/gestao/pessoas').set(h).send(p);expect(created.status).toBe(201);
 await request(app).post('/api/operacional/gestao/pessoas').set(h).send(p);
 expect((await request(app).put('/api/operacional/gestao/pessoas/'+created.body.insertId).set(headers()).send({...p,equipe_id:null,ativo:false})).status).toBe(201);
 const history=await get('/historico?recurso=pessoas&recurso_id='+created.body.insertId);expect(history.body).toHaveLength(2);
 const detail=typeof history.body[0].detalhes==='string'?JSON.parse(history.body[0].detalhes):history.body[0].detalhes;expect(detail.anterior.equipe_id).toBe(team);expect(detail.atual.equipe_id).toBeNull();
});
test('despesas: categoria e descrição preservam valor real e histórico',async()=>{
 const rdo=await insert("INSERT INTO rdo(id_obra,data_rdo,turno,clima) VALUES (?,'2026-10-01','Integral','Ensolarado')",[work]);
 const r=await request(app).post('/api/operacional/gestao/custos').set(headers()).send({id_obra:work,id_etapa:stage,id_rdo:rdo,origem_custo:'Insumo',id_origem:material,data:'2026-10-01',quantidade:2,custo_unitario:5,categoria:'Materiais',descricao:'Nota fiscal confirmada'});expect(r.status).toBe(201);
 const list=await request(app).get('/api/operacional/gestao/custos?obra_id='+work).set(headers());expect(Number(list.body[0].valor_total)).toBe(10);expect(list.body[0].categoria).toBe('Materiais');expect(list.body[0].descricao).toBe('Nota fiscal confirmada');
});
test('permissões: módulos novos bloqueiam visitantes, obra estrangeira e histórico do Canteiro',async()=>{
 expect((await get('/estoque')).status).toBe(400);
 for(const route of ['/estoque','/cronograma','/maquinas','/notificacoes']){expect((await get(route+'?obra_id='+work,outsider)).status).toBe(403);expect((await request(app).get(base+route+'?obra_id='+work)).status).toBe(401);}
 expect((await get('/historico?obra_id='+work,field)).status).toBe(403);
 expect((await post('/estoque',{obra_id:otherWork,insumo_id:material,tipo:'Entrada',quantidade:1,competencia:'2026-10-01',descricao:'Teste'})).status).toBe(403);
});
test('histórico: filtros por obra, período e recurso sem segredos',async()=>{
 const list=await get('/historico?obra_id='+work+'&recurso=estoque');expect(list.status).toBe(200);expect(list.body.length).toBeGreaterThan(0);expect(list.body.every(r=>r.construtora_id===company&&r.usuario_id&&r.registrado_em)).toBe(true);
 expect(JSON.stringify(list.body)).not.toMatch(/senha|password|token|secret|authorization/i);
 expect((await get('/historico?inicio=2026-10-30&fim=2026-01-01')).status).toBe(400);
});
test('006: reexecução preserva todas as tabelas populadas, FKs e índices',async()=>{
 const c=await pool.getConnection();try{const before=await snapshot(c);await execute(c,migration);expect(await snapshot(c)).toEqual(before);
 const [keys]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
 for(const k of keys){const [invalid]=await c.query('SELECT COUNT(*) n FROM ?? a LEFT JOIN ?? b ON a.??=b.?? WHERE a.?? IS NOT NULL AND b.?? IS NULL',[k.TABLE_NAME,k.REFERENCED_TABLE_NAME,k.COLUMN_NAME,k.REFERENCED_COLUMN_NAME,k.COLUMN_NAME,k.REFERENCED_COLUMN_NAME]);expect(invalid[0].n).toBe(0);}
 expect((await get('/estado')).body.habilitado).toBe(true);
 }finally{c.release();}
},30000);
test('auditoria: cadastro, desativação e reativação de conta são atômicos e não registram senha',async()=>{
 const email=crypto.randomUUID()+'@teste.local';
 const created=await request(app).post('/api/usuarios/insert').set(headers()).send({nome:'Conta4',email,senha:'Isolado-auditoria-456',ambiente:'Canteiro',status:'Ativo',idconstrutora:company});expect(created.status).toBe(201);
 const target=(await pool.query('SELECT id_usuario FROM usuario WHERE email=?',[email]))[0][0].id_usuario;
 for(const status of ['Inativo','Ativo'])expect((await request(app).put('/api/usuarios/insert/'+target).set(headers()).send({status})).status).toBe(200);
 const history=await get('/historico?recurso=usuario&recurso_id='+target);expect(history.status).toBe(200);expect(history.body).toHaveLength(3);
 expect(JSON.stringify(history.body)).not.toMatch(/Isolado-auditoria|senha|password|token|secret/i);
 expect(history.body.every(r=>r.usuario_id===user)).toBe(true);
});
test('estoque: auditoria e saldo fazem rollback juntos em falha de persistência',async()=>{
 const before=(await get('/estoque?obra_id='+work)).body;
 await pool.query("CREATE TRIGGER gestao4_audit_fail BEFORE INSERT ON gestao_auditoria FOR EACH ROW BEGIN IF NEW.evento='Movimentação de estoque' THEN SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='isolated audit failure'; END IF; END");
 try{expect((await post('/estoque',{insumo_id:material,tipo:'Entrada',quantidade:1,competencia:'2026-10-01',descricao:'Rollback isolado'})).status).toBe(500);}finally{await pool.query('DROP TRIGGER gestao4_audit_fail');}
 const after=(await get('/estoque?obra_id='+work)).body;expect(after.materiais[0].quantidade_disponivel).toBe(before.materiais[0].quantidade_disponivel);expect(after.movimentos).toHaveLength(before.movimentos.length);
});
test('notificações: período usa datas reais e rejeita filtros inválidos',async()=>{
 const r=await get('/notificacoes?obra_id='+work+'&inicio=2026-10-01&fim=2026-10-01');expect(r.status).toBe(200);
 expect(r.body.every(n=>n.data==='2026-10-01')).toBe(true);expect(r.body.some(n=>n.chave==='etapa:'+stage)).toBe(false);
 expect((await get('/notificacoes?obra_id='+work+'&inicio=2026-02-30')).status).toBe(400);
});


test('cronograma: rejeita execução sem início e término incompatível sem persistir',async()=>{
 const before=(await get('/cronograma?obra_id='+work)).body;
 for(const change of [{progresso:10},{inicio_real:'2026-10-01'},{situacao:'Em andamento',inicio_real:'2026-10-01',fim_real:'2026-10-02',progresso:30},{situacao:'Em andamento',inicio_real:'2026-10-01',progresso:100}]){
  expect((await put('/cronograma/'+stage,{...plan(),...change})).status).toBe(400);
 }
 expect((await get('/cronograma?obra_id='+work)).body).toEqual(before);
});
test('cronograma: avanço do Canteiro permanece separado da declaração da etapa',async()=>{
 const diary=await insert("INSERT INTO diario_obra(data,obrax_id,usuario_id) VALUES ('2026-10-01',?,?)",[work,fieldUser]);
 await insert("INSERT INTO apontamento_fisico(percentual_dia,url_foto,diario_id,atividade_eap_id) VALUES (15,'',?,?)",[diary,activity]);
 const planned=(await get('/cronograma?obra_id='+work)).body.find(r=>r.id_etapa===stage);
 expect(Number(planned.progresso_canteiro)).toBe(15);expect(Number(planned.progresso)).toBe(20);expect(planned.atividade).toBe('Atividade4');
});
test('manutenção: notificação referencia o equipamento e evento informa conclusão',async()=>{
 const event=await post('/maquinas',{...usage(),tipo:'Manutencao prevista',inicio:'2026-09-01',fim:'2026-09-02',horas:null});expect(event.status).toBe(201);
 const note=(await get('/notificacoes?obra_id='+work)).body.find(n=>n.chave==='manutencao:'+event.body.insertId);
 expect(note.recurso_id).toBe(machine);
 const events=(await get('/maquinas?obra_id='+work)).body;
 expect(events.find(e=>e.id===event.body.insertId).concluida).toBe(0);
 expect(events.find(e=>e.tipo==='Manutencao prevista'&&e.id!==event.body.insertId).concluida).toBe(1);
});
