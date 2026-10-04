import { useCanteiro } from "../../layouts/CanteiroLayout";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import Icone from "../../componentes/canteiro/Icone";
export default function Registrar() {
  const { onNavegar } = useCanteiro();
  return <><div className="ct-title"><span className="ct-eyebrow">REGISTRO DE CAMPO</span><h1>O que deseja registrar?</h1><p>Escolha uma opção para a obra selecionada.</p></div><EstadoObra><div className="ct-actions">{[["atividade", "Atividade"], ["material", "Material"], ["foto", "Foto"], ["ocorrencia", "Ocorrência"]].map(([tipo, titulo]) => <button type="button" className="ct-action" key={tipo} onClick={() => onNavegar('canteiro-' + tipo)}><Icone nome={tipo === "ocorrencia" ? "pendencias" : tipo} /><span>{titulo}</span><Icone nome="seta" /></button>)}</div><button type="button" className="ct-button ct-secondary" onClick={() => onNavegar("canteiro-diario")} style={{ marginTop: 20 }}>Abrir Diário de Obra</button></EstadoObra></>;
}
