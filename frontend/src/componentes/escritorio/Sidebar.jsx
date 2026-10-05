import iconeVertice from "../../assets/icone-vertice.png";

function Sidebar({
  onNavegar,
}) {
  const paginaSalva =
    localStorage.getItem(
      "pagina_atual"
    ) || "dashboard";

  // Quando está dentro de uma obra,
  // mantemos "Obras" aceso no menu.
  const paginaInicial =
    paginaSalva ===
    "obra-detalhes"
      ? "obras"
      : paginaSalva;

  const paginaAtiva = paginaInicial;

  function navegar(
    pagina
  ) {
if (
      typeof onNavegar ===
      "function"
    ) {
      onNavegar(
        pagina
      );
    }
  }

  function classeBotao(
    pagina
  ) {
    return paginaAtiva ===
      pagina
      ? "sidebar-item ativo"
      : "sidebar-item";
  }

  return (
    <aside className="sidebar">

      <div className="sidebar-brand">
        <img
          src={iconeVertice}
          alt=""
          className="sidebar-brand-icon"
        />

        <div className="sidebar-brand-text">
          <strong>
            VÉRTICE
          </strong>

          <span>
            Engenharia & Obras
          </span>
        </div>
      </div>

      <nav className="sidebar-menu" aria-label="Escrit?rio">

        <button
          type="button"
          aria-current={paginaAtiva === "dashboard" ? "page" : undefined} className={classeBotao("dashboard")}
          onClick={() =>
            navegar(
              "dashboard"
            )
          }
        >
          <span className="sidebar-dot" />
          Dashboard
        </button>

        <button
          type="button"
          aria-current={paginaAtiva === "obras" ? "page" : undefined} className={classeBotao("obras")}
          onClick={() =>
            navegar(
              "obras"
            )
          }
        >
          <span className="sidebar-dot" />
          Obras
        </button>

        <button
          type="button"
          aria-current={paginaAtiva === "equipes" ? "page" : undefined} className={classeBotao("equipes")}
          onClick={() =>
            navegar(
              "equipes"
            )
          }
        >
          <span className="sidebar-dot" />
          Equipes
        </button>

        <button type="button" aria-current={paginaAtiva === "analytics-financeiro" ? "page" : undefined} className={classeBotao("analytics-financeiro")} onClick={() => navegar("analytics-financeiro")}>
          <span className="sidebar-dot" />
          Analytics Financeiro
        </button>
        <button type="button" aria-current={paginaAtiva === "recursos" ? "page" : undefined} className={classeBotao("recursos")} onClick={() => navegar("recursos")}><span className="sidebar-dot" />Recursos</button>
        <button type="button" className={classeBotao("perfil")} aria-current={paginaAtiva === "perfil" ? "page" : undefined} onClick={() => navegar("perfil")}><span className="sidebar-dot" />Perfil</button>

      </nav>

      <div className="sidebar-footer">
        <span>
          SISTEMA VÉRTICE
        </span>

        <small>
          Gestão inteligente de obras
        </small>
      </div>

    </aside>
  );
}

export default Sidebar;
