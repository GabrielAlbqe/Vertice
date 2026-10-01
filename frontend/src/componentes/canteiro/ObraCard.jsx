import StatusBadge from "./StatusBadge";
import { formatarData } from "../../canteiro/dados";
export default function ObraCard({ obra, diario, onAbrir }) {
  return <section className="ct-card ct-work"><span className="ct-eyebrow">OBRA ATIVA</span><h2>{obra.nome || obra.obra}</h2><StatusBadge status={obra.status} /><dl className="ct-facts"><div><dt>Etapa registrada</dt><dd>{diario?.etapa_atuacao || "Sem diário disponível"}</dd></div><div><dt>Início previsto</dt><dd>{formatarData(obra.data_inicio_planejada)}</dd></div><div><dt>Término previsto</dt><dd>{formatarData(obra.data_termino_planejada)}</dd></div></dl><button className="ct-button ct-secondary" type="button" onClick={onAbrir}>Consultar obra</button></section>;
}
