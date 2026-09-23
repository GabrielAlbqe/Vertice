function Sidebar({ onNavegar }) {
  return (
    <aside className="sidebar">

      <div className="sidebar-title">
        <h2>VÉRTICE</h2>
      </div>

      <div className="sidebar-menu">

        <button
          onClick={() =>
            onNavegar("dashboard")
          }
        >
          Dashboard
        </button>

        <button
          onClick={() =>
            onNavegar("obras")
          }
        >
          Obras
        </button>

        <button
          onClick={() =>
            onNavegar("equipes")
          }
        >
          Equipes
        </button>

      </div>

    </aside>
  );
}

export default Sidebar;