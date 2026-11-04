// Somente leitura. EXPLAIN ANALYZE executa SELECT, nunca migra ou cria registros.
const fs=require('fs'),path=require('path');
require('dotenv').config({path:path.join(__dirname,'../.env'),quiet:true});
(async()=>{
  const c=await require('mysql2/promise').createConnection(require('../config/environment').databaseOptions());
  try{
    const [work]=await c.query('SELECT id_obra FROM obra ORDER BY id_obra LIMIT 1');
    const value=work[0]?.id_obra||1;
    const queries=[
      ['diario_obra','SELECT id_diario FROM diario_obra WHERE obrax_id=? ORDER BY data DESC LIMIT 50'],
      ['atividade_eap','SELECT id_atividade FROM atividade_eap WHERE idx_obra=?'],
      ['cadastro_de_insumos','SELECT id_insumos FROM cadastro_de_insumos WHERE idobra=?'],
      ['custo_realizado','SELECT SUM(valor_total) FROM custo_realizado WHERE id_obra=? AND data>=\'2026-01-01\' AND data<\'2027-01-01\'']
    ];
    const plans=[];
    for(const [table,sql] of queries){const start=performance.now();const [plan]=await c.query('EXPLAIN ANALYZE '+sql,[value]);plans.push({table,elapsedMs:performance.now()-start,plan:plan[0].EXPLAIN});}
    const report={database:process.env.DB_NAME,at:new Date().toISOString(),readOnly:true,representativeLoad:false,plans,conclusion:'Amostra local pequena. Não justifica criar índices sem medição com volume e filtros representativos em staging.'};
    fs.writeFileSync(path.join(__dirname,'query-analysis.json'),JSON.stringify(report,null,2));console.log(JSON.stringify({readOnly:true,queries:plans.length,elapsedMs:plans.map(p=>Number(p.elapsedMs.toFixed(3)))}));
  }finally{await c.end();}
})().catch(e=>{console.error(e.code||'Falha na análise de consultas');process.exitCode=1;});
