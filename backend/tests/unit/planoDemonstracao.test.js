const {test}=require('node:test');
const assert=require('node:assert/strict');
const {planoDemonstracao,ocorrenciaDemonstracao}=require('../../scripts/lib/planoDemonstracao');
test('Demonstração tem três obras identificadas e escopo fixo da empresa autorizada',()=>{
 const p=planoDemonstracao();assert.equal(p.construtora,1);assert.equal(p.obras.length,3);assert.equal(new Set(p.obras.map(o=>o.nome)).size,3);assert.ok(p.obras.every(o=>o.nome.startsWith('[DEMO]')));
});
test('Registros demonstrativos usam 24 dias úteis anteriores à referência',()=>{
 const p=planoDemonstracao();assert.equal(p.dias.length,24);assert.equal(new Set(p.dias).size,24);assert.ok(p.dias.every(d=>d<p.referencia));assert.deepEqual([...p.dias].sort(),p.dias);assert.ok(p.dias.every(d=>![0,6].includes(new Date(d+'T00:00:00Z').getUTCDay())));
});
test('Etapas e orçamento distribuem 100% sem inventar saldo adicional',()=>{
 const p=planoDemonstracao();assert.equal(p.etapas.length,6);assert.equal(p.pesos.reduce((s,n)=>s+n,0),100);for(const o of p.obras)assert.equal(p.pesos.reduce((s,n)=>s+o.orcamento*n/100,0),o.orcamento);
});
test('Cenários têm atraso, paralisação, dias sem ocorrência e origens variadas',()=>{
 for(let wi=0;wi<3;wi++){const rows=Array.from({length:24},(_,i)=>ocorrenciaDemonstracao(i,wi));assert.ok(rows.some(r=>r.atraso));assert.ok(rows.some(r=>r.paralisacao));assert.ok(rows.some(r=>!r.atraso&&!r.paralisacao));assert.ok(new Set(rows.filter(r=>r.atraso).map(r=>r.origemAtraso)).size>1);assert.ok(rows.every(r=>r.duracaoAtraso>0&&r.duracaoParalisacao>0));}
});
test('Referência inválida impede preparar a carga',()=>assert.throws(()=>planoDemonstracao('2026-02-30')));
