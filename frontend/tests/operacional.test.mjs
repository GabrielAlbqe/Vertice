import test from 'node:test';
import assert from 'node:assert/strict';
import { progressoAtividades } from '../src/canteiro/progresso.js';
import { gravarRascunho,lerRascunhos,removerRascunho } from '../src/canteiro/rascunhos.js';
import { enviarOperacional,enviarFoto } from '../src/api/operacional.js';
import {requisitar} from '../src/api/api.js';
import {guardarCache,lerCache,limparCache} from '../src/canteiro/offline.js';
import {sessaoValida,invalidarSessao} from '../src/canteiro/sessao.js';
import {saveSession} from '../src/api/sessionTransport.js';
const storage=new Map();globalThis.localStorage={getItem:key=>storage.get(key)??null,setItem:(key,v)=>storage.set(key,v),removeItem:key=>storage.delete(key)};

test('login por cookie persiste somente metadados e remove JWT legado',()=>{
  try{storage.set('token','legacy-jwt');saveSession({id:'new-id',expiresAt:Date.now()+10000,csrf:'csrf-test',token:'must-not-persist'},7);assert.equal(storage.has('token'),false);const metadata=JSON.parse(storage.get('vertice:session'));assert.equal(metadata.token,undefined);assert.equal(metadata.user,'7');}finally{storage.clear();}
});

test('sessão exige expiração futura e identidade correspondente ao usuário',()=>{
  const token=payload=>JSON.stringify({id:'session-test',user:String(payload.id_usuario),expiresAt:payload.exp*1000,csrf:'test-csrf'});
  try{
    storage.set('id_usuario','7');
    for(const payload of [{id_usuario:7},{id_usuario:7,exp:1},{id_usuario:8,exp:Math.floor(Date.now()/1000)+60}]){storage.set('vertice:session',token(payload));assert.equal(sessaoValida(),false);}
    storage.set('vertice:session',token({id_usuario:7,exp:Math.floor(Date.now()/1000)+60}));assert.equal(sessaoValida(),true);
  }finally{storage.clear();}
});

test('401 encerra sessão e limpa consultas offline, preservando rascunhos',async()=>{
  const old=globalThis.fetch;
  try{
    storage.set('vertice:session',JSON.stringify({id:'expired',user:'7',expiresAt:1,csrf:'test-csrf'}));storage.set('id_usuario','7');storage.set('usuario','{"id_usuario":7}');storage.set('obra_selecionada','{"id_obra":2}');
    storage.set('vertice:canteiro:offline:7','dados privados');
    storage.set('vertice:canteiro:rascunhos:7','rascunhos preservados');
    globalThis.fetch=async()=>new Response('{"message":"Sessao expirada"}',{status:401});
    await assert.rejects(requisitar('/obras'),error=>error.status===401);
    for(const key of ['token','vertice:session','id_usuario','usuario','obra_selecionada','vertice:canteiro:offline:7'])assert.equal(storage.has(key),false);
    assert.equal(storage.get('vertice:canteiro:rascunhos:7'),'rascunhos preservados');
  }finally{globalThis.fetch=old;storage.clear();}
});

test('resposta 401 atrasada não encerra uma sessão mais recente',()=>{
  try{const metadata=JSON.stringify({id:'new-session',user:'7',expiresAt:Date.now()+60000,csrf:'test'});storage.set('vertice:session',metadata);storage.set('id_usuario','7');invalidarSessao('old-session');assert.equal(storage.get('vertice:session'),metadata);}finally{storage.clear();}
});
test('cache offline limita obra/empresa, remove segredos e expira com a sessão',()=>{
  const user={id_usuario:7,idconstrutora:2},obra={id_obra:3,nome:'Obra teste'},dados={diarios:[],atividades:[],apontamentos:[{id_apontamento:1,url_foto:'nao-persistir',token:'nao-persistir'}],apropriacoes:[],rdos:[],recursos:{equipes:[],insumos:[],maquinarios:[]}};
  const token=exp=>JSON.stringify({id:'test-session',expiresAt:exp*1000,user:'7',csrf:'test'});storage.set('vertice:session',token(Math.floor(Date.now()/1000)+3600));
  assert.equal(guardarCache(user,obra,dados),true);assert.equal(lerCache(user,3).obra.nome,obra.nome);assert.equal(JSON.stringify(lerCache(user)).includes('nao-persistir'),false);assert.equal(lerCache({...user,idconstrutora:9}),null);assert.equal(lerCache(user,8),null);
  storage.set('vertice:session',token(1));assert.equal(lerCache(user),null);storage.set('vertice:session',token(Math.floor(Date.now()/1000)+3600));limparCache(7);assert.equal(lerCache(user),null);storage.delete('vertice:session');
});
test('respostas atrasadas nao recriam cache apos logout ou troca de conta',()=>{
  const user={id_usuario:7,idconstrutora:2},obra={id_obra:3};
  try{
    storage.clear();assert.equal(guardarCache(user,obra,{}),false);
    storage.set('vertice:session',JSON.stringify({id:'next-session',user:'8',expiresAt:Date.now()+60000}));
    assert.equal(guardarCache(user,obra,{}),false);
    storage.set('vertice:session',JSON.stringify({id:'expired-session',user:'7',expiresAt:1}));
    assert.equal(guardarCache(user,obra,{}),false);
    assert.equal(storage.has('vertice:canteiro:offline:7'),false);
  }finally{storage.clear();}
});

