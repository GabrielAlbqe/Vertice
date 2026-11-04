function cents(value) {
  if(value===null||value===undefined||typeof value==='boolean'||String(value).trim()==='')throw new TypeError('Valor financeiro inválido.');
  const n=Number(value);
  if(!Number.isFinite(n)||Math.abs(n)>=1e10||Math.abs(n*100-Math.round(n*100))>0.00001)throw new TypeError('Valor financeiro inválido.');
  return Math.round(n*100);
}
function projetar(realizado,restante,planejado) {
  const actual=cents(realizado),remaining=cents(restante);
  if(actual<0||remaining<0)throw new TypeError('Custos devem ser positivos ou zero.');
  const final=actual+remaining;
  if(final>=1e12)throw new TypeError('Projeção excede o limite do banco.');
  const budget=planejado===null?null:cents(planejado);
  if(budget!==null&&budget<0)throw new TypeError('Orçamento inválido.');
  const deviation=budget===null?null:final-budget;
  const pct=budget>0?Math.round(deviation/budget*10000)/100:null;
  return {custo_realizado:actual/100,custo_restante_estimado:remaining/100,custo_final_projetado:final/100,
    desvio_projetado:deviation===null?null:deviation/100,
    desvio_projetado_percentual:pct!==null&&Math.abs(pct)<=999.99?pct:null};
}
module.exports={cents,projetar};
