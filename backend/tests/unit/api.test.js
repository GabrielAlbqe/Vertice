const {test,beforeEach}=require('node:test');
const assert=require('node:assert/strict');
const {randomBytes}=require('node:crypto');
const {AsyncLocalStorage}=require('node:async_hooks');
const jwt=require('jsonwebtoken');
const bcrypt=require('bcryptjs');
const request=require('supertest');
process.env.NODE_ENV='test';process.env.DB_NAME='valen_testes';process.env.JWT_SECRET=randomBytes(48).toString('hex');
const resources=require('../../config/recursos');
const schema=require('../../config/schema.json');
const requiredFilters=require('../../config/filtros');
const calls=[];let commits=0,rollbacks=0,role='Gerência',active='Ativo',changedTenant=1,used=0,sqlFailure=false;
const password='SenhaSegura123!';const hash=bcrypt.hashSync(password,4);
function fixture(table,id=1) {
 const data={};
 for(const [key,definition] of Object.entries(schema[table])) {
  if(/GENERATED/.test(definition))continue;
  if(/^enum/.test(definition))data[key]=definition.match(/'([^']+)'/)[1];
  else if(/^date$|^date /.test(definition))data[key]='2026-10-01';
  else if(/^timestamp|^datetime/.test(definition))data[key]='2026-10-01 00:00:00';
  else if(/^int|^decimal|^float/.test(definition))data[key]=1;
  else data[key]='Teste';
 }
 const spec=Object.values(resources).find(s=>s[0]===table);data[spec[1]]=id;
 if(table==='usuario')Object.assign(data,{nome:'Usuário',email:'user@test.local',senha:hash,status:active,ocupacao:role,idconstrutora:changedTenant});
 if(table==='cadastro_de_insumos'){data.quantidade_disponivel=100;data.valor_unitario='1.25';}
 if(table==='cadastro_de_equipes'){data.custo_diario='10.25';data.custo_mensal='100.25';}
 if(table==='cadastro_de_maquinario')Object.assign(data,{quantidade:3,status:'Ativo',custo_diario:'10.25'});
 if(table==='obra')Object.assign(data,{orcamento_planejado:1000,data_termino_planejada:'2026-12-31'});
 if(table==='custo_realizado')data.origem_custo='Insumo';
 return data;
}
const mock={context:new AsyncLocalStorage(),end(cb){if(cb)cb();},query(sql,params,cb){
 if(typeof params==='function'){cb=params;params=[];}
 calls.push({sql,params,transaction:Boolean(mock.context.getStore())});
 queueMicrotask(()=>{
  if(sqlFailure)return cb(Object.assign(new Error('sensitive SQL detail'),{code:'ER_PARSE_ERROR'}));
  if(/SUM\(percentual_dia\)/.test(sql))return cb(null,[{total:used}]);
  if(/SUM\(quantidade_consumida\)/.test(sql))return cb(null,[{total:used}]);
  if(/SUM\(c.valor_total\)/.test(sql))return cb(null,[{total:'25.50'}]);
  if(/COUNT\(\*\) count/.test(sql))return cb(null,[{count:1,total:'100.00'}]);
  if(/SELECT orcamento_planejado/.test(sql))return cb(null,[{orcamento_planejado:'1000.00'}]);
  if(/FROM usuario WHERE id_usuario=\? AND idconstrutora IS NULL/.test(sql))return cb(null,[]);
  if(/SELECT id_usuario,idconstrutora,status,ocupacao FROM usuario/.test(sql))return cb(null,[fixture('usuario')]);
  if(/SELECT status FROM construtora/.test(sql))return cb(null,[{status:'Ativo'}]);
  if(/SELECT id_construtora FROM construtora/.test(sql))return cb(null,[{id_construtora:1}]);
  if(/^\s*SELECT/.test(sql)) {
    const match=sql.match(/FROM\s+(\w+)/i),table=match&&match[1];
    if(!schema[table])return cb(new Error('Consulta não prevista no simulador: '+sql));
    if(/AS __obra/.test(sql)) {
      const id=Number(params[0]),spec=Object.values(resources).find(s=>s[0]===table);
      const tenant=id===2?2:1;
      if(id>3 || (spec[2] && sql.includes(spec[2]+'=?') && Number(params[1])!==tenant))return cb(null,[]);
      return cb(null,[{...fixture(table,id),__obra:['usuario','construtora','cargo'].includes(table)?null:id}]);
    }
    const row=fixture(table);
    if(/ORDER BY t\./.test(sql)&&table==='usuario')delete row.senha;
    return cb(null,[row]);
  }
  cb(null,{insertId:10,affectedRows:1});
 });
},getConnection(cb){const c={release(){},promise(){return {async beginTransaction(){},async commit(){commits++;},async rollback(){rollbacks++;}};}};cb(null,c);}};
require.cache[require.resolve('../../config/connection')]={id:require.resolve('../../config/connection'),filename:require.resolve('../../config/connection'),loaded:true,exports:mock};
const app=require('../../app');
const token=()=>jwt.sign({id_usuario:1,idconstrutora:1},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:'1h'});
const auth=r=>r.set('Authorization','Bearer '+token());
beforeEach(()=>{calls.length=0;role='Gerência';active='Ativo';changedTenant=1;used=0;sqlFailure=false;});
test('Health público não afirma conexão MySQL',async()=>{const r=await request(app).get('/api/health');assert.equal(r.status,200);assert.notEqual(r.body.banco_dados,'conectado');assert.equal(calls.length,0);});
for(const [key,spec] of Object.entries(resources)) {
 test(key+': exige autenticação',async()=>{const r=await request(app).get('/api/'+key);assert.equal(r.status,401);assert.equal(calls.length,0);});
 if(key==='cargos')continue;
 test(key+': lista usa filtro SQL da construtora autenticada',async()=>{
  const r=await auth(request(app).get('/api/'+key+(requiredFilters[key]?'?'+requiredFilters[key][0]+'=1':'')));assert.equal(r.status,200,JSON.stringify(r.body));assert.ok(Array.isArray(r.body));
  const q=calls.find(c=>c.sql.includes('ORDER BY t.'));assert.ok(q.sql.includes(spec[2]+'=?'));assert.equal(q.params[0],1);
  if(key==='usuarios')assert.equal(r.body[0].senha,undefined);
 });
 for(const method of ['get','put','delete'])test(key+': impede '+method+' de outra construtora',async()=>{
  const path='/api/'+key+(method==='put'?'/insert':method==='delete'?'/del':'')+'/2';
  const r=await auth(request(app)[method](path)).send({});assert.equal(r.status,404,JSON.stringify(r.body));assert.ok(!calls.some(c=>/^\s*(INSERT|UPDATE|DELETE)/.test(c.sql)));
 });
}
test('Rotas com maiúsculas mantêm isolamento',async()=>{const r=await auth(request(app).get('/API/OBRAS/2'));assert.equal(r.status,404);});
test('Alias de obra na EAP preserva filtro',async()=>{const r=await auth(request(app).get('/api/atividades-eap?id_obra=1'));assert.equal(r.status,200);assert.ok(calls.some(c=>c.sql.includes('t.idx_obra=?')&&c.params[1]==='1'));});

