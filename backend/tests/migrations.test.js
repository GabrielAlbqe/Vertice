const fs = require('fs');
const path = require('path');
const db = require('../config/connection');
const executeSql = require('../database/executeSql');
let c;
beforeAll(async()=>{c=await db.promise().getConnection();});
const migration = fs.readFileSync(path.join(__dirname, '../database/migrations/001_cargo_apropriacao.sql'), 'utf8');
afterAll(() => {c?.release();db.end();});

test('001–007: cadeia completa pode ser reaplicada em schema isolado sem perder dados',async()=>{
  const isolated='vertice_test_cloud_migrations_'+Date.now();
  await c.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[isolated]);
  await c.query('USE ??',[isolated]);
  try {
    await executeSql(c,fs.readFileSync(path.join(__dirname,'../database/valen_atualizado.sql'),'utf8'));
    const directory=path.join(__dirname,'../database/migrations');
    const files=fs.readdirSync(directory).filter(file=>/^\d{3}_.*\.sql$/.test(file)).sort();
    expect(files).toHaveLength(7);
    for(const file of files)await executeSql(c,fs.readFileSync(path.join(directory,file),'utf8'));
    await c.query("INSERT INTO construtora(razao_social) VALUES ('Synthetic cloud migration fixture')");
    const [before]=await c.query('SELECT * FROM construtora');
    for(const file of files)await executeSql(c,fs.readFileSync(path.join(directory,file),'utf8'));
    expect((await c.query('SELECT * FROM construtora'))[0]).toEqual(before);
    expect((await c.query('SHOW TABLES LIKE \'equipe_transferencia\''))[0]).toHaveLength(1);
  } finally {await c.query('USE ??',[process.env.DB_NAME]);}
},30000);