test('confirmação textual legada só é aceita na rota e método conhecidos',async()=>{
  const old=globalThis.fetch;
  try{globalThis.fetch=async()=>new Response('Maquinário registrado com sucesso!',{status:201});assert.equal((await requisitar('/maquinarios/insert',{method:'POST'})).confirmado,true);await assert.rejects(requisitar('/maquinarios/insert'),/Formato/);await assert.rejects(requisitar('/operacional/fotos',{method:'POST'}),/Formato/);globalThis.fetch=async()=>new Response('<html>Erro</html>',{status:200});await assert.rejects(requisitar('/maquinarios/insert',{method:'POST'}),/Formato/);}finally{globalThis.fetch=old;}
});
test('avanço tem conclusão, pendência e rejeita total inconsistente sem média fictícia',()=>{
  const atividades=[1,2,3,4,5].map(id=>({id_atividade:id,descricao:`Atividade ${id}`}));
  const registros=[{atividade_eap_id:1,percentual_dia:'40'},{atividade_eap_id:1,percentual_dia:'60'},{atividade_eap_id:2,percentual_dia:10},{atividade_eap_id:4,percentual_dia:110},{atividade_eap_id:5,percentual_dia:null}];
  const r=progressoAtividades(atividades,registros);assert.deepEqual(r.map(a=>a.estado),['Concluída','Em andamento','Sem apontamento','Revisar apontamentos','Revisar apontamentos']);assert.deepEqual(r.map(a=>a.total),[100,10,null,null,null]);
});
test('rascunhos separam usuários, removem credenciais e preservam chave e estado',()=>{
  const item=gravarRascunho(7,{obra:2,tipo:'diario',payload:{observacoes:'Turno',senha:'nao persistir',token:'nao persistir',equipes:[1],maquinarios:[{id:2,quantidade:1,token:'nao persistir'}]},chave:'chave-de-envio-original',estado:'erro',token:'nao persistir'});
  assert.equal(lerRascunhos(8).length,0);const saved=lerRascunhos(7)[0];assert.equal(saved.chave,item.chave);assert.equal(saved.estado,'erro');assert.equal(saved.payload.observacoes,'Turno');assert.equal(JSON.stringify(saved).includes('nao persistir'),false);
  removerRascunho(7,item.id);assert.deepEqual(lerRascunhos(7),[]);
});
test('transporte operacional envia idempotência e confirma somente resposta válida',async()=>{
  const old=globalThis.fetch;let request;
  globalThis.fetch=async(url,options)=>{request={url,options};return new Response(JSON.stringify({insertId:42}),{status:201,headers:{'Content-Type':'application/json'}});};
  try{const r=await enviarOperacional('diarios',{obrax_id:2},'chave-estavel-de-envio');assert.equal(r.insertId,42);assert.equal(request.options.headers['Idempotency-Key'],'chave-estavel-de-envio');assert.equal(JSON.parse(request.options.body).obrax_id,2);
    globalThis.fetch=async()=>new Response('<html>Falha</html>',{status:200});await assert.rejects(enviarOperacional('diarios',{},'chave-estavel-de-envio'),/Formato de resposta inesperado/);
  }finally{globalThis.fetch=old;}
});
test('foto envia binário e descrição sem incluir imagem nos metadados JSON',async()=>{
  const old=globalThis.fetch;const image=new Blob(['imagem de teste'],{type:'image/jpeg'});let sent;
  globalThis.fetch=async(url,options)=>{sent={url,options};return new Response('{"insertId":1}',{status:201});};
  try{await enviarFoto(2,'Foto do turno',image,'chave-estavel-de-foto');assert.equal(sent.options.body,image);assert.equal(sent.options.headers['Content-Type'],'image/jpeg');assert.match(sent.url,/descricao=Foto%20do%20turno/);}finally{globalThis.fetch=old;}
});
