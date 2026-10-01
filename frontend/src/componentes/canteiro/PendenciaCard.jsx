import StatusBadge from "./StatusBadge";
import { formatarData } from "../../canteiro/dados";
export default function PendenciaCard({ item }) {
  return <article className="ct-card"><div className="ct-row"><h3>{item.tipo}</h3><StatusBadge status="Ocorrência registrada" aviso /></div><p>{item.descricao}</p>{item.origem && <p className="ct-muted">Origem: {item.origem}</p>}<small>{formatarData(item.data)}</small></article>;
}
