const fs=require('fs'),path=require('path'),cp=require('child_process');
const {resetCommandOptions}=require('../database/harden-passwords.cjs');
const {inspectPasswordResets}=require('../security/passwordReset');
const {classifyReference,photoPlan,inventory}=require('../database/inventory-photos.cjs');
const root=path.resolve(__dirname,'../..');
test('distributed legacy SQL contains schema but no application rows or credentials',()=>{
 const sql=fs.readFileSync(path.join(root,'backend/bd.sql'),'utf8');expect(sql).toMatch(/CREATE TABLE/);expect(sql).not.toMatch(/\b(?:INSERT\s+INTO|REPLACE\s+INTO|LOAD\s+DATA)\b/i);expect(sql).not.toMatch(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
});
test('the preserved local copy cannot be accidentally tracked as a gitlink again',()=>{
 expect(cp.execFileSync('git',['ls-files','--stage','--','vertice-atualizado'],{cwd:root,encoding:'utf8'}).trim()).toBe('');
 expect(fs.readFileSync(path.join(root,'.gitignore'),'utf8').split(/\r?\n/)).toContain('/vertice-atualizado/');
});
test('credential planning is the default; writes require an explicit mode, database and users',()=>{
 const env={DB_NAME:'valen'};expect(resetCommandOptions([],env)).toEqual({apply:false,selectedIds:undefined});expect(resetCommandOptions(['--approved-database=valen'],env).apply).toBe(false);
 for(const argv of [['--apply'],['--apply','--approved-database=valen'],['--apply','--users=1'],['--apply','--dry-run','--approved-database=valen','--users=1'],['--users=0'],['--users=1,1']])expect(()=>resetCommandOptions(argv,env)).toThrow();
 expect(resetCommandOptions(['--apply','--approved-database=valen','--users=1'],env)).toEqual({apply:true,selectedIds:[1]});
});
test('credential inspection uses only SELECT and never returns password material',async()=>{
 const statements=[];const c={query:async(sql,args)=>{statements.push(sql);return [[{id_usuario:1,status:'Ativo',ambiente:'Escritorio',hash_valido:0}]];}};
 const result=await inspectPasswordResets(c);expect(result).toEqual([{id_usuario:1,status:'Ativo',ambiente:'Escritorio',requiresReset:true}]);expect(statements.every(sql=>sql.startsWith('SELECT '))).toBe(true);expect(JSON.stringify(result)).not.toMatch(/senha|ticket|token/);
});
test('photo references are classified without allowing automatic arbitrary downloads',()=>{
 for(const url of ['http://localhost:3000/a.jpg','http://127.0.0.1/a.jpg','http://[::1]/a.jpg'])expect(classifyReference(url)).toBe('localhost');
 expect(classifyReference('https://photos.example.invalid/a.jpg')).toBe('external');for(const url of ['data:image/png;base64,AA','file:///a.jpg','http://user:password@localhost/a.jpg','not a URL'])expect(classifyReference(url)).toBe('invalid');
});
test('photo migration plans separate construtoras, preserve source records and redact URLs',async()=>{
 const rows=[{id_apontamento:1,id_construtora:1,obra_id:10,activity_work:10,url_foto:'http://localhost:3000/a.jpg'},{id_apontamento:2,id_construtora:1,obra_id:10,activity_work:10,url_foto:'http://localhost:3000/a.jpg'},{id_apontamento:3,id_construtora:2,obra_id:20,activity_work:21,url_foto:'http://localhost:3000/a.jpg'}];
 const statements=[],plan=await inventory({query:async sql=>{statements.push(sql);return [rows];}});expect(plan).toMatchObject({readOnly:true,modified:false,references:3,localhost:3,uniqueSourcesPerTenant:2,ownershipConflicts:1});expect(plan.sources.every(source=>source.automaticDownload===false)).toBe(true);expect(plan.sources[0].sourceRecords).toEqual([1,2]);expect(JSON.stringify(plan.sources)).not.toContain('http://');expect(statements.every(sql=>sql.startsWith('SELECT '))).toBe(true);
});

test('the actual CLI defaults to read-only preview even without approval flags',()=>{
 const result=cp.execFileSync(process.execPath,[path.join(root,'backend/database/harden-passwords.cjs'),'--dry-run'],{cwd:root,env:process.env,encoding:'utf8'});const data=JSON.parse(result);expect(data).toMatchObject({dryRun:true,modified:false});expect(data.privateDeliveryFile).toBeUndefined();
});
