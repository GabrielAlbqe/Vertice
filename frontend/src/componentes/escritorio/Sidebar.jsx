import { preloadNavigation } from '../../navigation/pages';
import iconeVertice from "../../assets/icone-vertice.png";
import "./sidebar.css";

const grupos = [
  { titulo: "Visão geral", itens: [
    { pagina: "dashboard", nome: "Dashboard" },
    { pagina: "obras", nome: "Planejamento de Obras" },
  ] },
  { titulo: "Gestão de Recursos", itens: [
    { pagina: "equipes", nome: "Equipes" },
    { pagina: "recursos", nome: "Insumos e Maquinários" },
  ] },
  { titulo: "Análises", itens: [
    { pagina: "analytics-financeiro", nome: "Analytics Financeiro" },
    { pagina: "inteligencia-operacional", nome: "Inteligência Operacional" },
    { pagina: "historico-preditivo", nome: "Histórico Preditivo" },
  ] },
  { titulo: "Conta", itens: [{ pagina: "perfil", nome: "Perfil" }] },
];

function Sidebar({ onNavegar }) {
  const paginaSalva = localStorage.getItem("pagina_atual") || "dashboard";
  const paginaAtiva = paginaSalva === "obra-detalhes" ? "obras" : paginaSalva;

  return (
    <aside className="sidebar sidebar-tools">
      <div className="sidebar-brand">
        <img src={iconeVertice} alt="" className="sidebar-brand-icon" />
        <div className="sidebar-brand-text"><strong>VÉRTICE</strong><span>Engenharia & Obras</span></div>
      </div>
      <nav onPointerOver={preloadNavigation} onFocus={preloadNavigation} onTouchStart={preloadNavigation} className="sidebar-menu" aria-label="Ferramentas do Escritório">
        {grupos.map((grupo, index) => (
          <section className="sidebar-tool-group" key={grupo.titulo} aria-labelledby={"sidebar-group-" + index}>
            <h2 id={"sidebar-group-" + index}>{grupo.titulo}</h2>
            {grupo.itens.map(item => (
              <button key={item.pagina} type="button" data-page={item.pagina}
                className={"sidebar-item" + (paginaAtiva === item.pagina ? " ativo" : "")}
                aria-current={!item.indisponivel && paginaAtiva === item.pagina ? "page" : undefined}
                disabled={item.indisponivel}
                title={item.indisponivel ? "Ferramenta ainda não implementada" : undefined}
                onClick={() => { if (!item.indisponivel && typeof onNavegar === "function") onNavegar(item.pagina); }}>
                <span className="sidebar-dot" aria-hidden="true" />
                <span className="sidebar-tool-name">{item.nome}{item.indisponivel && <small>Indisponível</small>}</span>
              </button>
            ))}
          </section>
        ))}
      </nav>
      <div className="sidebar-footer"><span>SISTEMA VÉRTICE</span><small>Gestão inteligente de obras</small></div>
    </aside>
  );
}

export default Sidebar;
