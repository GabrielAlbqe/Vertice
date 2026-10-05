import { calcularPrazo } from "../../api/obraIndicadores";
import { hoje } from "../../canteiro/dados";

export default function PrazoObra({ obra }) {
  const prazo = calcularPrazo(obra, hoje());
  return <section className="obra-summary-section"><h3>Prazo planejado</h3>
    <p className="summary-caption">Evolução do calendário previsto para a obra.</p>
    <dl className="obra-summary-facts">{[["Duração planejada", prazo?.duracao], ["Dias decorridos no prazo", prazo?.decorridos], ["Dias restantes", prazo?.restantes]].map(([titulo, valor]) => <div key={titulo}><dt>{titulo}</dt><dd>{valor === undefined ? "Não informado" : `${valor} dias`}</dd></div>)}
      <div><dt>Prazo decorrido</dt><dd>{prazo ? `${prazo.percentual.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}%` : "Não informado"}</dd></div>
    </dl>{prazo && <progress className="prazo-progress" max="100" value={prazo.percentual} aria-label="Percentual do prazo planejado decorrido" />}
  </section>;
}
