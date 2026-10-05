import Skeleton from "../shared/Skeleton";
import { useCanteiro } from "../../layouts/CanteiroLayout";
export default function EstadoObra({ children, skeleton = false }) {
  const { obra, carregando } = useCanteiro();
  if (carregando && skeleton) return <Skeleton label="Carregando informações da obra…" />;
  if (carregando) return <p className="ct-card" role="status">Carregando informações da obra…</p>;
  return obra ? children : <section className="ct-card ct-empty"><h2>Selecione sua obra</h2><p>Escolha uma obra acima para consultar os registros e começar o diário.</p></section>;
}
