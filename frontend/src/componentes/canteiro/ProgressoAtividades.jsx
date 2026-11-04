import { progressoAtividades } from '../../canteiro/progresso';
export default function ProgressoAtividades({atividades,apontamentos,indisponivel=false}) {
  if(indisponivel)return <p role="alert">Avanço indisponível: falha ao carregar apontamentos.</p>;
  const lista=progressoAtividades(atividades,apontamentos);
  return <section className="ct-card ct-stack"><h2>Atividades e avanço físico</h2>{!lista.length && <p>Nenhuma atividade cadastrada.</p>}{lista.map(a=><article className="ct-activity-record" key={a.id_atividade}><strong>{a.descricao}</strong><p>{a.estado}{a.total!==null?` · ${a.total}% acumulado`:''}</p>{a.total!==null && <progress className="ct-progress" max="100" value={a.total} aria-label={`Avanço de ${a.descricao}`} />}<small>{a.registros.length} apontamento(s) registrado(s)</small></article>)}<p className="ct-muted">Sem pesos e metas físicas por etapa, não há percentual global nem comparação física planejado × realizado.</p></section>;
}
