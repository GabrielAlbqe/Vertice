import { useCanteiro } from "../../layouts/CanteiroLayout";
import { formatarData, temOcorrencia } from "../../canteiro/dados";
import { dataISO } from "../../api/analyticsCalculos";

export default function TimelineObra() {
  const { diarios, apontamentos, avisos, onNavegar } = useCanteiro();
  const registros = [
    ...diarios.map(d => ({ id: `diario:${d.id_diario}`, data: dataISO(d.data), titulo: "Diário registrado" })),
    ...diarios.filter(d => temOcorrencia(d.atrasos)).map(d => ({ id: `atraso:${d.id_diario}`, data: dataISO(d.data), titulo: "Atraso registrado no diário" })),
    ...diarios.filter(d => temOcorrencia(d.paralisacoes)).map(d => ({ id: `paralisacao:${d.id_diario}`, data: dataISO(d.data), titulo: "Paralisação registrada no diário" })),
    ...apontamentos.map(a => ({ id: `atividade:${a.id_apontamento}`, data: dataISO(a.data), titulo: "Atividade registrada" })),
  ];
  const eventos = [...new Map(registros.filter(e => e.data).map(e => [e.id, e])).values()]
    .sort((a, b) => b.data.localeCompare(a.data)).slice(0, 6);
  return <section className="ct-card"><div className="ct-row"><h2>Registros recentes</h2><button type="button" className="ct-link" onClick={() => onNavegar("canteiro-registros")}>Ver histórico</button></div>
    {avisos.some(a => a.includes("diários") || a.includes("apontamentos")) && <p className="ct-muted">Parte dos registros não está disponível nesta consulta.</p>}
    {eventos.length ? <ol className="ct-timeline">{eventos.map(e => <li key={e.id}><time dateTime={e.data}>{formatarData(e.data)}</time><span>{e.titulo}</span></li>)}</ol> : <p className="ct-muted">Nenhum evento com data disponível.</p>}
  </section>;
}
