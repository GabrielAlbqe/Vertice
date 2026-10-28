process.env.NODE_ENV='test';
process.env.DB_NAME='valen_testes';
require('../config/env');
const mysql=require('mysql2/promise');
const {spawnSync}=require('node:child_process');
const fs=require('node:fs'),path=require('node:path');
(async()=>{
 let c;
 try {
  c=await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:'valen_testes',connectTimeout:5000});
  const [rows]=await c.query('SELECT DATABASE() banco');
  if(rows[0].banco!=='valen_testes')throw new Error('Banco incorreto.');
  const [columns]=await c.query("SELECT TABLE_NAME,COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()");
  if(!columns.some(r=>r.TABLE_NAME==='construtora'&&r.COLUMN_NAME==='status'))throw new Error('Migração 003 pendente no banco de testes.');
  for(const table of ['cadastro_de_equipes','cadastro_de_insumos','cadastro_de_maquinario'])if(!columns.some(r=>r.TABLE_NAME===table&&r.COLUMN_NAME==='id_construtora'))throw new Error('Migração 001 pendente no banco de testes.');
 }catch(err){console.error('Integração bloqueada: '+(err.code || err.message)+'. Nenhum teste executado e nenhum banco criado.');process.exitCode=1;return;}
 finally{if(c)await c.end();}
 const directory=path.join(__dirname,'../tests');
 const files=fs.readdirSync(directory).filter(f=>f.endsWith('.test.js')&&f!=='api.complete.test.js').map(f=>path.join(directory,f));
 const result=spawnSync(process.execPath,['--test','--test-concurrency=1',...files],{stdio:'inherit',env:process.env});
 process.exitCode=result.status ?? 1;
})();
