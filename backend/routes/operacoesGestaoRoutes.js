const router=require('express').Router();
const {pool,wrap,fail,id,text,option,date,obra,related,write}=require('../utils/operacional');
const {office,disponivel,registrar}=require('../utils/auditoria');
const today=()=>new Intl.DateTimeFormat('sv-SE',{timeZone:'America/Sao_Paulo'}).format(new Date());
function decimal(v,max,nullable=false){if(nullable&&(v===null||v===undefined||v===''))return null;if(!['string','number'].includes(typeof v)||String(v).trim()===''||!Number.isFinite(Number(v))||Number(v)<0||Number(v)>max||Math.abs(Number(v)*100-Math.round(Number(v)*100))>0.00001)fail(400,'Valor numérico inválido.');return Number(v);}
function day(v){if(typeof v!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(v)||v<'1000-01-01'||v>'9998-12-31'||!Number.isFinite(Date.parse(v))||new Date(v).toISOString().slice(0,10)!==v)fail(400,'Data inválida.');return v;}
function period(req){const a=req.query.inicio?day(req.query.inicio):null,b=req.query.fim?day(req.query.fim):null;if(a&&b&&a>b)fail(400,'Período inválido.');return [a,b];}
async function work(req){const w=id(req.query.obra_id||req.body?.obra_id);await obra(pool,w,req.acesso);return w;}
async function mutation(req,res,fn){const result=await write(req,fn);res.status(result.repeated?200:201).json(result.result);}
router.get('/estado',wrap(async(req,res)=>res.json({habilitado:await disponivel(pool)})));
router.use(wrap(async(req,res,next)=>{if(!await disponivel(pool))fail(503,'A gestão integrada aguarda habilitação pelo responsável pelo sistema.');next();}));
router.get('/estoque',wrap(async(req,res)=>{
 const w=await work(req),[a,b]=period(req);
 const [materiais]=await pool.query('SELECT i.*,c.unidade,c.minimo FROM cadastro_de_insumos i LEFT JOIN estoque_config c ON c.insumo_id=i.id_insumos WHERE i.idobra=? ORDER BY i.nome',[w]);
 const [movimentos]=await pool.query('SELECT m.*,i.nome,u.nome responsavel FROM estoque_movimento m JOIN cadastro_de_insumos i ON i.id_insumos=m.insumo_id JOIN usuario u ON u.id_usuario=m.usuario_id WHERE i.idobra=? AND (? IS NULL OR m.competencia>=?) AND (? IS NULL OR m.competencia<=?) ORDER BY m.id DESC LIMIT 200',[w,a,a,b,b]);
 const [consumos]=await pool.query("SELECT a.id_apropriacao,a.id_insumo,a.quantidade_consumida,i.nome,u.nome responsavel FROM apropriacao a JOIN atividade_eap e ON e.id_atividade=a.id_atividade JOIN cadastro_de_insumos i ON i.id_insumos=a.id_insumo JOIN usuario u ON u.id_usuario=a.id_usuario WHERE e.idx_obra=? AND i.idobra=? AND (?=0 OR a.id_usuario=?) AND NOT EXISTS(SELECT 1 FROM estoque_movimento m WHERE m.apropriacao_id=a.id_apropriacao) ORDER BY a.id_apropriacao DESC LIMIT 200",[w,w,String(req.acesso.ambiente)==='Canteiro'?1:0,req.acesso.id_usuario]);
 res.json({materiais,movimentos,consumos});
}));
router.put('/estoque/:id',wrap(async(req,res)=>{
 office(req);const material=id(req.params.id),w=await work(req),unidade=text(req.body.unidade,20),minimo=decimal(req.body.minimo,99999999.99,true);
 await mutation(req,res,async c=>{await obra(c,w,req.acesso,true);await related(c,'cadastro_de_insumos','id_insumos',material,'idobra',w);await c.query('INSERT INTO estoque_config(insumo_id,unidade,minimo) VALUES (?,?,?) ON DUPLICATE KEY UPDATE unidade=VALUES(unidade),minimo=VALUES(minimo)',[material,unidade,minimo]);await registrar(c,req,'Estoque configurado','insumo',material,w,{unidade,minimo});return {insertId:material};});
}));
router.post('/estoque',wrap(async(req,res)=>{
 const b=req.body,w=await work(req),material=id(b.insumo_id),tipo=option(b.tipo,['Entrada','Saida']),quantity=decimal(b.quantidade,2147483647),competencia=date(b.competencia),descricao=text(b.descricao,500),consumo=b.apropriacao_id?id(b.apropriacao_id):null;
 if(!Number.isSafeInteger(quantity)||quantity<=0)fail(400,'O estoque atual exige quantidade inteira positiva.');
 if(tipo==='Entrada'||!consumo)office(req);
 if(tipo==='Entrada'&&consumo)fail(400,'Entrada não pode confirmar consumo.');
 await mutation(req,res,async c=>{
  await obra(c,w,req.acesso,true);
  const [rows]=await c.query('SELECT i.*,c.unidade FROM cadastro_de_insumos i LEFT JOIN estoque_config c ON c.insumo_id=i.id_insumos WHERE i.id_insumos=? AND i.idobra=? FOR UPDATE',[material,w]);
  const r=rows[0];if(!r)fail(403,'Material indisponível nesta obra.');
  if(!r.unidade||!Number.isInteger(r.quantidade_disponivel)||r.quantidade_disponivel<0)fail(409,'Informe unidade e saldo inicial válido antes de movimentar.');
  if(consumo){const [matches]=await c.query('SELECT a.* FROM apropriacao a JOIN atividade_eap e ON e.id_atividade=a.id_atividade WHERE a.id_apropriacao=? AND a.id_insumo=? AND e.idx_obra=? FOR UPDATE',[consumo,material,w]);const record=matches[0];if(!record||Number(record.quantidade_consumida)!==quantity)fail(400,'Consumo incompatível com material, obra ou quantidade.');if(String(req.acesso.ambiente)==='Canteiro'&&record.id_usuario!==req.acesso.id_usuario)fail(403,'Confirme somente seu próprio consumo.');}
  const saldo=r.quantidade_disponivel+(tipo==='Entrada'?quantity:-quantity);if(saldo<0||saldo>2147483647)fail(409,'Saldo insuficiente ou acima do limite.');
  let inserted;try{[inserted]=await c.query('INSERT INTO estoque_movimento(insumo_id,usuario_id,tipo,quantidade,saldo_apos,competencia,descricao,apropriacao_id) VALUES (?,?,?,?,?,?,?,?)',[material,req.acesso.id_usuario,tipo,quantity,saldo,competencia,descricao,consumo]);}catch(e){if(e.code==='ER_DUP_ENTRY')fail(409,'Consumo já confirmado no estoque.');throw e;}
  await c.query('UPDATE cadastro_de_insumos SET quantidade_disponivel=? WHERE id_insumos=?',[saldo,material]);
  await registrar(c,req,'Movimentação de estoque','estoque',inserted.insertId,w,{insumo_id:material,tipo,quantidade:quantity,saldo_apos:saldo});return {insertId:inserted.insertId,saldo};
 });
}));
router.get('/cronograma',wrap(async(req,res)=>{
 const w=await work(req),[a,b]=period(req);
 res.json((await pool.query(`SELECT e.*,p.*,u.nome responsavel,a.descricao atividade,(SELECT SUM(ap.percentual_dia) FROM apontamento_fisico ap WHERE ap.atividade_eap_id=a.id_atividade) progresso_canteiro,CASE WHEN p.fim_previsto<? AND p.situacao<>'Concluida' THEN TRUE ELSE FALSE END atrasada FROM etapa e LEFT JOIN etapa_planejamento p ON p.etapa_id=e.id_etapa LEFT JOIN usuario u ON u.id_usuario=p.responsavel_id LEFT JOIN atividade_eap a ON a.id_atividade=p.atividade_id AND a.idx_obra=e.id_obra WHERE e.id_obra=? AND (? IS NULL OR p.fim_previsto>=?) AND (? IS NULL OR p.inicio_previsto<=?) ORDER BY p.inicio_previsto,e.id_etapa`,[today(),w,a,a,b,b]))[0]);
}));
router.post('/cronograma',wrap(async(req,res)=>{
 office(req);const w=await work(req),nome=option(req.body.nome,['Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento']);
 await mutation(req,res,async c=>{await obra(c,w,req.acesso,true);const [existing]=await c.query('SELECT id_etapa FROM etapa WHERE id_obra=? AND nome_etapa=?',[w,nome]);if(existing.length)fail(409,'Etapa já cadastrada nesta obra.');const [r]=await c.query('INSERT INTO etapa(id_obra,nome_etapa) VALUES (?,?)',[w,nome]);await registrar(c,req,'Etapa criada','etapa',r.insertId,w,{nome});return {insertId:r.insertId};});
}));
router.put('/cronograma/:id',wrap(async(req,res)=>{
 const w=await work(req),stage=id(req.params.id),b=req.body;
 await mutation(req,res,async c=>{
  await obra(c,w,req.acesso,true);await related(c,'etapa','id_etapa',stage,'id_obra',w);
  const [old]=await c.query('SELECT * FROM etapa_planejamento WHERE etapa_id=? FOR UPDATE',[stage]);const isOffice=String(req.acesso.ambiente).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase()==='escritorio';
  if(!isOffice&&(!old.length||Object.keys(b).some(k=>!['obra_id','situacao','progresso','inicio_real','fim_real'].includes(k))))fail(403,'Canteiro pode atualizar somente a execução de uma etapa planejada.');
  const data=isOffice?b:{...old[0],...b};
  const start=day(data.inicio_previsto instanceof Date?data.inicio_previsto.toISOString().slice(0,10):data.inicio_previsto),end=day(data.fim_previsto instanceof Date?data.fim_previsto.toISOString().slice(0,10):data.fim_previsto);
  const real=v=>v?date(v instanceof Date?v.toISOString().slice(0,10):v):null,rs=real(data.inicio_real),re=real(data.fim_real),status=option(data.situacao,['Planejada','Em andamento','Concluida','Paralisada']),progress=decimal(data.progresso,100,true),responsavel=data.responsavel_id?id(data.responsavel_id):null,activity=data.atividade_id?id(data.atividade_id):null;
  if(end<start||(re&&(!rs||re<rs))||(status==='Concluida'&&(!re||progress!==100))||(status==='Em andamento'&&!rs)||(re&&status!=='Concluida')||(progress>0&&!rs)||(progress===100&&status!=='Concluida')||(status==='Planejada'&&(rs||re||progress>0)))fail(400,'Datas, situação e avanço incompatíveis.');
  if(data.critica!==true&&data.critica!==false&&data.critica!==0&&data.critica!==1)fail(400,'Criticidade inválida.');
  if(responsavel&&!(await c.query("SELECT id_usuario FROM usuario WHERE id_usuario=? AND idconstrutora=? AND status='Ativo'",[responsavel,req.acesso.idconstrutora]))[0].length)fail(403,'Responsável indisponível.');
  if(activity)await related(c,'atividade_eap','id_atividade',activity,'idx_obra',w);
  await c.query('INSERT INTO etapa_planejamento(etapa_id,inicio_previsto,fim_previsto,inicio_real,fim_real,responsavel_id,situacao,progresso,critica,atividade_id) VALUES (?,?,?,?,?,?,?,?,?,?) ON DUPLICATE KEY UPDATE inicio_previsto=VALUES(inicio_previsto),fim_previsto=VALUES(fim_previsto),inicio_real=VALUES(inicio_real),fim_real=VALUES(fim_real),responsavel_id=VALUES(responsavel_id),situacao=VALUES(situacao),progresso=VALUES(progresso),critica=VALUES(critica),atividade_id=VALUES(atividade_id)',[stage,start,end,rs,re,responsavel,status,progress,Boolean(data.critica),activity]);
  await registrar(c,req,'Etapa atualizada','etapa',stage,w,{situacao:status,progresso:progress,inicio_previsto:start,fim_previsto:end,inicio_real:rs,fim_real:re,critica:Boolean(data.critica),responsavel_id:responsavel,atividade_id:activity});return {insertId:stage};
 });
}));
router.get('/maquinas',wrap(async(req,res)=>{const w=await work(req),[a,b]=period(req);res.json((await pool.query('SELECT e.*,m.nome,m.status equipamento_status,u.nome responsavel,EXISTS(SELECT 1 FROM maquina_evento f WHERE f.manutencao_id=e.id) concluida FROM maquina_evento e JOIN cadastro_de_maquinario m ON m.id_maquina=e.maquinario_id JOIN usuario u ON u.id_usuario=e.usuario_id WHERE m.idobra=? AND (? IS NULL OR e.fim>=?) AND (? IS NULL OR e.inicio<=?) ORDER BY e.inicio DESC,e.id DESC LIMIT 200',[w,a,a,b,b]))[0]);}));
router.post('/maquinas',wrap(async(req,res)=>{
 const w=await work(req),b=req.body,machine=id(b.maquinario_id),tipo=option(b.tipo,['Utilizacao','Manutencao prevista','Manutencao concluida','Indisponibilidade','Disponibilidade']),start=day(b.inicio),end=day(b.fim),hours=decimal(b.horas,999999.99,true),cost=decimal(b.custo,9999999999.99,true),description=text(b.descricao,500),diary=b.diario_id?id(b.diario_id):null;
 if(end<start||(tipo!=='Manutencao prevista'&&(start>today()||end>today()))||(hours!==null&&hours<=0))fail(400,'Período ou horas inválidos.');
 if(tipo!=='Utilizacao'||cost!==null)office(req);
 if(tipo==='Utilizacao'&&hours===null)fail(400,'Informe horas de utilização.');
 await mutation(req,res,async c=>{
  await obra(c,w,req.acesso,true);const m=await related(c,'cadastro_de_maquinario','id_maquina',machine,'idobra',w);
  if(diary)await related(c,'diario_obra','id_diario',diary,'obrax_id',w);
  const planned=b.manutencao_id?id(b.manutencao_id):null;
  if(tipo==='Manutencao concluida'){
   if(!planned)fail(400,'Selecione a manutenção prevista a concluir.');
   const [target]=await c.query("SELECT id FROM maquina_evento WHERE id=? AND maquinario_id=? AND tipo='Manutencao prevista' AND inicio<=? FOR UPDATE",[planned,machine,start]);if(!target.length)fail(400,'Manutenção prevista incompatível.');
   if((await c.query('SELECT id FROM maquina_evento WHERE manutencao_id=?',[planned]))[0].length)fail(409,'Manutenção já concluída.');
  }else if(planned)fail(400,'Vínculo de manutenção inválido.');
  const [existing]=await c.query('SELECT e.id,e.tipo,(SELECT MIN(f.fim) FROM maquina_evento f WHERE f.manutencao_id=e.id) concluida FROM maquina_evento e WHERE e.maquinario_id=? AND e.inicio<=? AND e.fim>=? FOR UPDATE',[machine,end,start]);
  if(existing.some(e=>e.tipo===tipo))fail(409,'Já existe um registro deste tipo no período.');
  if(tipo==='Utilizacao'&&(m.status!=='Ativo'||existing.some(e=>e.tipo==='Indisponibilidade'||(e.tipo==='Manutencao prevista'&&(!e.concluida||String(e.concluida instanceof Date?e.concluida.toISOString():e.concluida).slice(0,10)>=start)))))fail(409,'Equipamento indisponível neste período.');
  if(tipo==='Utilizacao'&&hours>(Math.round((Date.parse(end)-Date.parse(start))/86400000)+1)*24*Number(m.quantidade||0))fail(400,'Horas excedem o período e a quantidade cadastrada.');
  const [r]=await c.query('INSERT INTO maquina_evento(maquinario_id,usuario_id,tipo,inicio,fim,horas,custo,descricao,diario_id,manutencao_id) VALUES (?,?,?,?,?,?,?,?,?,?)',[machine,req.acesso.id_usuario,tipo,start,end,hours,cost,description,diary,planned]);
  if(['Indisponibilidade','Disponibilidade'].includes(tipo))await c.query('UPDATE cadastro_de_maquinario SET status=? WHERE id_maquina=?',[tipo==='Disponibilidade'?'Ativo':'Inativo',machine]);
  await registrar(c,req,'Maquinário: '+tipo,'maquinario',machine,w,{evento_id:r.insertId,inicio:start,fim:end,horas:hours,custo:cost,diario_id:diary});return {insertId:r.insertId,message:'Registro confirmado. Custos informados aqui não geram despesas no livro financeiro.'};
 });
}));
router.get('/historico',wrap(async(req,res)=>{
 office(req);const [a,b]=period(req),args=[req.acesso.idconstrutora];let sql='SELECT a.*,u.nome responsavel FROM gestao_auditoria a JOIN usuario u ON u.id_usuario=a.usuario_id WHERE a.construtora_id=?';
 if(req.query.obra_id){const w=await work(req);sql+=' AND a.obra_id=?';args.push(w);}
 if(req.query.recurso){sql+=' AND a.recurso=?';args.push(text(req.query.recurso,50));}
 if(req.query.recurso_id){sql+=' AND a.recurso_id=?';args.push(id(req.query.recurso_id));}
 if(a){sql+=' AND a.registrado_em>=?';args.push(a+' 03:00:00');}if(b){sql+=' AND a.registrado_em<?';args.push(new Date(Date.parse(b)+86400000).toISOString().slice(0,10)+' 03:00:00');}
 res.json((await pool.query(sql+' ORDER BY a.id DESC LIMIT 200',args))[0]);
}));
async function notifications(req){
 const w=await work(req),out=[],[from,to]=period(req);
 const add=(chave,titulo,tipo,recurso,recurso_id,link,competencia=today())=>{const data=String(competencia instanceof Date?competencia.toISOString():competencia).slice(0,10);if((!from||data>=from)&&(!to||data<=to))out.push({chave,titulo,tipo,recurso,recurso_id,link,data});};
 for(const r of (await pool.query("SELECT id_ocorrencia,descricao,prazo_previsto,registrado_em FROM ocorrencia_obra WHERE obra_id=? AND status='Aberta' AND (prioridade IN ('Alta','Critica') OR prazo_previsto<?)",[w,today()]))[0])add('ocorrencia:'+r.id_ocorrencia,r.descricao,'Pendência','ocorrencia',r.id_ocorrencia,'ocorrencias',r.prazo_previsto||r.registrado_em);
 for(const r of (await pool.query("SELECT p.etapa_id,e.nome_etapa,p.fim_previsto FROM etapa_planejamento p JOIN etapa e ON e.id_etapa=p.etapa_id WHERE e.id_obra=? AND p.fim_previsto<? AND p.situacao<>'Concluida'",[w,today()]))[0])add('etapa:'+r.etapa_id,r.nome_etapa+' está atrasada','Cronograma','etapa',r.etapa_id,'cronograma',r.fim_previsto);
 for(const r of (await pool.query('SELECT i.id_insumos,i.nome FROM cadastro_de_insumos i JOIN estoque_config c ON c.insumo_id=i.id_insumos WHERE i.idobra=? AND c.minimo IS NOT NULL AND i.quantidade_disponivel<=c.minimo',[w]))[0])add('estoque:'+r.id_insumos,r.nome+' abaixo do limite configurado','Estoque','insumo',r.id_insumos,'estoque');
 for(const r of (await pool.query("SELECT e.id,e.maquinario_id,m.nome,e.inicio FROM maquina_evento e JOIN cadastro_de_maquinario m ON m.id_maquina=e.maquinario_id WHERE m.idobra=? AND e.tipo='Manutencao prevista' AND e.inicio<=DATE_ADD(?,INTERVAL 7 DAY) AND NOT EXISTS(SELECT 1 FROM maquina_evento f WHERE f.manutencao_id=e.id)",[w,today()]))[0])add('manutencao:'+r.id,r.nome+' possui manutenção prevista','Manutenção','maquinario',r.maquinario_id,'maquinas',r.inicio);
 for(const r of (await pool.query('SELECT d.id_diario,d.data FROM diario_obra d WHERE d.obrax_id=? ORDER BY d.id_diario DESC LIMIT 10',[w]))[0])add('diario:'+r.id_diario,'Diário de obra #'+r.id_diario,'Canteiro','diario',r.id_diario,'diarios',r.data);
 for(const r of (await pool.query("SELECT id,evento,recurso,recurso_id,registrado_em FROM gestao_auditoria WHERE construtora_id=? AND obra_id=? AND recurso IN ('etapa','maquinario','obra') ORDER BY id DESC LIMIT 10",[req.acesso.idconstrutora,w]))[0])add('alteracao:'+r.id,r.evento,'Atualização',r.recurso,r.recurso_id,r.recurso==='etapa'?'cronograma':r.recurso==='obra'?'obra':'maquinas',r.registrado_em);
 const read=new Set(out.length?(await pool.query('SELECT chave FROM notificacao_leitura WHERE usuario_id=? AND chave IN (?)',[req.acesso.id_usuario,out.map(r=>r.chave)]))[0].map(r=>r.chave):[]);const priority=type=>({'Pendência':0,'Cronograma':1,'Estoque':2,'Manutenção':3}[type]??4);return [...new Map(out.map(r=>[r.chave,r])).values()].map(r=>({...r,lida:read.has(r.chave)})).sort((a,b)=>Number(a.lida)-Number(b.lida)||priority(a.tipo)-priority(b.tipo)||a.data.localeCompare(b.data)||a.chave.localeCompare(b.chave));
}
router.get('/notificacoes',wrap(async(req,res)=>res.json(await notifications(req))));
router.post('/notificacoes/lida',wrap(async(req,res)=>{const key=text(req.body.chave,150),rows=await notifications(req);if(!rows.some(r=>r.chave===key))fail(404,'Notificação indisponível.');await mutation(req,res,async c=>{await c.query('INSERT IGNORE INTO notificacao_leitura(usuario_id,chave) VALUES (?,?)',[req.acesso.id_usuario,key]);return {chave:key};});}));
module.exports=router;