for(const [key,fields] of Object.entries(requiredFilters))test(key+': preserva filtro obrigatório',async()=>{const r=await auth(request(app).get('/api/'+key));assert.equal(r.status,400);});
for(const [key,table] of [['etapas','etapa'],['equipes-terceirizadas','cadastro_de_equipes_terceirizadas'],['atividades-eap','atividade_eap'],['atrasos','atraso'],['paralisacoes','paralisacao'],['apontamentos-fisicos','apontamento_fisico'],['apropriacoes','apropriacao'],['equipes-etapas','equipe_etapa'],['metricas-eva','metricas_eva'],['registro-relatorios','registro_relatorios'],['orcamentos-previstos','orcamento_previsto'],['diarios-obra','diario_obra']])test(key+': gravação válida no fluxo HTTP',async()=>{const r=await auth(request(app).post('/api/'+key+'/insert')).send(fixture(table));assert.equal(r.status,201,JSON.stringify(r.body));assert.match(r.headers['content-type'],/json/);});
test('Referências de obras distintas da mesma construtora são rejeitadas',async()=>{const data=fixture('custo_realizado');data.id_etapa=3;const r=await auth(request(app).post('/api/custos-realizados/insert')).send(data);assert.equal(r.status,400);assert.match(r.body.message,/mesma obra/);});
test('Progresso acumulado acima de 100 é rejeitado',async()=>{used=99;const data=fixture('apontamento_fisico');data.percentual_dia=2;const r=await auth(request(app).post('/api/apontamentos-fisicos/insert')).send(data);assert.equal(r.status,400);});
test('Alias de obra no cadastro EAP',async()=>{const data=fixture('atividade_eap');data.id_obra=data.idx_obra;delete data.idx_obra;const r=await auth(request(app).post('/api/atividades-eap/insert')).send(data);assert.equal(r.status,201,JSON.stringify(r.body));});
test('Alias de obra no cadastro do diário',async()=>{const data=fixture('diario_obra');data.id_obra=data.obrax_id;delete data.obrax_id;const r=await auth(request(app).post('/api/diarios-obra/insert')).send(data);assert.equal(r.status,201,JSON.stringify(r.body));});

