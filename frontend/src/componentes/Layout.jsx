import {
  useEffect,
  useState,
} from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

import {
  requisitar,
} from "../api/api.js";

function Layout({
  children,
  onNavegar,
}) {
  const [
    usuario,
    setUsuario,
  ] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "usuario"
        ) || "null"
      );
    } catch {
      return null;
    }
  });

  useEffect(() => {
    buscarUsuario();
  }, []);

  async function buscarUsuario() {
    const idUsuario =
      localStorage.getItem(
        "id_usuario"
      );

    if (!idUsuario) {
      return;
    }

    try {
      const dados =
        await requisitar(
          `/usuarios/${idUsuario}`
        );

      const atual =
        dados?.usuario ??
        dados;

      setUsuario(
        atual
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(
          atual
        )
      );

      localStorage.setItem(
        "nome_usuario",
        atual?.nome ??
          ""
      );
    } catch (erro) {
      console.warn(
        "Não foi possível carregar usuário:",
        erro?.message ||
          erro
      );
    }
  }

  function sair() {
    [
      "id_usuario",
      "nome_usuario",
      "email_usuario",
      "ocupacao",
      "ambiente",
      "status_usuario",
      "idconstrutora",
      "id_construtora",
      "usuario",
      "obra_selecionada",
      "pagina_atual",
    ].forEach(
      (chave) =>
        localStorage.removeItem(
          chave
        )
    );

    if (
      typeof onNavegar ===
      "function"
    ) {
      onNavegar(
        "login"
      );
    }
  }

  return (
    <div className="layout">

      <Header
        usuario={
          usuario
        }
        onNavegar={
          onNavegar
        }
        onSair={
          sair
        }
      />

      <div className="layout-body">

        <Sidebar
          onNavegar={
            onNavegar
          }
        />

        <main className="main-content">
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;