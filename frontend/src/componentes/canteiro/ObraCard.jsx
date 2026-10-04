import StatusBadge from "./StatusBadge";
import { formatarData } from "../../canteiro/dados";
import ProgressBar from "./ProgressBar";
export default function ObraCard({ obra, diario, onAbrir, titulo = "OBRA SELECIONADA" }) {
  const valor = obra.percentual_concluido ?? obra.progresso ?? obra.percentual_executado;
  const progresso = valor !== null && valor !== undefined && valor !== "" && Number.isFinite(Number(valor)) ? Number(valor) : null;
  return <section className="ct-card ct-work"><span className="ct-eyebrow">{titulo}</span><h2>{obra.nome || obra.obra}</h2><StatusBadge status={obra.status} /><dl className="ct-facts"><div><dt>Categoria</dt><dd>{obra.categoria || "Não informada"}</dd></div><div><dt>Localização</dt><dd>{obra.endereco || obra.localizacao || "Não informada"}</dd></div><div><dt>Responsável</dt><dd>{obra.nome_responsavel || obra.responsavel || "Não informado"}</dd></div><div><dt>Etapa registrada</dt><dd>{diario?.etapa_atuacao || "Não informado"}</dd></div><div><dt>Início previsto</dt><dd>{formatarData(obra.data_inicio_planejada)}</dd></div><div><dt>Término previsto</dt><dd>{formatarData(obra.data_termino_planejada)}</dd></div><div><dt>Concluído</dt><dd>{progresso === null ? "Não informado" : `${progresso}%`}</dd></div></dl>{progresso !== null && <ProgressBar valor={progresso} />}<button className="ct-button ct-secondary" type="button" onClick={onAbrir}>Consultar obra</button></section>;
}