for(const key of ['equipes','insumos','maquinarios'])test(key+': PUT parcial preserva os preços DECIMAL do MySQL',async()=>{const r=await auth(request(app).put('/api/'+key+'/insert/1')).send(key==='equipes'?{nome_equipe:'Novo'}:{nome:'Novo'});assert.equal(r.status,200,JSON.stringify(r.body));});
test('Filtro obrigatório vazio é inválido',async()=>{const r=await auth(request(app).get('/api/rdo?id_obra='));assert.equal(r.status,400);});
test('Bearer com dados adicionais é recusado',async()=>{const r=await request(app).get('/api/obras').set('Authorization','Bearer '+token()+' extra');assert.equal(r.status,401);});
test('Token expirado',async()=>{const t=jwt.sign({id_usuario:1,idconstrutora:1},process.env.JWT_SECRET,{expiresIn:-1});const r=await request(app).get('/api/obras').set('Authorization','Bearer '+t);assert.equal(r.status,401);});
test('Token com assinatura inválida',async()=>{const t=jwt.sign({id_usuario:1,idconstrutora:1},randomBytes(48).toString('hex'));const r=await request(app).get('/api/obras').set('Authorization','Bearer '+t);assert.equal(r.status,401);});
test('Usuário desativado perde acesso com token válido',async()=>{active='Inativo';assert.equal((await auth(request(app).get('/api/obras'))).status,403);});
test('Vínculo alterado invalida a autorização do token',async()=>{changedTenant=2;assert.equal((await auth(request(app).get('/api/obras'))).status,403);});
test('Perfil sem permissão não grava',async()=>{role='Visitante';const r=await auth(request(app).post('/api/custos-planejados/insert')).send({});assert.equal(r.status,403);});
test('Operacional não pode alterar finanças',async()=>{role='Operacional';const r=await auth(request(app).post('/api/custos-realizados/insert')).send(fixture('custo_realizado'));assert.equal(r.status,403);});
test('Operacional registra RDO em sua obra',async()=>{role='Operacional';const r=await auth(request(app).post('/api/rdo/insert')).send(fixture('rdo'));assert.equal(r.status,201,JSON.stringify(r.body));});
test('Campo de obra de outra construtora é rejeitado',async()=>{const data=fixture('rdo');data.id_obra=2;const r=await auth(request(app).post('/api/rdo/insert')).send(data);assert.equal(r.status,404);});
test('Custo realizado valida origem inexistente',async()=>{const data=fixture('custo_realizado');data.id_origem=2;const r=await auth(request(app).post('/api/custos-realizados/insert')).send(data);assert.equal(r.status,404);});
test('Custo realizado válido passa pelos vínculos antes da gravação',async()=>{const r=await auth(request(app).post('/api/custos-realizados/insert')).send(fixture('custo_realizado'));assert.equal(r.status,201,JSON.stringify(r.body));const write=calls.find(c=>/INSERT INTO custo_realizado/.test(c.sql));assert.ok(write);assert.equal(write.transaction,true);});
test('Consumo acima do estoque não grava',async()=>{used=60;const data=fixture('consumo_insumo');data.quantidade_consumida=1;const r=await auth(request(app).post('/api/consumos-insumos/insert')).send(data);assert.equal(r.status,400);assert.ok(!calls.some(c=>/INSERT INTO consumo_insumo/.test(c.sql)));});
test('Consumo retorna JSON e confirma transação',async()=>{const before=commits;const r=await auth(request(app).post('/api/consumos-insumos/insert')).send(fixture('consumo_insumo'));assert.equal(r.status,201,JSON.stringify(r.body));assert.match(r.headers['content-type'],/json/);assert.equal(commits,before+1);});
test('Validação inválida reverte transação',async()=>{const before=rollbacks;const r=await auth(request(app).post('/api/rdo/insert')).send({});assert.equal(r.status,400);assert.equal(rollbacks,before+1);});
test('SQL interno não aparece na resposta',async()=>{sqlFailure=true;const r=await auth(request(app).get('/api/obras'));assert.equal(r.status,500);assert.ok(!JSON.stringify(r.body).includes('sensitive'));});
test('Filtro de recursos sem obra preservado',async()=>{const r=await auth(request(app).get('/api/insumos?idobra=null'));assert.equal(r.status,200);assert.ok(calls.some(c=>c.sql.includes('t.idobra IS NULL')));});
test('Login retorna JWT válido sem hash da senha',async()=>{const r=await request(app).post('/api/usuarios/login').send({email:' USER@TEST.LOCAL ',senha:password});assert.equal(r.status,200,JSON.stringify(r.body));assert.equal(r.body.usuario.senha,undefined);assert.equal(jwt.verify(r.body.token,process.env.JWT_SECRET).id_usuario,1);});
test('Login incorreto não retorna token',async()=>{const r=await request(app).post('/api/usuarios/login').send({email:'user@test.local',senha:'incorreta'});assert.equal(r.status,401);assert.equal(r.body.token,undefined);});
test('Cadastro público não permite escolher construtora ou perfil',async()=>{const r=await request(app).post('/api/usuarios/insert').send({nome:'Novo',email:'novo@test.local',senha:password,status:'Ativo',idconstrutora:2,ocupacao:'Gerência'});assert.equal(r.status,201,JSON.stringify(r.body));const write=calls.find(c=>/INSERT INTO usuario/.test(c.sql));assert.equal(write.params[3],null);assert.equal(write.params[5],'Inativo');assert.equal(write.params[6],null);assert.ok(await bcrypt.compare(password,write.params[2]));});
test('Atualizar nome preserva hash sem rehash',async()=>{const r=await auth(request(app).put('/api/usuarios/insert/1')).send({nome:'Atualizado'});assert.equal(r.status,200,JSON.stringify(r.body));const write=calls.find(c=>/UPDATE usuario/.test(c.sql));assert.ok(write);assert.ok(!/senha =/.test(write.sql));});
test('Exclusão de usuário desativa sem apagar',async()=>{const r=await auth(request(app).delete('/api/usuarios/del/1'));assert.equal(r.status,200);assert.ok(calls.some(c=>/UPDATE usuario SET status = 'Inativo'/.test(c.sql)));});
test('Projeção ignora realizado enviado e calcula pelo livro de custos',async()=>{const data=fixture('projecao_financeira');data.custo_realizado=999;data.custo_restante_estimado=10;const r=await auth(request(app).post('/api/projecoes-financeiras/insert')).send(data);assert.equal(r.status,201,JSON.stringify(r.body));const write=calls.find(c=>/INSERT INTO projecao_financeira/.test(c.sql));assert.equal(write.params[3],25.5);assert.equal(write.params[5],-64.5);});
test('JSON malformado retorna mensagem padronizada',async()=>{const r=await request(app).post('/api/usuarios/login').set('Content-Type','application/json').send('{');assert.equal(r.status,400);assert.equal(typeof r.body.message,'string');});
test('CORS permite origem configurada',async()=>{const r=await request(app).get('/api/health').set('Origin','http://localhost:5173');assert.equal(r.headers['access-control-allow-origin'],'http://localhost:5173');});
test('CORS não autoriza origem externa',async()=>{const r=await request(app).get('/api/health').set('Origin','https://externo.invalid');assert.equal(r.headers['access-control-allow-origin'],undefined);});
test('Limite de tentativas de login',async()=>{let r;for(let i=0;i<31;i++)r=await request(app).post('/api/usuarios/login').send({});assert.equal(r.status,429);assert.ok(r.headers['retry-after']);});
