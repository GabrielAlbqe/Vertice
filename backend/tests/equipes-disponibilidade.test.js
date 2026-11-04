const fs=require('fs'),path=require('path'),crypto=require('crypto'),request=require('supertest'),jwt=require('jsonwebtoken');
const app=require('../app'),pool=require('../config/operacional'),legacy=require('../config/connection');
const execute=require('../database/executeSql');
const base='/api/operacional/gestao/equipes';
const migration=fs.readFileSync(path.join(__dirname,'../database/migrations/007_disponibilidade_equipes.sql'),'utf8');
const insert=async(sql,args=[])=>(await pool.query(sql,args))[0].insertId;
let company,foreign,works,otherWork,token,field,outsider,oldTeam,oldExternal,before,gate,blockedBeforeMigration,preserved;
const headers=(t=token,key=crypto.randomUUID())=>({Authorization:'Bearer '+t,'Idempotency-Key':key});
const list=(t=token)=>request(app).get(base).set(headers(t));
const create=(kind='propria',body={},t=token,h=headers(t))=>request(app).post(base+'/'+kind).set(h).send({nome_equipe:'Equipe disponibilidade',etapa_atuacao:'Infraestrutura',quantidade_profissionais:2,custo_diario:100,custo_mensal:2000,custo_diario_total:200,...body});
const move=(kind,id,version,work,active=true,t=token,h=headers(t))=>request(app).put(`${base}/${kind}/${id}/vinculo`).set(h).send({versao:version,obra_id:work,ativo:active,motivo:'Homologação isolada'});
const history=(kind,id,t=token)=>request(app).get(`${base}/${kind}/${id}/historico`).set(headers(t));
beforeAll(async()=>{
 if(!/^vertice_test_/.test(process.env.DB_NAME))throw Error('Banco isolado obrigatório');
 await pool.query(fs.readFileSync(path.join(__dirname,'../database/migrations/005_profissionais.sql'),'utf8'));
 await execute(pool,fs.readFileSync(path.join(__dirname,'../database/migrations/006_gestao_integrada.sql'),'utf8'));
 company=await insert("INSERT INTO construtora(razao_social) VALUES ('Disponibilidade')");foreign=await insert("INSERT INTO construtora(razao_social) VALUES ('Outra disponibilidade')");
 async function user(tenant,role){const id=await insert('INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES (?,?,?,?,?)',['Disponibilidade',crypto.randomUUID()+'@teste.local','isolated-only',role,tenant]);return jwt.sign({id_usuario:id},process.env.JWT_SECRET);}
 token=await user(company,'Escritório');field=await user(company,'Canteiro');outsider=await user(foreign,'Escritório');
 async function work(tenant){return insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Obra disponibilidade',?,1,'2026-01-01','2027-01-01',1000)",[tenant]);}
 works=[await work(company),await work(company)];otherWork=await work(foreign);
 oldTeam=await insert("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Equipe anterior','Infraestrutura',3,10,100,?)",[works[0]]);
 oldExternal=await insert("INSERT INTO cadastro_de_equipes_terceirizadas(nome_equipe,custo_diario_total,id_obra) VALUES ('Terceira anterior',20,?)",[works[0]]);
 before=(await pool.query('SELECT * FROM cadastro_de_equipes WHERE id_cadastro_equipes=?',[oldTeam]))[0][0];
 gate=(await request(app).get(base+'/estado').set(headers())).body;
 blockedBeforeMigration=(await move('propria',oldTeam,0,works[1])).status;
 const [tables]=await pool.query("SELECT TABLE_NAME n FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE'");const snapshots=[];
 for(const {n:table} of tables){const [fields]=await pool.query('SHOW COLUMNS FROM ??',[table]);const names=fields.map(f=>f.Field);const [rows]=await pool.query('SELECT ?? FROM ??',[names,table]);snapshots.push({table,names,hash:crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex')});}
 const c=await pool.getConnection();try{await execute(c,migration);}finally{c.release();}
 preserved=true;for(const item of snapshots){const [rows]=await pool.query('SELECT ?? FROM ??',[item.names,item.table]);if(crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex')!==item.hash)preserved=false;}
},30000);
afterAll(async()=>{await pool.end();await new Promise(r=>legacy.end(r));});
test('007: preserva vínculos, valores e composição anteriores sem datas presumidas',async()=>{
 expect(gate.habilitado).toBe(false);expect(blockedBeforeMigration).toBe(503);expect(preserved).toBe(true);
 const row=(await pool.query('SELECT * FROM cadastro_de_equipes WHERE id_cadastro_equipes=?',[oldTeam]))[0][0];
 for(const [k,value] of Object.entries(before))expect(row[k]).toEqual(value);
 expect(row.id_construtora).toBe(company);expect(row.ativo).toBe(1);expect(row.versao).toBe(0);
 expect((await history('propria',oldTeam)).body).toHaveLength(0);
});
test.each(['propria','terceirizada'])('%s: cadastro sem obra permanece visível e isolado',async kind=>{
 const created=await create(kind);expect(created.status).toBe(201);
 const rows=(await list()).body.equipes;const row=rows.find(r=>r.tipo===kind&&r.equipe_id===created.body.insertId);
 expect(row.situacao).toBe('Disponivel');expect(row.obra_id).toBeNull();expect(row.id_construtora).toBe(company);
 expect((await list(outsider)).body.equipes.some(r=>r.tipo===kind&&r.equipe_id===created.body.insertId)).toBe(false);
 const legacyRoute=kind==='propria'?'/api/equipes':'/api/equipes-terceirizadas';
 expect((await request(app).get(legacyRoute).set(headers())).body.some(r=>r[kind==='propria'?'id_cadastro_equipes':'id_equipe_terceirizada']===created.body.insertId)).toBe(true);
});
test.each(['propria','terceirizada'])('%s: aloca, transfere, libera e inativa com histórico',async kind=>{
 const id=(await create(kind)).body.insertId;
 for(const [version,work,active] of [[0,works[0],true],[1,works[1],true],[2,null,true],[3,null,false]])expect((await move(kind,id,version,work,active)).status).toBe(201);
 const row=(await list()).body.equipes.find(r=>r.tipo===kind&&r.equipe_id===id);expect(row.situacao).toBe('Inativa');expect(row.obra_id).toBeNull();
 const h=(await history(kind,id)).body;expect(h).toHaveLength(5);expect(h[2].obra_anterior).toBe(works[0]);expect(h[2].obra_atual).toBe(works[1]);expect(h.every(r=>r.usuario_id&&r.registrado_em&&r.construtora_id===company)).toBe(true);
 expect((await move(kind,id,4,works[0],false)).status).toBe(409);
 expect((await move(kind,id,4,works[0],true)).status).toBe(201);
});
test.each(['propria','terceirizada'])('%s: duas alocações simultâneas permitem apenas um vencedor',async kind=>{
 const id=(await create(kind)).body.insertId;
 const responses=await Promise.all(works.map(work=>move(kind,id,0,work)));
 expect(responses.map(r=>r.status).sort()).toEqual([201,409]);
 const h=(await history(kind,id)).body;expect(h).toHaveLength(2);expect(h[0].versao).toBe(1);
});
test('transferência concorrente com liberação não sobrescreve o vencedor',async()=>{
 const id=(await create('propria',{idobra:works[0]})).body.insertId;
 const r=await Promise.all([move('propria',id,0,works[1]),move('propria',id,0,null)]);
 expect(r.map(x=>x.status).sort()).toEqual([201,409]);expect((await history('propria',id)).body).toHaveLength(2);
});
test('idempotência não duplica cadastro, transferência ou histórico',async()=>{
 const h=headers(),body={nome_equipe:'Idempotente'};const first=await create('propria',body,token,h);expect((await create('propria',body,token,h)).body.insertId).toBe(first.body.insertId);
 const allocation=headers();const a=await move('propria',first.body.insertId,0,works[0],true,token,allocation);expect(a.status).toBe(201);
 expect((await move('propria',first.body.insertId,0,works[0],true,token,allocation)).status).toBe(200);expect((await history('propria',first.body.insertId)).body).toHaveLength(2);
});
test('permissões bloqueiam Canteiro, visitantes e referências estrangeiras',async()=>{
 expect((await create('propria',{},field)).status).toBe(403);
 expect((await request(app).get(base)).status).toBe(401);
 expect((await move('propria',oldTeam,0,otherWork)).status).toBe(403);
 expect((await move('propria',oldTeam,0,works[1],true,outsider)).status).toBe(404);
 expect((await history('propria',oldTeam,outsider)).status).toBe(404);
 expect((await history('propria',oldTeam,field)).status).toBe(403);
});
test('endpoints legados não contornam a transferência com versão e histórico',async()=>{
 const row=(await pool.query('SELECT * FROM cadastro_de_equipes WHERE id_cadastro_equipes=?',[oldTeam]))[0][0];
 expect((await request(app).put('/api/equipes/insert/'+oldTeam).set(headers()).send({...row,idobra:works[1]})).status).toBe(409);
 expect((await request(app).put('/api/equipes/insert/'+oldTeam).set(headers()).send({...row,ativo:false})).status).toBe(409);
 expect((await request(app).put('/api/equipes/insert/'+oldTeam).set(headers()).send({...row,nome_equipe:'Nome revisado'})).status).toBe(200);
 expect((await pool.query("SELECT COUNT(*) n FROM gestao_auditoria WHERE recurso='cadastro_de_equipes' AND recurso_id=?",[oldTeam]))[0][0].n).toBeGreaterThan(0);
});
test('controle por período e versões inválidas são rejeitados',async()=>{
 for(const extra of [{inicio:'2026-10-01'},{fim:'2026-10-20'},{versao:'0'},{ativo:'true'}])expect((await request(app).put(`${base}/propria/${oldTeam}/vinculo`).set(headers()).send({versao:0,obra_id:works[1],ativo:true,motivo:'Teste',...extra})).status).toBe(400);
});
test('falha no histórico desfaz transferência e versão',async()=>{
 const id=(await create()).body.insertId;
 await pool.query("CREATE TRIGGER equipe_history_fail BEFORE INSERT ON equipe_transferencia FOR EACH ROW SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT='isolated failure'");
 try{expect((await move('propria',id,0,works[0])).status).toBe(500);}finally{await pool.query('DROP TRIGGER equipe_history_fail');}
 const row=(await list()).body.equipes.find(r=>r.tipo==='propria'&&r.equipe_id===id);expect(row.versao).toBe(0);expect(row.obra_id).toBeNull();
});
test('integrantes seguem a equipe disponível e a transferência sem duplicação',async()=>{
 const id=(await create()).body.insertId;
 const created=await request(app).post('/api/operacional/gestao/pessoas').set(headers()).send({nome:'Integrante disponibilidade',codigo:'EQ-DISP',cargo:'Operador',equipe_id:id,ativo:true});expect(created.status).toBe(201);
 expect((await move('propria',id,0,works[1])).status).toBe(201);
 const people=await request(app).get('/api/operacional/gestao/pessoas').set(headers());const person=people.body.find(p=>p.id_profissional===created.body.insertId);expect(person.id_obra).toBe(works[1]);
});
test('catálogo da obra contém equipes disponíveis e não inclui equipe estrangeira',async()=>{
 const id=(await create()).body.insertId;
 const catalog=await request(app).get('/api/operacional/gestao/recursos').set(headers());expect(catalog.body.equipes.some(r=>r.id_cadastro_equipes===id)).toBe(true);
 expect((await create('propria',{id_construtora:foreign})).status).toBe(403);
 await expect(pool.query('UPDATE cadastro_de_equipes SET idobra=? WHERE id_cadastro_equipes=?',[otherWork,id])).rejects.toMatchObject({code:'ER_NO_REFERENCED_ROW_2'});
});
test('inativar equipe preserva integrantes e permite editar sem criar novos vínculos',async()=>{
 const id=(await create()).body.insertId,body={nome:'Integrante preservado',codigo:'EQ-INATIVA',cargo:'Operador',equipe_id:id,ativo:true};
 const p=await request(app).post('/api/operacional/gestao/pessoas').set(headers()).send(body);expect(p.status).toBe(201);
 expect((await move('propria',id,0,null,false)).status).toBe(201);
 expect((await request(app).put('/api/operacional/gestao/pessoas/'+p.body.insertId).set(headers()).send({...body,nome:'Integrante editado'})).status).toBe(201);
 expect((await request(app).post('/api/operacional/gestao/pessoas').set(headers()).send({...body,codigo:'NOVO-INATIVA'})).status).toBe(403);
});
test('007: reexecução preserva equipe, vínculos e histórico já modificados',async()=>{
 const previous=(await list()).body;const [h]=await pool.query('SELECT * FROM equipe_transferencia ORDER BY id');
 const c=await pool.getConnection();try{await execute(c,migration);}finally{c.release();}
 expect((await list()).body).toEqual(previous);expect((await pool.query('SELECT * FROM equipe_transferencia ORDER BY id'))[0]).toEqual(h);
});


test('histórico impede exclusão destrutiva e informa o caminho de inativação',async()=>{
 const created=await create();const id=created.body.insertId;
 const deleted=await request(app).delete('/api/equipes/del/'+id).set(headers());expect(deleted.status).toBe(409);expect(deleted.body.message).toMatch(/inative/);expect((await history('propria',id)).body).toHaveLength(1);
});
