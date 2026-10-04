import { formatarData } from "../../canteiro/dados";
import { useCanteiro } from "../../layouts/CanteiroLayout";
export default function RegistrosOperacionais() {
  const { atividades, apontamentos, apropriacoes, rdos, recursos, carregando } = useCanteiro();
  if (carregando) return <p role="status">Carregando registros operacionais…</p>;
  return <>
    <section className="ct-card ct-stack"><h2>Atividades executadas e fotos</h2>{apontamentos.map(a => {
      let foto; try { const url = new URL(a.url_foto); if (["http:", "https:"].includes(url.protocol)) foto = url.href; } catch { /* Sem foto publicada. */ }
      return <article key={a.id_apontamento}><h3>{atividades.find(t => String(t.id_atividade) === String(a.atividade_eap_id))?.descricao || `Atividade #${a.atividade_eap_id}`}</h3><p>{formatarData(a.data)} · Executado no dia: {a.percentual_dia}%</p>{foto && <a className="ct-link" href={foto} target="_blank" rel="noopener noreferrer">Abrir foto publicada</a>}</article>;
    })}{!apontamentos.length && <p className="ct-muted">Nenhum apontamento disponível.</p>}</section>
    <section className="ct-card ct-stack"><h2>Materiais utilizados</h2>{apropriacoes.map(a => <article key={a.id_apropriacao}><h3>{recursos.insumos.find(i => String(i.id_insumos ?? i.id_insumo) === String(a.id_insumo))?.nome || `Insumo #${a.id_insumo}`}</h3><p>Quantidade consumida: {a.quantidade_consumida} · {a.tipo_compra}</p><p>{atividades.find(t => String(t.id_atividade) === String(a.id_atividade))?.descricao || `Atividade #${a.id_atividade}`}</p></article>)}{!apropriacoes.length && <p className="ct-muted">Nenhum consumo disponível.</p>}</section>
    <section className="ct-card ct-stack"><h2>RDOs</h2>{rdos.map(r => <article key={r.id_rdo}><h3>{formatarData(r.data_rdo)}</h3><p>{r.turno || "Turno não informado"} · {r.clima || "Clima não informado"}</p></article>)}{!rdos.length && <p className="ct-muted">Nenhum RDO disponível.</p>}</section>
  </>;
}
