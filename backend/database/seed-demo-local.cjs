// Carga demonstrativa solicitada pelo usuário. Nunca executada pelo startup.
// Uso exige --apply-local-demo, login do Escritório e backup atual verificado.
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
const hash=rows=>crypto.createHash('sha256').update(JSON.stringify(rows.map(r=>JSON.stringify(r)).sort())).digest('hex');
const stages=['Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamentos'];
const definitions=[
  {nome:'[TESTE] Residencial Horizonte',status:'Em Andamento',categoria:'Residencial',numero_pavimentos:12,data_inicio_planejada:'2026-08-03',data_termino_planejada:'2027-08-31',orcamento_planejado:4800000},
  {nome:'[TESTE] Centro Comercial Aurora',status:'Planejamento',categoria:'Comercial',numero_pavimentos:3,data_inicio_planejada:'2026-12-01',data_termino_planejada:'2027-10-29',orcamento_planejado:2600000},
  {nome:'[TESTE] Galpão Industrial Norte',status:'Paralisada',categoria:'Industrial',numero_pavimentos:1,data_inicio_planejada:'2026-07-01',data_termino_planejada:'2027-03-31',orcamento_planejado:1800000},
  {nome:'[TESTE] Reforma Escola Modelo',status:'Concluida',categoria:'Reforma',numero_pavimentos:2,data_inicio_planejada:'2026-02-02',data_termino_planejada:'2026-10-15',orcamento_planejado:650000}
];
const materials=[['Cimento CP II (sacos 50kg)',200,38],['Areia média (m³)',40,160],['Brita 1 (m³)',35,190],['Aço CA-50 (barras 12m)',120,85],['Bloco cerâmico (unidades)',5000,3],['Concreto usinado (m³)',60,450],['Argamassa (sacos 20kg)',150,24],['Tubo PVC 100mm (barras 6m)',80,95],['Cabo 2,5mm² (rolos 100m)',25,230],['Tinta acrílica (latas 18L)',40,280],['Cerâmica (caixas 2m²)',200,65],['Madeira formas (peças)',100,55]];
const machines=[['Escavadeira',1,1,1100],['Betoneira',2,2,180],['Guindaste',1,0,1500],['Compactador',2,1,220],['Gerador',1,3,350]];
const staff=[['Mobilização',3,450],['Fundações',8,1200],['Estrutura e alvenaria',10,1600],['Instalações',5,950],['Revestimentos',6,1000],['Acabamentos',4,750]];
const external=[['Instalações elétricas',1200],['Instalações hidráulicas',950],['Climatização',1600]];
async function main(){
  assert.ok(process.argv.includes('--apply-local-demo'),'Informe --apply-local-demo explicitamente.');
  assert.equal(process.env.DB_NAME,'valen','Esta carga é exclusiva do valen local.');
  assert.ok(['localhost','127.0.0.1'].includes(process.env.DB_HOST),'Host remoto não autorizado.');
  assert.ok(process.env.VERTICE_DEMO_EMAIL&&process.env.VERTICE_DEMO_PASSWORD,'Forneça credenciais por ambiente; não grave senhas neste script.');
  const c=await require('mysql2/promise').createConnection({...require('../config/environment').databaseOptions(),dateStrings:true});
  let server,legacy,pool;
  const created={},reused={},records=[];
  try{
    const evidence=JSON.parse(fs.readFileSync(path.join(__dirname,'backup-final-verification.json'),'utf8'));
    assert.ok(evidence.restoredDataIdentical&&evidence.originalDataPreserved&&evidence.source==='valen');
    assert.ok(Date.now()-Date.parse(evidence.verifiedAt)<30*60*1000,'Gere um novo backup verificado antes da carga.');
    const backup=path.join(__dirname,evidence.backup),buffer=fs.readFileSync(backup);
    assert.equal(crypto.createHash('sha256').update(buffer).digest('hex'),evidence.sha256,'Backup divergente.');
    const manifest=JSON.parse(fs.readFileSync(backup+'.json','utf8'));
    const before={},keys={};
    for(const table of Object.keys(manifest.tables)){
      const rows=(await c.query('SELECT * FROM ??',[table]))[0];
      assert.equal(hash(rows),manifest.tables[table].sha256,'Banco mudou desde o backup: '+table);
      before[table]=rows;keys[table]=(await c.query("SELECT COLUMN_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND CONSTRAINT_NAME='PRIMARY' ORDER BY ORDINAL_POSITION",[table]))[0].map(r=>r.COLUMN_NAME);
    }
    const company=(await c.query('SELECT id_construtora FROM construtora WHERE razao_social=?',['Construtora Testes Locais Vértice']))[0];assert.equal(company.length,1);const companyId=company[0].id_construtora;
    const app=require('../app');legacy=require('../config/connection');pool=require('../config/operacional');server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));const api=`http://127.0.0.1:${server.address().port}/api`;
    const login=await fetch(api+'/usuarios/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:process.env.VERTICE_DEMO_EMAIL,senha:process.env.VERTICE_DEMO_PASSWORD})});assert.equal(login.status,200,'Login recusado');const session=await login.json();
    assert.equal(session.usuario.ambiente,'Escritório');assert.equal(session.usuario.idconstrutora,companyId);const headers={Authorization:`Bearer ${session.token}`,'Content-Type':'application/json'};
    async function ensure(table,pk,route,payload,identity){
      const fields=Object.keys(identity),values=Object.values(identity),sql='SELECT * FROM ?? WHERE '+fields.map(f=>'??=?').join(' AND '),args=[table,...fields.flatMap((f,i)=>[f,values[i]])];
      let rows=(await c.query(sql,args))[0];assert.ok(rows.length<=1,'Identidade duplicada: '+table);
      if(!rows.length){const r=await fetch(api+route+'/insert',{method:'POST',headers,body:JSON.stringify(payload)});assert.equal(r.status,201,'Cadastro recusado em '+table);rows=(await c.query(sql,args))[0];assert.equal(rows.length,1);created[table]=(created[table]||0)+1;}else reused[table]=(reused[table]||0)+1;
      records.push({table,id:rows[0][pk],obra:payload.idobra||payload.id_obra||payload.idx_obra||rows[0].id_obra});return rows[0][pk];
    }
    for(const [index,definition] of definitions.entries()){
      const work=await ensure('obra','id_obra','/obras',{...definition,id_construtora:companyId},{id_construtora:companyId,nome:definition.nome});
      for(const [name,quantity,price] of materials){const nome='[TESTE] '+name;assert.ok(nome.length<=45);await ensure('cadastro_de_insumos','id_insumos','/insumos',{nome,quantidade_disponivel:quantity*(index+1),valor_unitario:price,idobra:work},{idobra:work,nome});}
      for(const [name,quantity,stage,cost] of machines){const nome='[TESTE] '+name;await ensure('cadastro_de_maquinario','id_maquina','/maquinarios',{nome,quantidade:quantity,etapa_atuacao:stages[stage],custo_diario:cost,status:'Ativo',idobra:work},{idobra:work,nome});}
      for(const [i,[name,quantity,cost]] of staff.entries()){const nome_equipe='[TESTE] '+name;await ensure('cadastro_de_equipes','id_cadastro_equipes','/equipes',{nome_equipe,etapa_atuacao:stages[i],quantidade_profissionais:quantity,custo_diario:cost,custo_mensal:cost*22,idobra:work},{idobra:work,nome_equipe});}
      for(const [name,cost] of external){const nome_equipe='[TESTE] '+name;await ensure('cadastro_de_equipes_terceirizadas','id_equipe_terceirizada','/equipes-terceirizadas',{nome_equipe,custo_diario_total:cost,id_obra:work},{id_obra:work,nome_equipe});}
      const start=Date.parse(definition.data_inicio_planejada),duration=Date.parse(definition.data_termino_planejada)-start,weights=[.05,.2,.25,.2,.15,.15];
      for(const [i,stage] of stages.entries()){
        const descricao='[TESTE] '+stage;await ensure('atividade_eap','id_atividade','/atividades-eap',{descricao,idx_obra:work},{idx_obra:work,descricao});
        const nome_etapa=i===5?'Acabamento':stage;
        await ensure('etapa','id_etapa','/etapas',{nome_etapa,descricao:'[TESTE] Planejamento demonstrativo; não representa execução real.',id_obra:work},{id_obra:work,nome_etapa});
        const origem_custo=['Equipe','Insumo','Maquinário'][i%3];
        await ensure('custo_planejado','id_custo_planejado','/custos-planejados',{id_obra:work,etapa:nome_etapa,origem_custo,valor_planejado:Math.round(definition.orcamento_planejado*weights[i]),data_inicio_prevista:new Date(start+Math.floor(duration*i/6)).toISOString().slice(0,10),data_fim_prevista:new Date(start+Math.floor(duration*(i+1)/6)).toISOString().slice(0,10)},{id_obra:work,etapa:nome_etapa,origem_custo});
      }
      const read=await fetch(api+`/obras/${work}`,{headers});assert.equal(read.status,200);
    }
    // Confere duas leituras do catálogo, sem uma segunda carga de escrita.
    for(let pass=0;pass<2;pass++){const response=await fetch(api+'/operacional/gestao/recursos',{headers});assert.equal(response.status,200);const catalog=await response.json();for(const [key,table] of [['equipes','cadastro_de_equipes'],['insumos','cadastro_de_insumos'],['maquinarios','cadastro_de_maquinario']])for(const item of records.filter(r=>r.table===table))assert.ok(catalog[key].some(r=>Number(r.id_cadastro_equipes||r.id_insumos||r.id_maquina)===item.id));}
    for(const [table,oldRows] of Object.entries(before)){
      const current=(await c.query('SELECT * FROM ??',[table]))[0],pk=keys[table];assert.ok(pk.length,'Tabela sem PK: '+table);
      const byId=new Map(current.map(row=>[JSON.stringify(pk.map(k=>row[k])),JSON.stringify(row)]));
      for(const row of oldRows)assert.equal(byId.get(JSON.stringify(pk.map(k=>row[k]))),JSON.stringify(row),'Registro existente alterado em '+table);
    }
    const report={at:new Date().toISOString(),database:'valen',company:{id:companyId,name:'Construtora Testes Locais Vértice'},syntheticLocalDemo:true,created,reused,records,existingRecordsPreserved:true,backup:path.basename(backup),migrationsApplied:false,apiReadChecks:true,notes:['Custos e quantidades demonstrativos; não são preços ou produção reais.','Unidade no nome do insumo pois o esquema não possui coluna unidade.','Mensal de equipe usa 22 dias apenas para cenário demonstrativo.','Sem apropriações: FK e migrações operacionais aguardam aprovação.','Sem lançamentos financeiros realizados nem execução fictícia de diário.']};
    fs.writeFileSync(path.join(__dirname,'carga-demo-local.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({company:report.company,created,reused,existingRecordsPreserved:true,apiReadChecks:true,migrationsApplied:false}));
  }finally{if(server){server.closeAllConnections();await new Promise(r=>server.close(r));}await c.end();if(pool)await pool.end();if(legacy)await new Promise(r=>legacy.end(r));}
}
const original=console.log;console.log=(...args)=>{if(typeof args[0]==='string'&&(args[0].includes('"event":"http"')||args[0].startsWith('✅')))return;original(...args);};
main().catch(e=>{console.error(e.message);process.exitCode=1;});
