import Icone from "./Icone";
const itens = [["canteiro-home", "Início", "inicio"], ["canteiro-registrar", "Registrar", "diario"], ["canteiro-pendencias", "Pendências", "pendencias"], ["canteiro-historico", "Histórico", "historico"], ["canteiro-perfil", "Perfil", "perfil"]];
export default function BottomNav({ pagina, onNavegar }) {
  const ativa = ["canteiro-atividade", "canteiro-material", "canteiro-ocorrencia", "canteiro-foto", "canteiro-diario"].includes(pagina) ? "canteiro-registrar" : pagina === "canteiro-obra" ? "canteiro-home" : pagina;
  return <nav className="ct-nav" aria-label="Navegação do Canteiro">{itens.map(([destino, nome, icone]) => <button type="button" key={destino} aria-current={ativa === destino ? "page" : undefined} onClick={() => onNavegar(destino)}><Icone nome={icone} /><span>{nome}</span></button>)}</nav>;
}
