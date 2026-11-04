export function progressoAtividades(atividades,apontamentos) {
  return atividades.map(a=>{
    const registros=apontamentos.filter(p=>String(p.atividade_eap_id)===String(a.id_atividade));
    const valores=registros.map(p=>p.percentual_dia === null || p.percentual_dia === '' ? NaN : Number(p.percentual_dia));
    const total=valores.reduce((x,y)=>x+y,0);
    const valido=valores.every(n=>Number.isFinite(n)&&n>0&&n<=100)&&total<=100.00001;
    return {...a,total:registros.length&&valido?Math.round(total*100)/100:null,estado:!registros.length?'Sem apontamento':!valido?'Revisar apontamentos':total>=100?'Concluída':'Em andamento',registros};
  });
}
