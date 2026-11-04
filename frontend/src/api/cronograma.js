const millis=value=>{const s=String(value||'').slice(0,10);if(!/^\d{4}-\d{2}-\d{2}$/.test(s))return null;const n=Date.parse(s);return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n:null;};
export function compararPeriodos(etapa){
 const start=millis(etapa.inicio_previsto),end=millis(etapa.fim_previsto),realStart=millis(etapa.inicio_real),realEnd=millis(etapa.fim_real);
 if(start===null||end===null||end<start)return null;
 const validReal=realStart!==null&&realEnd!==null&&realEnd>=realStart;
 const first=Math.min(start,...(validReal?[realStart]:[])),last=Math.max(end,...(validReal?[realEnd]:[]))+86400000,span=last-first;
 const bar=(a,b)=>({left:100*(a-first)/span,width:100*(b-a+86400000)/span});
 return {planejado:bar(start,end),real:validReal?bar(realStart,realEnd):null};
}
