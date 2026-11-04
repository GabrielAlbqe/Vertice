import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizarAnalytics,calcularAnalytics,FILTROS_VAZIOS} from '../src/api/analyticsCalculos.js';
import {resumirEquipes,resumirAtrasos} from '../src/api/obraIndicadores.js';
const base=()=>({obra:{orcamento_planejado:1000,data_inicio_planejada:'2026-10-01',data_termino_planejada:'2026-10-31'},realizados:[],planejados:[],usos:[],usosCompletos:true,etapas:[],ocorrencias:[],avisos:[]});
test('obras atrasadas excluem concluídas e não inventam prazos ou situação',()=>{
 const work={status:'Em Andamento',data_inicio_planejada:'2026-10-01',data_termino_planejada:'2026-10-30'};
 assert.deepEqual(resumirAtrasos([work,{...work,status:'Concluída'},{...work,data_termino_planejada:'2026-10-31'},{...work,data_termino_planejada:'2026-02-30'},{...work,status:null}],'2026-10-31'),{atrasadas:1,semPrazoValido:2});
 assert.deepEqual(resumirAtrasos([],'2026-10-31'),{atrasadas:0,semPrazoValido:0});
 assert.deepEqual(resumirAtrasos([work],'invalid'),{atrasadas:0,semPrazoValido:1});
});
test('recursos próprios e terceiros não duplicam cadastro e preservam composição desconhecida',()=>{
  const own={id_cadastro_equipes:1,quantidade_profissionais:3,custo_diario:10,custo_mensal:100};
  const r=resumirEquipes([own,own,{id_equipe_terceirizada:1,origem:'terceirizada',custo_diario_total:20}]);
  assert.equal(r.total,2);assert.equal(r.profissionaisProprios,3);assert.equal(r.profissionaisTerceirizados,null);assert.equal(r.profissionais,null);assert.equal(r.custoDiario,30);assert.equal(r.custoMensal,null);
});
test('livro vazio não converte usos ou estoque em despesa confirmada',()=>{
  const d=base();d.usos=[{origem:'insumo',custo_total:900,data:'2026-10-01'}];const r=calcularAnalytics(normalizarAnalytics(d));assert.equal(r.realizado,0);assert.equal(r.quantidade,0);assert.equal(r.projetado,null);assert.equal(r.usaOrcamento,true);assert.deepEqual(r.pontos,[]);
});
test('um lançamento tem um ponto real e motivo explícito para não projetar',()=>{
  const d=base();d.realizados=[{id_custo_realizado:1,origem_custo:'Equipe',data:'2026-10-01',valor_total:100}];const r=calcularAnalytics(normalizarAnalytics(d),FILTROS_VAZIOS,'2026-10-10');assert.equal(r.realizado,100);assert.equal(r.projetado,null);assert.equal(r.pontos.length,1);assert.equal(r.pontos[0].data,'2026-10-01');assert.match(r.motivoProjecao,/duas datas/);
});
test('projeção usa dias de calendário e deduplica IDs; filtros preservam bases de comparação',()=>{
  const d=base(),first={id_custo_realizado:1,origem_custo:'Equipe',data:'2026-10-01',valor_total:100};d.realizados=[first,first,{id_custo_realizado:2,origem_custo:'Insumo',data:'2026-10-05',valor_total:100}];const r=calcularAnalytics(normalizarAnalytics(d),FILTROS_VAZIOS,'2026-10-10');assert.equal(r.quantidade,2);assert.equal(r.realizado,200);assert.equal(r.media,20);assert.equal(r.projetado,620);assert.equal(r.origens.find(o=>o.id==='equipe').percentual,50);
  const filtered=calcularAnalytics(normalizarAnalytics(d),{...FILTROS_VAZIOS,inicio:'2026-10-05',fim:'2026-10-10'},'2026-10-10');assert.equal(filtered.realizado,100);assert.equal(filtered.projetado,null);assert.equal(filtered.desvioProjetado,null);
});
test('consulta indisponível não vira ausência ou custo zero',()=>{
  const d=base();d.realizados=null;const r=calcularAnalytics(normalizarAnalytics(d));assert.equal(r.realizado,null);assert.match(r.motivoProjecao,/consulta/);
});
import {compararPeriodos} from '../src/api/cronograma.js';
test('cronograma compara períodos explícitos sem inventar término ou execução',()=>{
 const base={inicio_previsto:'2026-10-01',fim_previsto:'2026-10-02'};
 assert.deepEqual(compararPeriodos(base),{planejado:{left:0,width:100},real:null});
 assert.equal(compararPeriodos({...base,inicio_real:'2026-10-02'}).real,null);
 const both=compararPeriodos({...base,inicio_real:'2026-10-02',fim_real:'2026-10-03'});
 assert.ok(Math.abs(both.planejado.width-200/3)<0.0001);assert.ok(Math.abs(both.real.left-100/3)<0.0001);
 assert.equal(compararPeriodos({...base,inicio_previsto:'2026-02-30'}),null);
 assert.equal(compararPeriodos({...base,fim_previsto:'2026-09-30'}),null);
});


test('financeiro: período invertido não produz orçamento, realizado ou tendência',()=>{
 const d=base();d.realizados=[{id_custo_realizado:1,origem_custo:'Equipe',data:'2026-10-01',valor_total:100}];
 const r=calcularAnalytics(normalizarAnalytics(d),{...FILTROS_VAZIOS,inicio:'2026-10-10',fim:'2026-10-01'},'2026-10-20');
 assert.equal(r.realizado,null);assert.equal(r.planejado,null);assert.equal(r.projetado,null);assert.deepEqual(r.pontos,[]);assert.ok(r.avisos.some(a=>a.includes('Período inválido')));
});
test('financeiro: curva do período não extrapola a data final filtrada',()=>{
 const d=base();d.realizados=[{id_custo_realizado:1,origem_custo:'Equipe',data:'2026-10-01',valor_total:100},{id_custo_realizado:2,origem_custo:'Equipe',data:'2026-10-05',valor_total:150}];
 const r=calcularAnalytics(normalizarAnalytics(d),{...FILTROS_VAZIOS,inicio:'2026-10-01',fim:'2026-10-10'},'2026-10-20');
 assert.equal(r.realizado,250);assert.ok(r.pontos.length>0);assert.ok(r.pontos.every(p=>p.data<='2026-10-10'));
});
