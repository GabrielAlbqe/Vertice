function Sidebar({
  onNavegar,
}) {
  const paginaAtual =
    localStorage.getItem(
      "pagina_atual"
    ) || "dashboard";

  function estaAtiva(
    pagina
  ) {
    if (
      pagina === "obras"
    ) {
      return (
        paginaAtual ===
          "obras" ||
        paginaAtual ===
          "obra-detalhes"
      );
    }

    return (
      paginaAtual ===
      pagina
    );
  }

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

  return (
    <aside className="sidebar">

      <nav className="sidebar-menu">

        <button
          type="button"
          className={
            estaAtiva(
              "dashboard"
            )
              ? "sidebar-item ativo"
              : "sidebar-item"
          }
          onClick={() =>
            navegar(
              "dashboard"
            )
          }
        >
          Dashboard
        </button>

        <button
          type="button"
          className={
            estaAtiva(
              "obras"
            )
              ? "sidebar-item ativo"
              : "sidebar-item"
          }
          onClick={() =>
            navegar(
              "obras"
            )
          }
        >
          Obras
        </button>

        <button
          type="button"
          className={
            estaAtiva(
              "equipes"
            )
              ? "sidebar-item ativo"
              : "sidebar-item"
          }
          onClick={() =>
            navegar(
              "equipes"
            )
          }
        >
          Equipes
        </button>

      </nav>

    </aside>
  );
}

export default Sidebar;