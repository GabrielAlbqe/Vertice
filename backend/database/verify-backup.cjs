// Backup do banco configurado; restaura e migra SOMENTE um banco novo vertice_test_*.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),{spawnSync}=require('child_process');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const mysql=require('mysql2/promise'),execute=require('./executeSql');
async function schema(c,name){
  const [columns]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE,IS_NULLABLE,COLUMN_DEFAULT,EXTRA,GENERATION_EXPRESSION FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,ORDINAL_POSITION',[name]);
  const [foreignKeys]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,REFERENCED_TABLE_NAME,REFERENCED_COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=? AND REFERENCED_TABLE_NAME IS NOT NULL ORDER BY TABLE_NAME,COLUMN_NAME',[name]);
  const [indexes]=await c.query('SELECT TABLE_NAME,INDEX_NAME,NON_UNIQUE,SEQ_IN_INDEX,COLUMN_NAME,SUB_PART,INDEX_TYPE,IS_VISIBLE FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=? ORDER BY TABLE_NAME,INDEX_NAME,SEQ_IN_INDEX',[name]);
  const [rules]=await c.query('SELECT TABLE_NAME,CONSTRAINT_NAME,UPDATE_RULE,DELETE_RULE FROM information_schema.REFERENTIAL_CONSTRAINTS WHERE CONSTRAINT_SCHEMA=? ORDER BY TABLE_NAME,CONSTRAINT_NAME',[name]);
  return {columns,foreignKeys,indexes,rules};
}
async function snapshot(c,schema){
  const [tables]=await c.query("SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA=? AND TABLE_TYPE='BASE TABLE' ORDER BY TABLE_NAME",[schema]);
  const result={};
  for(const {TABLE_NAME:table} of tables){
    const [rows]=await c.query('SELECT * FROM ??.??',[schema,table]);
    result[table]={rows:rows.length,sha256:crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex')};
  }return result;
}
(async()=>{
  const c=await mysql.createConnection({...require('../config/environment').databaseOptions(),dateStrings:true,multipleStatements:true});
  try{
    const source=process.env.DB_NAME;
    if(!/^[a-zA-Z0-9_]+$/.test(source))throw Error('Nome de banco invalido');
    const [events]=await c.query('SELECT COUNT(*) n FROM information_schema.EVENTS WHERE EVENT_SCHEMA=?',[source]);
    if(events[0].n)throw Error('Eventos exigem revisao antes de restaurar uma copia isolada');
    const before=await snapshot(c,source),dir=path.join(__dirname,'backups');fs.mkdirSync(dir,{recursive:true});
    const file=path.join(dir,source+'_'+new Date().toISOString().replace(/[:.]/g,'-')+'.sql');
    const installed='C:/Program Files/MySQL/MySQL Server 8.0/bin/mysqldump.exe';
    const binary=process.env.MYSQLDUMP_PATH || (fs.existsSync(installed)?installed:'mysqldump');
    const caPath=process.env.DB_SSL_CA_BASE64?path.join(dir,'tls-ca-'+crypto.randomUUID()+'.pem'):null;
    let dump;
    try{
      if(caPath)fs.writeFileSync(caPath,Buffer.from(process.env.DB_SSL_CA_BASE64,'base64'),{mode:0o600});
      dump=spawnSync(binary,require('../deploy/backup.cjs').dumpArguments(process.env,file,caPath),{env:{...process.env,MYSQL_PWD:process.env.DB_PASSWORD},encoding:'utf8',windowsHide:true});
    }finally{if(caPath&&fs.existsSync(caPath))fs.rmSync(caPath);}
    if(dump.status!==0)throw Error('Falha no mysqldump; verifique instalacao e permissoes');
    const buffer=fs.readFileSync(file),sql=buffer.toString('utf8');
    if(!sql.includes('-- Dump completed on')||(sql.match(/CREATE TABLE /g)||[]).length!==Object.keys(before).length)throw Error('Backup incompleto');
    const isolated='vertice_test_backup_'+Date.now();
    await c.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[isolated]);
    await c.query('USE ??',[isolated]);
    await execute(c,sql.replace(/^DROP TABLE IF EXISTS .*;\r?\n/gm,''));
    const restored=await snapshot(c,isolated);
    if(JSON.stringify(restored)!==JSON.stringify(before))throw Error('Dados da restauracao diferem da origem; verifique alteracoes concorrentes');
    const testProfessionals=process.argv.includes('--test-profissionais');
    const testIntegrated=process.argv.includes('--test-gestao-integrada');
    if(testProfessionals&&testIntegrated)throw Error('Selecione somente uma verificacao de migracao.');
    const includeIntegrated=testIntegrated||Boolean(before.gestao_auditoria);
    const includeProfessionals=testProfessionals||includeIntegrated||Boolean(before.profissional);
    const migrations=testProfessionals?['005_profissionais.sql']:testIntegrated?['005_profissionais.sql','006_gestao_integrada.sql']:['001_cargo_apropriacao.sql','002_operacao_canteiro.sql','003_gestao_operacional.sql','004_security_state.sql',...(includeProfessionals?['005_profissionais.sql']:[]),...(includeIntegrated?['006_gestao_integrada.sql']:[])];
    for(let pass=0;pass<2;pass++){
      const baseline=await snapshot(c,isolated);
      for(const file of migrations)await execute(c,fs.readFileSync(path.join(__dirname,'migrations',file),'utf8'));
      const migrated=await snapshot(c,isolated);
      for(const [table,value] of Object.entries(baseline))if(JSON.stringify(migrated[table])!==JSON.stringify(value))throw Error('Dados alterados na passagem '+(pass+1)+': '+table);
    }
    const after=await snapshot(c,isolated);
    for(const [table,value] of Object.entries(before))if(JSON.stringify(after[table])!==JSON.stringify(value))throw Error('Dados alterados na copia migrada: '+table);
    const actual=await schema(c,isolated);
    for(const fk of actual.foreignKeys){
      const [invalid]=await c.query('SELECT COUNT(*) n FROM ??.?? a LEFT JOIN ??.?? b ON a.??=b.?? WHERE a.?? IS NOT NULL AND b.?? IS NULL',[isolated,fk.TABLE_NAME,isolated,fk.REFERENCED_TABLE_NAME,fk.COLUMN_NAME,fk.REFERENCED_COLUMN_NAME,fk.COLUMN_NAME,fk.REFERENCED_COLUMN_NAME]);
      if(invalid[0].n)throw Error('Integridade invalida na copia: '+fk.TABLE_NAME);
    }
    const reference='vertice_test_reference_'+Date.now();await c.query('CREATE DATABASE ?? CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci',[reference]);await c.query('USE ??',[reference]);await execute(c,fs.readFileSync(path.join(__dirname,'valen_atualizado.sql'),'utf8'));
    await execute(c,fs.readFileSync(path.join(__dirname,'migrations/004_security_state.sql'),'utf8'));
    if(includeProfessionals)await execute(c,fs.readFileSync(path.join(__dirname,'migrations/005_profissionais.sql'),'utf8'));
    if(includeIntegrated)await execute(c,fs.readFileSync(path.join(__dirname,'migrations/006_gestao_integrada.sql'),'utf8'));
    if(JSON.stringify(actual)!==JSON.stringify(await schema(c,reference)))throw Error('SQL completo diverge do esquema migrado; revisar antes da aprovacao');
    if(JSON.stringify(await snapshot(c,source))!==JSON.stringify(before))throw Error('A origem mudou durante a verificacao; conferir atividade concorrente antes de autorizar.');
    const report={source,backup:path.relative(__dirname,file),bytes:buffer.length,sha256:crypto.createHash('sha256').update(buffer).digest('hex'),isolatedDatabase:isolated,referenceDatabase:reference,originalTables:Object.keys(before).length,migratedTables:Object.keys(after).length,migrations,migrationPasses:2,restoredDataIdentical:true,originalDataPreserved:true,foreignKeysVerified:actual.foreignKeys.length,invalidReferences:0,sqlMatchesMigrations:true,principalModified:false,verifiedAt:new Date().toISOString()};
    if(process.env.VERTICE_BACKUP_ARTIFACTS==='1'){
      fs.writeFileSync(file+'.json',JSON.stringify({...report,tables:before},null,2));
      fs.writeFileSync(path.join(__dirname,'backup-final-verification.json'),JSON.stringify(report,null,2));
    }
    console.log(JSON.stringify(report));
  }finally{await c.end();}
})().catch(e=>{console.error(e.code || e.message);process.exitCode=1;});