test('005: duas execuções preservam todas as tabelas populadas e profissionais existentes',async()=>{
  if(!/^vertice_test_/.test(process.env.DB_NAME||''))throw Error('Banco isolado obrigatório.');
  const isolated='vertice_test_migration005_'+Date.now();
  await c.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[isolated]);
  await c.query('USE ??',[isolated]);
  const insert=async(sql,args=[])=>(await c.query(sql,args))[0].insertId;
  async function snapshot(){
    const [tables]=await c.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=DATABASE() AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME");
    const result={};
    for(const {TABLE_NAME:table} of tables){
      const [rows]=await c.query('SELECT * FROM ??',[table]);
      const content=JSON.stringify(rows.map(row=>JSON.stringify(row)).sort());
      result[table]={count:rows.length,sha256:require('crypto').createHash('sha256').update(content).digest('hex')};
    }
    return result;
  }
  try{
    await executeSql(c,fs.readFileSync(path.join(__dirname,'../database/valen_atualizado.sql'),'utf8'));
    await executeSql(c,fs.readFileSync(path.join(__dirname,'../database/migrations/004_security_state.sql'),'utf8'));
    const company=await insert("INSERT INTO construtora(razao_social) VALUES ('Migration005 isolated')");
    for(const role of ['Escritório','Canteiro'])await insert("INSERT INTO usuario(nome,email,senha,ambiente,idconstrutora) VALUES ('Migration005','migration005@teste.local','isolated-disabled',?,?)",[role,company]);
    const work=await insert("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Migration005',?,2,'2026-01-01','2027-01-01',1000)",[company]);
    const team=await insert("INSERT INTO cadastro_de_equipes(nome_equipe,etapa_atuacao,quantidade_profissionais,custo_diario,custo_mensal,idobra) VALUES ('Migration005','Infraestrutura',3,10,100,?)",[work]);
    await insert("INSERT INTO cadastro_de_equipes_terceirizadas(nome_equipe,custo_diario_total,id_obra) VALUES ('Migration005 external',20,?)",[work]);
    const stage=await insert("INSERT INTO etapa(id_obra,nome_etapa) VALUES (?,'Infraestrutura')",[work]);
    const rdo=await insert("INSERT INTO rdo(id_obra,data_rdo,turno,clima) VALUES (?,'2026-10-01','Integral','Ensolarado')",[work]);
    await insert("INSERT INTO custo_planejado(id_obra,etapa,origem_custo,valor_planejado,data_inicio_prevista,data_fim_prevista) VALUES (?,'Infraestrutura','Equipe',500,'2026-01-01','2027-01-01')",[work]);
    await insert("INSERT INTO custo_realizado(id_obra,id_etapa,id_rdo,origem_custo,id_origem,data,quantidade,custo_unitario) VALUES (?,?,?,'Equipe',?,'2026-10-01',2,30)",[work,stage,rdo,team]);
    await c.query("INSERT INTO vertice_security_state(chave,valor,contador,expira_em) VALUES ('migration005',?,2,?)",[JSON.stringify({preserve:true}),Date.now()+60000]);
    const before=await snapshot();expect(Object.keys(before)).toHaveLength(38);
    const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/005_profissionais.sql'),'utf8');
    await executeSql(c,sql);
    const first=await snapshot();expect(Object.keys(first)).toHaveLength(39);
    for(const [table,content] of Object.entries(before))expect(first[table]).toEqual(content);
    expect(first.profissional.count).toBe(0);
    await insert("INSERT INTO profissional(id_construtora,codigo,nome,cargo,equipe_id) VALUES (?,'MIG005','Migration005 individual','Cargo operacional',?)",[company,team]);
    const populated=await snapshot();await executeSql(c,sql);expect(await snapshot()).toEqual(populated);
    const [keys]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL');
    expect(keys).toHaveLength(61);
    for(const fk of keys){
      const [invalid]=await c.query('SELECT COUNT(*) n FROM ?? a LEFT JOIN ?? b ON a.??=b.?? WHERE a.?? IS NOT NULL AND b.?? IS NULL',[fk.TABLE_NAME,fk.REFERENCED_TABLE_NAME,fk.COLUMN_NAME,fk.REFERENCED_COLUMN_NAME,fk.COLUMN_NAME,fk.REFERENCED_COLUMN_NAME]);
      expect(invalid[0].n).toBe(0);
    }
  }finally{await c.query('USE ??',[process.env.DB_NAME]);}
},30000);
test('001: duas execuções preservam registros e a FK correta', async () => {
  const [before] = await c.query('SELECT * FROM cargo ORDER BY id_cargo');
  const [appropriations] = await c.query('SELECT * FROM apropriacao ORDER BY id_apropriacao');
  await executeSql(c, migration);
  await executeSql(c, migration);
  expect((await c.query('SELECT * FROM cargo ORDER BY id_cargo'))[0]).toEqual(before);
  expect((await c.query('SELECT * FROM apropriacao ORDER BY id_apropriacao'))[0]).toEqual(appropriations);
  const [fk] = await c.query("SELECT REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='apropriacao' AND COLUMN_NAME='id_insumo' AND REFERENCED_TABLE_NAME IS NOT NULL");
  expect(fk).toEqual([{ REFERENCED_TABLE_NAME: 'cadastro_de_insumos', REFERENCED_COLUMN_NAME: 'id_insumos' }]);
});
test('001: corrige FK legada com dados e rejeita órfãos sem apagá-los',async()=>{
  const company=(await c.query("INSERT INTO construtora(razao_social) VALUES ('Teste migracao')"))[0].insertId;
  const user=(await c.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Teste migracao',?,'hash_teste',?)",[`mig_${Date.now()}@teste.local`,company]))[0].insertId;
  const work=(await c.query("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Teste migracao',?,1,'2026-01-01','2027-01-01',1)",[company]))[0].insertId;
  const supply=(await c.query("INSERT INTO cadastro_de_insumos(nome,idobra) VALUES ('Teste migracao',?)",[work]))[0].insertId;
  const activity=(await c.query("INSERT INTO atividade_eap(descricao,idx_obra) VALUES ('Teste migracao',?)",[work]))[0].insertId;
  const appropriation=(await c.query('INSERT INTO apropriacao(quantidade_consumida,id_insumo,id_atividade,id_usuario) VALUES (1,?,?,?)',[supply,activity,user]))[0].insertId;
  const [before]=await c.query('SELECT * FROM apropriacao WHERE id_apropriacao=?',[appropriation]);
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  try{await c.query('ALTER TABLE apropriacao DROP FOREIGN KEY fk_apropriacao_insumo, ADD CONSTRAINT id_insumo FOREIGN KEY (id_insumo) REFERENCES `cadastro de insumos` (`id_Insumos`) ON DELETE CASCADE ON UPDATE CASCADE');}finally{await c.query('SET FOREIGN_KEY_CHECKS=1');}
  await executeSql(c,migration);await executeSql(c,migration);
  expect((await c.query('SELECT * FROM apropriacao WHERE id_apropriacao=?',[appropriation]))[0]).toEqual(before);
  const [rules]=await c.query("SELECT DELETE_RULE,UPDATE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=DATABASE() AND TABLE_NAME='apropriacao' AND CONSTRAINT_NAME='fk_apropriacao_insumo'");expect(rules[0]).toEqual({DELETE_RULE:'CASCADE',UPDATE_RULE:'CASCADE'});
  await c.query('SET FOREIGN_KEY_CHECKS=0');
  try{await c.query('UPDATE apropriacao SET id_insumo=2147483647 WHERE id_apropriacao=?',[appropriation]);}finally{await c.query('SET FOREIGN_KEY_CHECKS=1');}
  await expect(executeSql(c,migration)).rejects.toThrow(/insumos invalidos/);
  expect((await c.query('SELECT id_insumo FROM apropriacao WHERE id_apropriacao=?',[appropriation]))[0][0].id_insumo).toBe(2147483647);
  await c.query('UPDATE apropriacao SET id_insumo=? WHERE id_apropriacao=?',[supply,appropriation]);
  await executeSql(c,migration);
});
test('002: duas execuções mantêm schema e registros existentes',async()=>{
  const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/002_operacao_canteiro.sql'),'utf8');
  const [before]=await c.query('SELECT * FROM diario_obra ORDER BY id_diario');
  await executeSql(c,sql);await executeSql(c,sql);
  expect((await c.query('SELECT * FROM diario_obra ORDER BY id_diario'))[0]).toEqual(before);
});
test('003: duas execuções preservam fotos e ocorrências sem classificar legados',async()=>{
  const tables=['foto_obra','ocorrencia_obra','ocorrencia_historico','foto_historico'];
  const before=await Promise.all(tables.map(async t=>(await c.query(`SELECT * FROM ${t}`))[0]));
  const sql=fs.readFileSync(path.join(__dirname,'../database/migrations/003_gestao_operacional.sql'),'utf8');
  await executeSql(c,sql);await executeSql(c,sql);
  for(let i=0;i<tables.length;i++)expect((await c.query(`SELECT * FROM ${tables[i]}`))[0]).toEqual(before[i]);
});
test('003: migra registros anteriores sem sobrescrever seus dados',async()=>{
  const isolated='vertice_test_migration003_'+Date.now();
  await c.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[isolated]);await c.query('USE ??',[isolated]);
  try{
    let sql=fs.readFileSync(path.join(__dirname,'../database/valen_atualizado.sql'),'utf8');
    sql=sql.slice(0,sql.indexOf('CREATE TABLE IF NOT EXISTS foto_historico'));
    sql=sql.split('\n').filter(line=>!/^\s*(classificacao VARCHAR|responsavel_id INT|prazo_previsto DATE|atividade_id INT|excluido_em DATETIME|excluido_por INT|CONSTRAINT fk_ocorrencia_designado|CONSTRAINT fk_foto_atividade|CONSTRAINT fk_foto_exclusao)/.test(line)).join('\n').replace("ENUM('Criada','Resolvida','Atualizada')","ENUM('Criada','Resolvida')");
    await executeSql(c,sql);
    const company=(await c.query("INSERT INTO construtora(razao_social) VALUES ('Fixture 003')"))[0].insertId;
    const actor=(await c.query("INSERT INTO usuario(nome,email,senha,idconstrutora) VALUES ('Fixture','fixture003@teste.local','hash-teste',?)",[company]))[0].insertId;
    const work=(await c.query("INSERT INTO obra(nome,id_construtora,numero_pavimentos,data_inicio_planejada,data_termino_planejada,orcamento_planejado) VALUES ('Fixture 003',?,1,'2026-01-01','2027-01-01',1)",[company]))[0].insertId;
    await c.query("INSERT INTO foto_obra(obra_id,usuario_id,descricao,arquivo,mime,tamanho,sha256) VALUES (?,?,'Registro anterior','fixture003.webp','image/webp',100,?)",[work,actor,'a'.repeat(64)]);
    await c.query("INSERT INTO ocorrencia_obra(obra_id,usuario_id,descricao,localizacao,prioridade) VALUES (?,?,'Ocorrência anterior','Fixture','Alta')",[work,actor]);
    const before=(await c.query('SELECT * FROM foto_obra'))[0][0],old=(await c.query('SELECT * FROM ocorrencia_obra'))[0][0];
    const migration=fs.readFileSync(path.join(__dirname,'../database/migrations/003_gestao_operacional.sql'),'utf8');await executeSql(c,migration);await executeSql(c,migration);
    const photo=(await c.query('SELECT * FROM foto_obra'))[0][0],occurrence=(await c.query('SELECT * FROM ocorrencia_obra'))[0][0];
    expect(Object.fromEntries(Object.keys(before).map(k=>[k,photo[k]]))).toEqual(before);expect(photo.excluido_em).toBeNull();expect(photo.atividade_id).toBeNull();
    expect(Object.fromEntries(Object.keys(old).map(k=>[k,occurrence[k]]))).toEqual(old);expect(occurrence.classificacao).toBeNull();expect(occurrence.responsavel_id).toBeNull();expect(occurrence.prazo_previsto).toBeNull();
  }finally{await c.query('USE ??',[process.env.DB_NAME]);}
},30000);
