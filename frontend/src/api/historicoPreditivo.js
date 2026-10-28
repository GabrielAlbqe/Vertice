export function resultadoCenario(custo,restante,variacao){
 if([custo,restante,variacao].some(v=>v===null||v===undefined||v===''||!Number.isFinite(Number(v)))||Number(custo)<0||Number(restante)<0||Number(variacao)<-100||Number(variacao)>1000)return null;
 return Math.round((Number(custo)+Number(restante)*(1+Number(variacao)/100))*100)/100;
}
