import iconeVertice from "../assets/icone-vertice.png";

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
    localStorage.setItem(
      "pagina_atual",
      pagina
    );

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

      <div className="sidebar-menu">

        <button
          type="button"
          className={
            classeBotao(
              "dashboard"
            )
          }
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
          className={
            classeBotao(
              "obras"
            )
          }
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
          className={
            classeBotao(
              "equipes"
            )
          }
          onClick={() =>
            navegar(
              "equipes"
            )
          }
        >
          <span className="sidebar-dot" />
          Equipes
        </button>

        <button type="button" className={classeBotao("analytics-financeiro")} onClick={() => navegar("analytics-financeiro")}>
          <span className="sidebar-dot" />
          Analytics Financeiro
        </button>

      </div>

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
