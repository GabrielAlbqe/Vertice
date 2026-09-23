import { useEffect, useState } from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

import { requisitar } from "../api/api";

function Layout({ children, onNavegar }) {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    buscarUsuario();
  }, []);

  async function buscarUsuario() {
    try {
      const idUsuario =
        localStorage.getItem("id_usuario");

      if (!idUsuario) {
        return;
      }

      const dados = await requisitar(
        `/usuarios/${idUsuario}`
      );

      console.log(
        "Usuário carregado:",
        dados
      );

      setUsuario(
        dados.usuario || dados
      );

    } catch (erro) {
      console.error(
        "Erro ao buscar usuário:",
        erro
      );
    }
  }

  function sair() {
    localStorage.removeItem(
      "id_usuario"
    );

    localStorage.removeItem(
      "idconstrutora"
    );

    onNavegar("login");
  }

  return (
    <div className="layout">

      <Header
        usuario={usuario}
        onNavegar={onNavegar}
        onSair={sair}
      />

      <div className="layout-body">

        <Sidebar
          onNavegar={onNavegar}
        />

        <main className="main-content">
          {children}
        </main>

      </div>
    </div>
  );
}

export default Layout;