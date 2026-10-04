import RegistrosOperacionais from "../../componentes/canteiro/RegistrosOperacionais";
import { useCanteiro } from "../../layouts/CanteiroLayout";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import ObraCard from "../../componentes/canteiro/ObraCard";
import RegistroCard from "../../componentes/canteiro/RegistroCard";
export default function DetalheObra() {
  const { obra, recursos, diarios, onNavegar } = useCanteiro();
  return <><div className="ct-title"><span className="ct-eyebrow">INFORMAÇÕES DE CAMPO</span><h1>Minha obra</h1><p>Equipes e recursos vinculados, disponíveis para consulta.</p></div><EstadoObra>{obra && <div className="ct-stack"><ObraCard obra={obra} diario={diarios[0]} onAbrir={() => onNavegar("canteiro-diario")} />{[["equipes", "Equipes vinculadas"], ["insumos", "Insumos"], ["maquinarios", "Maquinários"]].map(([tipo, titulo]) => <section className="ct-card" key={tipo}><h2>{titulo}</h2><ul className="ct-resource-list">{recursos[tipo].map((r, i) => <li key={i}><strong>{r.nome_equipe || r.nome || `Recurso #${r.id_equipe || r.id_insumos || r.id_maquina || i + 1}`}</strong><span>{tipo === "equipes" ? `${r.quantidade_profissionais ?? "—"} profissionais · ${r.etapa_atuacao || "Etapa não informada"}` : tipo === "insumos" ? `Disponível: ${r.quantidade_disponivel ?? "Não informado"}` : `${r.status || "Status não informado"} · Quantidade: ${r.quantidade ?? "—"}`}</span></li>)}</ul>{!recursos[tipo].length && <p className="ct-muted">Nenhum recurso disponível nesta consulta.</p>}</section>)}<RegistrosOperacionais /><section className="ct-stack"><h2>Último diário</h2>{diarios[0] ? <RegistroCard diario={diarios[0]} onAbrir={() => onNavegar("canteiro-registros")} /> : <p>Nenhum diário disponível.</p>}</section></div>}</EstadoObra></>;
}
