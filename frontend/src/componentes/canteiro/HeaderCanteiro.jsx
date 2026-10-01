import icone from "../../assets/icone-vertice.png";
export default function HeaderCanteiro({ usuario, onNavegar }) {
  return <header className="ct-header"><div className="ct-brand"><img src={icone} alt="" /><div><strong>VÉRTICE</strong><span>Canteiro de Obras</span></div></div><button className="ct-avatar" type="button" onClick={() => onNavegar("canteiro-perfil")} aria-label="Abrir meu perfil">{usuario.nome?.charAt(0).toUpperCase() || "U"}</button></header>;
}
