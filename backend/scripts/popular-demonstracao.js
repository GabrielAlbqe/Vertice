// Provisionamento de demonstração autorizado, separado das suítes de testes.
// Sem --apply, apenas inspeciona e apresenta o plano. Não cria/altera tabelas.
const fs=require('node:fs'),path=require('node:path'),cp=require('node:child_process');
require('../config/env');
const mysql=require('mysql2/promise');
const {planoDemonstracao,ocorrenciaDemonstracao}=require('./lib/planoDemonstracao');
const {projetar}=require('../utils/financeiro');
const plan=planoDemonstracao();
const demoImageUrl=new URL('/demo/registro-obra.svg',process.env.DEMO_FRONTEND_URL||'http://localhost:5173').href;
if(!/^https?:/.test(demoImageUrl))throw new Error('DEMO_FRONTEND_URL deve usar HTTP ou HTTPS.');
const apply=process.argv.includes('--apply');
const databaseArg=process.argv.find(a=>a.startsWith('--database='))?.slice(11);
const round=n=>Math.round(n*100)/100;
const pk={obra:'id_obra',etapa:'id_etapa',atividade_eap:'id_atividade',orcamento_previsto:'id_orcamento',
 cadastro_de_equipes:'id_cadastro_equipes',cadastro_de_maquinario:'id_maquina',cadastro_de_insumos:'id_insumos',
 cadastro_de_equipes_terceirizadas:'id_equipe_terceirizada',custo_planejado:'id_custo_planejado',rdo:'id_rdo',
 rdo_equipe:'id_rdo_equipe',rdo_maquinario:'id_rdo_maquinario',consumo_insumo:'id_consumo',apropriacao:'id_apropriacao',
 diario_obra:'id_diario',apontamento_fisico:'id_apontamento',atraso:'id_atraso',paralisacao:'id_paralisacao',
 custo_realizado:'id_custo_realizado',equipe_etapa:'id_equipe_etapa',historico_obras:'id_historico',
 registro_relatorios:'id_registro_relatorio',projecao_financeira:'id_projecao',metricas_eva:'id_metrica'};
