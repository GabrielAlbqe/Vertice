import { formatarData } from "../../canteiro/dados";
import StatusBadge from "./StatusBadge";
export default function RegistroCard({ diario, onAbrir }) {
  return <article className="ct-card"><div className="ct-row"><h3>Diário de {formatarData(diario.data)}</h3><StatusBadge status={diario.turno} /></div><p>{diario.etapa_atuacao || "Etapa não informada"} · {diario.clima || "Clima não informado"}</p><p className="ct-muted">Registrado por usuário #{diario.usuario_id}</p>{onAbrir && <button type="button" className="ct-link" onClick={onAbrir}>Ver registro completo</button>}</article>;
}
