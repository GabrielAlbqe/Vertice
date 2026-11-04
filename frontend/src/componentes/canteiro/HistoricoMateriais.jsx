import { consultarMateriais } from '../../api/operacional';
import useConsultaObra from '../../canteiro/useConsultaObra';
export default function HistoricoMateriais({obra,revisao=0}) {
  const r=useConsultaObra(obra,consultarMateriais,revisao);
  return <section className="ct-card ct-stack"><div className="ct-row"><h2>Materiais utilizados</h2><button type="button" className="ct-link" onClick={r.atualizar}>Atualizar consumos</button></div>{r.carregando && <p role="status">Carregando consumos…</p>}{r.erro && <p role="alert" className="ct-error">{r.erro}</p>}{!r.erro && !r.carregando && !r.dados.length && <p>Nenhum consumo registrado.</p>}{r.dados.map(m=><article className="ct-activity-record" key={m.id_apropriacao}><strong>{m.nome}: {m.quantidade_consumida}</strong><p>Atividade: {m.atividade} · responsável: {m.responsavel}</p><p>{m.registrado_em?`Registrado em ${m.registrado_em}`:'Registro legado sem data de lançamento'}{m.diario_id?` · diário #${m.diario_id}`:''}</p></article>)}<p className="ct-muted">O cadastro atual não possui unidade de medida. Estes lançamentos não alteram estoque.</p></section>;
}