(async()=>{let db,transaction=false,locked=false;
 try{
  if(process.env.NODE_ENV==='test')throw new Error('Demonstração não faz parte dos testes.');
  if(process.env.DB_NAME!=='valen'||(apply&&databaseArg!=='valen'))throw new Error('Use a configuração valen e confirme --database=valen para aplicar.');
  db=await mysql.createConnection({host:process.env.DB_HOST,user:process.env.DB_USER,password:process.env.DB_PASSWORD,database:'valen',dateStrings:true,connectTimeout:5000});
  const [[selected]]=await db.query('SELECT DATABASE() banco');if(selected.banco!=='valen')throw new Error('Banco inesperado.');
  const [companies]=await db.query("SELECT id_construtora FROM construtora WHERE id_construtora=? AND status='Ativo'",[plan.construtora]);if(companies.length!==1)throw new Error('Construtora 1 não está ativa.');
  const [users]=await db.query("SELECT id_usuario,email FROM usuario WHERE email IN (?,?) AND status='Ativo' AND idconstrutora=?",['teste@gmail.com','testecanteiro@gmail.com',plan.construtora]);if(users.length!==2)throw new Error('As duas contas de demonstração não estão disponíveis na empresa 1.');
  const manager=users.find(u=>u.email==='teste@gmail.com').id_usuario,site=users.find(u=>u.email==='testecanteiro@gmail.com').id_usuario;
  const [existing]=await db.query('SELECT id_obra,nome FROM obra WHERE id_construtora=? AND nome IN (?,?,?)',[plan.construtora,...plan.obras.map(o=>o.nome)]);
  const preview={banco:'valen',construtora:1,obras:plan.obras.map(o=>o.nome),diasPorObra:plan.dias.length,primeiroDia:plan.dias[0],ultimoDia:plan.dias.at(-1),obrasJaExistentes:existing.length,
    modulos:['obras','etapas','EAP','orçamentos','equipes','terceirizadas','insumos','máquinas','custos planejados e realizados','RDO e vínculos','diário','apontamentos físicos','apropriações','atrasos','paralisações','histórico','relatórios','projeções','métricas EVA manuais de cenário']};
  if(!apply){console.log(JSON.stringify({modo:'somente leitura',plano:preview},null,2));return;}
  const [[lock]]=await db.query("SELECT GET_LOCK('vertice-demonstracao-v1',10) ok");if(lock.ok!==1)throw new Error('Outro provisionamento está em andamento.');locked=true;
  const [again]=await db.query('SELECT id_obra FROM obra WHERE id_construtora=? AND nome IN (?,?,?)',[plan.construtora,...plan.obras.map(o=>o.nome)]);
  if(again.length===3){console.log(JSON.stringify({aplicado:false,motivo:'Demonstração já existe; nenhum registro foi duplicado.',obras:again.map(o=>o.id_obra)}));return;}
  if(again.length)throw new Error('Há uma demonstração parcial. Revisão manual necessária; nada foi alterado.');
  const backupDir=path.join(process.env.USERPROFILE,'.codex','backups','vertice');fs.mkdirSync(backupDir,{recursive:true});
  const stamp=new Date().toISOString().replace(/[:.]/g,'-'),backup=path.join(backupDir,'valen-antes-demo-'+stamp+'.sql');
  const dump=cp.spawnSync('C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
    ['--host='+process.env.DB_HOST,'--user='+process.env.DB_USER,'--single-transaction','--routines','--triggers','--events','--hex-blob','--no-tablespaces','--set-gtid-purged=OFF','--result-file='+backup,'valen'],
    {env:{...process.env,MYSQL_PWD:process.env.DB_PASSWORD},encoding:'utf8',windowsHide:true});
  if(dump.status!==0||!fs.existsSync(backup)||!fs.statSync(backup).size)throw new Error('Backup falhou; nenhum dado inserido.');
  const manifest={versao:plan.versao,construtora:1,backup,referencia:plan.referencia,registros:{},obras:[]};
  const insert=async(table,data)=>{
    if(!pk[table])throw new Error('Tabela não autorizada no plano.');
    const fields=Object.keys(data),[r]=await db.query('INSERT INTO '+table+' ('+fields.join(',')+') VALUES ('+fields.map(()=>'?').join(',')+')',fields.map(k=>data[k]));
    const id=data[pk[table]]??r.insertId;(manifest.registros[table]??=[]).push(id);return id;
  };
  await db.beginTransaction();transaction=true;
  const [[max]]=await db.query('SELECT COALESCE(MAX(id_orcamento),0) valor FROM orcamento_previsto');let budgetId=Number(max.valor);
  if(budgetId>2147483500)throw new Error('Espaço de IDs de orçamento insuficiente.');
  for(const [wi,work]of plan.obras.entries()){
    const id=await insert('obra',{nome:work.nome,status:work.status,id_construtora:1,categoria:work.categoria,numero_pavimentos:work.pavimentos,data_inicio_planejada:'2026-09-01',data_termino_planejada:'2027-03-31',orcamento_planejado:work.orcamento});
    const etapas=[],atividades=[],equipes=[],maquinas=[],insumos=[],custosDia=[];
    for(const [si,nome]of plan.etapas.entries()){
      etapas.push(await insert('etapa',{id_obra:id,nome_etapa:nome,descricao:'[DEMO] Etapa do cenário demonstrativo.'}));
      atividades.push(await insert('atividade_eap',{descricao:'[DEMO] '+nome,idx_obra:id}));
      const value=round(work.orcamento*plan.pesos[si]/100);
      await insert('orcamento_previsto',{id_orcamento:++budgetId,valor_planejado:value,id_atividade_eap:atividades[si]});
      const proportions=[.45,.35,.2];let assigned=0;
      for(const [oi,origem]of ['Equipe','Insumo','Maquinário'].entries()){
        const amount=oi===2?round(value-assigned):round(value*proportions[oi]);assigned+=amount;
        await insert('custo_planejado',{id_obra:id,etapa:nome,origem_custo:origem,valor_planejado:amount,data_inicio_prevista:plan.dias[si*4],data_fim_prevista:plan.dias[si*4+3]});
      }
    }
    for(let ri=0;ri<3;ri++){
      const equipe={nome_equipe:['[DEMO] Estrutura','[DEMO] Instalações','[DEMO] Acabamentos'][ri],etapa_atuacao:['Infraestrutura','Instalações','Acabamentos'][ri],quantidade_profissionais:[8,6,5][ri],custo_diario:round([1800,1500,1200][ri]*work.fator),custo_mensal:round([36000,30000,24000][ri]*work.fator),idobra:id,id_construtora:1};
      equipes.push({id:await insert('cadastro_de_equipes',equipe),...equipe});
      const maquina={nome:['[DEMO] Escavadeira','[DEMO] Betoneira','[DEMO] Plataforma'][ri],quantidade:[2,3,2][ri],etapa_atuacao:['Infraestrutura','Supraestrutura e Alvenaria','Acabamentos'][ri],custo_diario:round([850,280,420][ri]*work.fator),status:'Ativo',idobra:id,id_construtora:1};
      maquinas.push({id:await insert('cadastro_de_maquinario',maquina),...maquina});
    }
    for(const [ri,name]of ['[DEMO] Cimento CP II','[DEMO] Areia média','[DEMO] Bloco cerâmico','[DEMO] Aço CA50'].entries()){
      const supply={nome:name,quantidade_disponivel:[5000,10000,15000,4000][ri],valor_unitario:round([38.5,95,2.8,42.75][ri]*work.fator),idobra:id,id_construtora:1};
      insumos.push({id:await insert('cadastro_de_insumos',supply),...supply});
    }
    await insert('cadastro_de_equipes_terceirizadas',{nome_equipe:'[DEMO] Impermeabilização especializada',custo_diario_total:round(1350*work.fator),id_obra:id});
    for(let si=0;si<6;si++)await insert('equipe_etapa',{id_equipe:equipes[si%3].id,etapa:plan.etapas[si],data_inicio:plan.dias[si*4],data_fim:plan.dias[si*4+3]});
    await insert('historico_obras',{usuario_id:manager,id_obra:id,status:'iniciada',data_atribuicao:'2026-09-01 08:00:00',data_fim:'2026-09-23'});
    await insert('historico_obras',{usuario_id:site,id_obra:id,status:wi===2?'pausada':'em andamento',data_atribuicao:plan.dias[0]+' 08:00:00',data_fim:null});
    for(const [di,date]of plan.dias.entries()){
      const stage=Math.floor(di/4),equipe=equipes[stage%3],machine=maquinas[stage%3],supply=insumos[di%2===0?0:2],extra=insumos[1];
      const occurrence=ocorrenciaDemonstracao(di,wi),rain=occurrence.paralisacao&&occurrence.origemParalisacao==='Condições Climáticas';
      const turno=['Manhã','Tarde','Noite'][di%3],clima=rain?'Chuvoso':di%4===0?'Nublado':'Ensolarado';
      const rdo=await insert('rdo',{id_obra:id,data_rdo:date,turno,clima});
      await insert('rdo_equipe',{id_rdo:rdo,id_equipe:equipe.id,etapa:plan.etapas[stage],dias_atuacao:1});
      await insert('rdo_maquinario',{id_rdo:rdo,id_maquinario:machine.id,etapa:plan.etapas[stage],quantidade_utilizada:1,tempo_utilizacao:1});
      const consumed=10+(di%4)*5,appropriated=2+(di%3);
      await insert('consumo_insumo',{id_rdo:rdo,id_insumo:supply.id,etapa:plan.etapas[stage],quantidade_consumida:consumed,custo_unitario:supply.valor_unitario});
      await insert('apropriacao',{quantidade_consumida:appropriated,tipo_compra:di%5===0?'Emergencial':'Planejada',id_insumo:extra.id,id_atividade:atividades[stage],id_usuario:site});
      const atraso=occurrence.atraso?'[DEMO] '+({Equipes:'Reorganização de frente de serviço.',Insumos:'Espera por entrega programada.',Maquinários:'Ajuste de equipamento.'}[occurrence.origemAtraso]):'Nenhum';
      const pausa=occurrence.paralisacao?'[DEMO] '+(rain?'Suspensão ilustrativa por chuva.':'Interrupção ilustrativa para protocolo de segurança.'):'Nenhuma';
      const diario=await insert('diario_obra',{data:date,clima:rain?'Chuvoso':'Ensolarado',turno,etapa_atuacao:plan.etapas[stage]==='Acabamento'?'Acabamentos':plan.etapas[stage],equipe_interna:['A','B','C'][stage%3],equipe_terceirizada:null,paralisacoes:pausa,origem_paralisacoes:occurrence.paralisacao?occurrence.origemParalisacao:null,atrasos:atraso,origem_atrasos:occurrence.atraso?occurrence.origemAtraso:null,obrax_id:id,usuario_id:site});
      await insert('apontamento_fisico',{percentual_dia:[3,3.5,4][wi],url_foto:demoImageUrl,diario_id:diario,atividade_eap_id:atividades[stage]});
      await insert('registro_relatorios',{id_diario:diario,id_obra:id,data_registro:date+' 18:00:00'});
      if(occurrence.atraso)await insert('atraso',{id_rdo:rdo,etapa:plan.etapas[stage],origem_atraso:occurrence.origemAtraso,duracao:occurrence.duracaoAtraso,descricao:atraso+' Duração numérica de demonstração; unidade não definida pelo sistema.'});
      if(occurrence.paralisacao)await insert('paralisacao',{id_rdo:rdo,etapa:plan.etapas[stage],origem_paralisacao:occurrence.origemParalisacao,duracao:occurrence.duracaoParalisacao,descricao:pausa+' Duração numérica de demonstração; unidade não definida pelo sistema.'});
      let dayTotal=0;
      for(const entry of [{origem:'Equipe',id:equipe.id,q:1,c:equipe.custo_diario},{origem:'Maquinário',id:machine.id,q:1,c:machine.custo_diario},{origem:'Insumo',id:supply.id,q:consumed,c:supply.valor_unitario},{origem:'Insumo',id:extra.id,q:appropriated,c:extra.valor_unitario}]){
        await insert('custo_realizado',{id_obra:id,id_etapa:etapas[stage],id_rdo:rdo,origem_custo:entry.origem,id_origem:entry.id,data:date,quantidade:entry.q,custo_unitario:entry.c});dayTotal+=round(entry.q*entry.c);
      }
      custosDia.push(round(dayTotal));
    }
    for(const [snapshot,dayIndex]of [7,15,23].entries()){
      const actual=round(custosDia.slice(0,dayIndex+1).reduce((s,n)=>s+n,0)),projection=projetar(actual,round(work.orcamento*[.82,.62,.42][snapshot]),work.orcamento);
      await insert('projecao_financeira',{id_obra:id,etapa:null,data_projecao:plan.dias[dayIndex],custo_realizado:projection.custo_realizado,custo_restante_estimado:projection.custo_restante_estimado,desvio_projetado:projection.desvio_projetado,desvio_projetado_percentual:projection.desvio_projetado_percentual});
      // Valores manuais do cenário [DEMO]; não introduzem fórmula automática de EVA.
      await insert('metricas_eva',{data_calculo:plan.dias[dayIndex],idc:[.94,1.01,1.04][snapshot],idp:[.88,.94,.98][snapshot],eac:projection.custo_final_projetado,obra_idxx:id});
    }
    manifest.obras.push({id,nome:work.nome,orcamento:work.orcamento,custoRealizado:round(custosDia.reduce((s,n)=>s+n,0))});
  }
  // Validação da própria carga antes do commit; somente registros recém-criados.
  for(const w of manifest.obras){
    const [[r]]=await db.query('SELECT COUNT(*) total FROM rdo WHERE id_obra=?',[w.id]);if(r.total!==24)throw new Error('Carga incompleta de RDO.');
    const [[p]]=await db.query('SELECT SUM(valor_planejado) total FROM custo_planejado WHERE id_obra=?',[w.id]);if(Number(p.total)!==w.orcamento)throw new Error('Planejamento inconsistente.');
    const [[c]]=await db.query('SELECT SUM(valor_total) total FROM custo_realizado WHERE id_obra=?',[w.id]);if(round(Number(c.total))!==w.custoRealizado)throw new Error('Custos inconsistentes.');
    const [physical]=await db.query('SELECT SUM(p.percentual_dia) total FROM apontamento_fisico p JOIN atividade_eap a ON a.id_atividade=p.atividade_eap_id WHERE a.idx_obra=? GROUP BY a.id_atividade HAVING total>100',[w.id]);if(physical.length)throw new Error('Progresso físico excedente.');
  }
  const manifestFile=path.join(backupDir,'demonstracao-valen-v1-'+stamp+'.json');fs.writeFileSync(manifestFile,JSON.stringify(manifest,null,2));
  await db.commit();transaction=false;
  console.log(JSON.stringify({aplicado:true,backup,manifest:manifestFile,obras:manifest.obras,quantidades:Object.fromEntries(Object.entries(manifest.registros).map(([t,ids])=>[t,ids.length]))},null,2));
 }catch(e){if(db&&transaction)await db.rollback();console.error('Demonstração não concluída: '+(e.code||e.message));process.exitCode=1;}
 finally{if(db){if(locked)await db.query("SELECT RELEASE_LOCK('vertice-demonstracao-v1')");await db.end();}}
})();
