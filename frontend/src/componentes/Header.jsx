function Header({ usuario, onNavegar, onSair }) {

  function abrirPerfil() {
    console.log("Abrindo perfil");

    onNavegar("perfil");
  }

  return (
    <header className="header">

      <div className="header-logo">
        <h1>VÉRTICE</h1>
      </div>

      <div className="header-actions">

        <button
          type="button"
          className="header-user"
          onClick={abrirPerfil}
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
              {usuario?.ocupacao || ""}
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