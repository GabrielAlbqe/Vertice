import test from 'node:test';
import assert from 'node:assert/strict';
import {filtrarProfissionais,resumoProfissionais,formularioProfissional,payloadProfissional,salvarProfissional,mensagemErroProfissionais} from '../src/api/profissionais.js';
const rows=[{id_profissional:1,nome:'José Silva',codigo:'P-01',cargo:'Eletricista',ativo:1,equipe_id:8,equipe:'Instalações',id_obra:10},{id_profissional:2,nome:'Maria',codigo:'P-02',cargo:'Operadora',ativo:0,terceirizada_id:8,equipe:'Instalações',id_obra:10},{id_profissional:3,nome:'Ana',codigo:'P-03',cargo:'Eletricista',ativo:'1',equipe_id:null,terceirizada_id:null,id_obra:null}];
globalThis.localStorage={getItem:key=>key==='vertice:session'?JSON.stringify({id:'professional-test',csrf:'csrf-test'}):null};
test('all filters compose; accents, team type, work and inactive flags are handled',()=>{
 assert.deepEqual(filtrarProfissionais(rows,{nome:'jose',codigo:'p-0',cargo:'ELETRICISTA',equipe:'interna:8',situacao:'ativo',obra:'10'}).map(p=>p.id_profissional),[1]);
 assert.deepEqual(filtrarProfissionais(rows,{equipe:'terceirizada:8',situacao:'inativo'}).map(p=>p.id_profissional),[2]);
 assert.deepEqual(filtrarProfissionais(rows,{equipe:'sem'}).map(p=>p.id_profissional),[3]);
 assert.deepEqual(filtrarProfissionais(rows,{busca:'instalacoes'}).map(p=>p.id_profissional),[1,2]);
 assert.equal(filtrarProfissionais(rows,{cargo:'Pedreiro'}).length,0);
});
test('identified counts deduplicate IDs, exclude accounts, and never add declared team quantities',()=>{
 const data=[...rows,{...rows[0],id_profissional:'1'},{id_usuario:1,nome:'Conta de acesso',ativo:true}, {id_profissional:4,ativo:'0',equipe_id:8}];
 assert.deepEqual(resumoProfissionais(data),{total:4,ativos:2,inativos:2,semEquipe:1,porEquipe:{'interna:8':1}});
 assert.equal(filtrarProfissionais(data).length,4);
});
test('edit and transfer payloads preserve version and encode a single current team',()=>{
 const initial=formularioProfissional({...rows[0],versao:'a'.repeat(64)});assert.equal(initial.equipe,'interna:8');
 const p=payloadProfissional({...initial,nome:' José Silva ',equipe:'terceirizada:8',ativo:false});
 assert.equal(p.nome,'José Silva');assert.equal(p.equipe_id,null);assert.equal(p.terceirizada_id,8);assert.equal(p.ativo,false);assert.equal(p.versao,'a'.repeat(64));assert.equal(p.id_usuario,undefined);
 const unlinked=payloadProfissional({...initial,equipe:''});assert.equal(unlinked.equipe_id,null);assert.equal(unlinked.terceirizada_id,null);
 for(const change of [{nome:' '},{codigo:' '},{cargo:'x'.repeat(101)},{equipe:'interna:0'},{equipe:'interna:9007199254740992'},{ativo:'false'}])assert.throws(()=>payloadProfissional({...initial,...change}));
});
test('save uses current cookies and CSRF; retries keep a key, different targets and edits get new keys',async()=>{
 const previous=globalThis.fetch,calls=[],retry={current:null};
 globalThis.fetch=async(url,options)=>{calls.push({url,options});return new Response(JSON.stringify({insertId:1,message:'Salvo'}),{status:201});};
 try{
  const p=formularioProfissional(rows[0]);await salvarProfissional(p,retry);await salvarProfissional(p,retry);
  await salvarProfissional({...p,id_profissional:2},retry);await salvarProfissional({...p,cargo:'Operador'},retry);
  assert.equal(calls[0].url,'/api/operacional/gestao/pessoas/1');assert.equal(calls[0].options.credentials,'include');assert.equal(calls[0].options.headers['X-CSRF-Token'],'csrf-test');assert.equal(calls[0].options.headers.Authorization,undefined);
  const keys=calls.map(c=>c.options.headers['Idempotency-Key']);assert.equal(keys[0],keys[1]);assert.notEqual(keys[1],keys[2]);assert.notEqual(keys[2],keys[3]);
 }finally{globalThis.fetch=previous;}
});
test('migration requirements, unavailable services and validation failures remain distinct',()=>{
 assert.match(mensagemErroProfissionais({status:503,dados:{code:'SCHEMA_NOT_READY'}}),/atualização autorizada/);
 assert.match(mensagemErroProfissionais({status:503}),/temporariamente indisponível/);
 assert.equal(mensagemErroProfissionais({status:409,message:'Código duplicado'}),'Código duplicado');
});
