import iconeVertice from "../assets/icone-vertice.png";

function Header({
  usuario,
  onNavegar,
  onSair,
}) {
  function abrirPerfil() {
    if (
      typeof onNavegar ===
      "function"
    ) {
      onNavegar("perfil");
    }
  }

  return (
    <header className="header">

      <div className="header-logo">
        <img
          src={iconeVertice}
          alt=""
          className="header-brand-icon"
        />

        <div className="header-brand-copy">
          <strong>VÉRTICE</strong>
          <span>
            Gestão inteligente de obras
          </span>
        </div>
      </div>

      <div className="header-actions">

        <button
          type="button"
          className="header-user"
          onClick={abrirPerfil}
          title="Abrir perfil"
        >
          <div className="header-user-avatar">
            {usuario?.nome
              ?.charAt(0)
              .toUpperCase() || "U"}
          </div>

          <div className="header-user-info">
            <strong>
              {usuario?.nome || "Usuário"}
            </strong>

            <span>
              {usuario?.ocupacao || "Usuário do sistema"}
            </span>
          </div>
        </button>

        <button
          type="button"
          className="header-logout"
          onClick={onSair}
        >
          Sair
        </button>

      </div>

    </header>
  );
}

export default Header;
