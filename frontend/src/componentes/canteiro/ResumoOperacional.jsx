import { consultarOcorrencias } from '../../api/operacional';
import useConsultaObra from '../../canteiro/useConsultaObra';
import { progressoAtividades } from '../../canteiro/progresso';
export default function ResumoOperacional({ctx}) {
  const r=useConsultaObra(ctx.obra?.id_obra,consultarOcorrencias,ctx.revisao);
  const atividades=progressoAtividades(ctx.atividades,ctx.apontamentos);
  const indisponivel=ctx.avisos.some(a=>a.includes('apontamentos')||a.includes('atividades')||a.includes('diários'));
  return <section className="ct-card ct-stack"><h2>Acompanhamento operacional</h2>{r.carregando?<p role="status">Consultando pendências…</p>:r.erro?<p role="alert">{r.erro}</p>:<p>Ocorrências abertas: {r.dados.filter(o=>o.status==='Aberta').length}</p>}{indisponivel?<p>Avanço das atividades indisponível nesta consulta.</p>:<><p>Atividades em andamento: {atividades.filter(a=>a.estado==='Em andamento').length}</p><p>Atividades concluídas: {atividades.filter(a=>a.estado==='Concluída').length}</p><p>Atividades sem apontamentos: {atividades.filter(a=>a.estado==='Sem apontamento').length}</p>{[...ctx.apontamentos].sort((a,b)=>String(b.data).localeCompare(String(a.data)) || b.id_apontamento-a.id_apontamento).slice(0,3).map(a=><p key={a.id_apontamento}>{ctx.atividades.find(t=>t.id_atividade===a.atividade_eap_id)?.descricao || `Atividade #${a.atividade_eap_id}`}: {a.percentual_dia}% no dia</p>)}</>}<button className="ct-link" type="button" onClick={()=>ctx.onNavegar('canteiro-atividade')}>Consultar avanço por atividade</button></section>;
}
