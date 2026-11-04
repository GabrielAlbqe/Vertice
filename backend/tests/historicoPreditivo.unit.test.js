const {test}=require('@jest/globals');
const assert=require('node:assert/strict');
const {analisar,simular}=require('../services/historicoPreditivo');
const obra={id_obra:1,nome:'Obra real',orcamento_planejado:'1000'};
const calc=(data={})=>analisar({obra,...data},{fonte:'diario'});
test('Histórico vazio não inventa EVA, RUP nem tendência',()=>{
 const r=calc();assert.equal(r.ultimo,null);assert.deepEqual(r.eva,[]);assert.equal(r.tendencia.recente,null);assert.equal(r.resumo.dias_observados,0);assert.equal(r.resumo.custo_ate_fim,0);
});
test('Custos são ordenados e acumulados por data',()=>{
 const r=calc({custos:[{data:'2026-01-02',valor:'30.10'},{data:'2026-01-01',valor:'20.20'}]});
 assert.deepEqual(r.financeiro.map(c=>c.acumulado),[20.2,50.3]);
});
test('Custos inválidos não viram zero e bloqueiam acumulados',()=>{
 const r=calc({custos:[{data:'2026-01-01',valor:null}]});assert.equal(r.resumo.custo_ate_fim,null);assert.equal(r.financeiro[0].acumulado,null);assert.ok(r.auditoria.length);
});
test('Registros EVA duplicados não elegem um indicador oficial',()=>{
 const r=calc({metricas:[{id_metrica:1,data_calculo:'2026-01-01',idc:1,idp:1,eac:100},{id_metrica:2,data_calculo:'2026-01-01',idc:2,idp:2,eac:200}]});assert.equal(r.ultimo,null);assert.equal(r.eva.length,2);assert.match(r.auditoria[0],/múltiplos/);
});
test('Tendência usa dias únicos documentados sem completar lacunas',()=>{
 const registros=[1,3,5,10,15,20].map((d,i)=>({data:'2026-01-'+String(d).padStart(2,'0'),id_registro:'d'+i}));
 registros.push({...registros[0],id_registro:'extra'});
 const ocorrencias=registros.slice(3,6).map(r=>({...r,tipo:'atraso'}));
 const r=calc({registros,ocorrencias});assert.equal(r.resumo.dias_observados,6);assert.equal(r.tendencia.anterior,0);assert.equal(r.tendencia.recente,100);assert.equal(r.tendencia.diferenca_pp,100);assert.equal(r.operacional[0].documentos,2);assert.equal(r.alertas.length,1);
});
test('Eventos de outro documento não entram no histórico',()=>{
 const r=calc({registros:[{data:'2026-01-01',id_registro:'a'}],ocorrencias:[{data:'2026-01-01',id_registro:'b'}]});assert.equal(r.resumo.ocorrencias,0);
});
test('Dados demo são identificados e não misturados com outras obras',()=>{
 assert.equal(calc({obra:{...obra,nome:'[DEMO] Exemplo'}}).obra.demonstracao,true);assert.equal(calc().obra.demonstracao,false);
});
test('Indicadores existentes são apresentados com ressalva de origem',()=>{
 const r=calc({metricas:[{id_metrica:1,data_calculo:'2026-01-01',idc:'.8',idp:'.9',eac:'1500'}]});assert.equal(r.ultimo.idc,.8);assert.equal(r.ultimo.rup,null);assert.equal(r.alertas.length,2);assert.match(r.ultimo.origem,/não rastreados/);
});
test('Simulação altera apenas estimativa restante sem mutar entradas',()=>{
 assert.equal(simular(100,200,10),320);assert.equal(simular(100,200,-100),100);assert.equal(simular(0,0,0),0);
});
test('Simulação rejeita valores ausentes, negativos ou fora dos limites',()=>{
 for(const a of [[null,1,0],[1,-1,0],[1,1,1001],[1,1,-101],['',1,0],[1,1,Infinity]])assert.throws(()=>simular(...a));
});
