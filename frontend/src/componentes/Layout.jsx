import {
  useEffect,
  useState,
} from "react";

import Header from "./Header";
import Sidebar from "./Sidebar";

import {
  requisitar,
} from "../api/api";

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

      const usuarioAtual =
        dados?.usuario ||
        dados;

      setUsuario(
        usuarioAtual
      );

      localStorage.setItem(
        "usuario",
        JSON.stringify(
          usuarioAtual
        )
      );

      localStorage.setItem(
        "nome_usuario",
        usuarioAtual?.nome || ""
      );
    } catch (erro) {
      console.warn(
        "Não foi possível atualizar o usuário do cabeçalho:",
        erro.message || erro
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
      onNavegar("login");
    }
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