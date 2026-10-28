require('../config/env');
const mysql=require('mysql2/promise');
const expected=require('../config/schema.json');
(async()=>{let c;try{
 c=await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:process.env.DB_NAME || 'valen',connectTimeout:5000});
 const [rows]=await c.query('SELECT TABLE_NAME,COLUMN_NAME,COLUMN_TYPE FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE()');
 const pending=[];
 for(const [table,columns] of Object.entries(expected))for(const column of Object.keys(columns))if(!rows.some(r=>r.TABLE_NAME===table&&r.COLUMN_NAME===column))pending.push(table+'.'+column);
 for(const table of ['cadastro_de_equipes','cadastro_de_insumos','cadastro_de_maquinario'])if(!rows.some(r=>r.TABLE_NAME===table&&r.COLUMN_NAME==='id_construtora'))pending.push(table+'.id_construtora');
 const price=rows.find(r=>r.TABLE_NAME==='cadastro_de_insumos'&&r.COLUMN_NAME==='valor_unitario');if(price&&!price.COLUMN_TYPE.startsWith('decimal'))pending.push('cadastro_de_insumos.valor_unitario precisa DECIMAL (migração 002)');
 const [indexes]=await c.query("SELECT INDEX_NAME FROM information_schema.STATISTICS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME='usuario' AND NON_UNIQUE=0 AND COLUMN_NAME='email'");
 if(!indexes.length)pending.push('usuario.email precisa índice único (migração 002)');
 if(pending.length){console.error('Migrações pendentes:\n'+pending.map(p=>' - '+p).join('\n'));process.exitCode=1;}else console.log('Colunas e índice de e-mail compatíveis. Esta verificação não valida todos os dados ou relacionamentos.');
 }catch(err){console.error('Verificação não concluída: '+(err.code || 'erro de configuração'));process.exitCode=1;}finally{if(c)await c.end();}})();
