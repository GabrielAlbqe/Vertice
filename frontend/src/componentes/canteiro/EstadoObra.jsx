import { useCanteiro } from "../../layouts/CanteiroLayout";
export default function EstadoObra({ children }) {
  const { obra } = useCanteiro();
  return obra ? children : <section className="ct-card ct-empty"><h2>Selecione sua obra</h2><p>Escolha uma obra acima para consultar os registros e começar o diário.</p></section>;
}
