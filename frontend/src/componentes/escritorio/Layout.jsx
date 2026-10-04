import { useEffect, useRef, useState } from "react";
import { lerUsuario, sairCanteiro, usuarioSeguro } from "../../canteiro/sessao";
import Header from "./Header";
import Sidebar from "./Sidebar";
import { requisitar } from "../../api/api";

function Layout({ children, onNavegar }) {
  const main = useRef(null);
  const [usuario, setUsuario] = useState(lerUsuario);

  useEffect(() => {
    let ativo = true;
    const controle = new AbortController();
    buscarUsuario(controle.signal, () => ativo);
    main.current?.focus();
    return () => { ativo = false; controle.abort(); };
  }, []);

  async function buscarUsuario(signal, ativo) {
    const idUsuario =
      localStorage.getItem("id_usuario");

    if (!idUsuario) {
      return;
    }

    try {
      const dados =
        await requisitar(
          `/usuarios/${idUsuario}`, { signal }
        );

      const usuarioAtual =
        usuarioSeguro(dados?.usuario || dados || {});
      if (!ativo() || !usuarioAtual.id_usuario || localStorage.getItem("id_usuario") !== String(usuarioAtual.id_usuario)) return;

      setUsuario(usuarioAtual);

      localStorage.setItem(
        "usuario",
        JSON.stringify(usuarioAtual)
      );

      localStorage.setItem(
        "nome_usuario",
        usuarioAtual?.nome || ""
      );
    } catch (erro) {
      if (signal.aborted) return;
      console.warn(
        "Não foi possível atualizar o usuário do cabeçalho:",
        erro.message || erro
      );
    }
  }

  function sair() {
    sairCanteiro();

    if (
      typeof onNavegar === "function"
    ) {
      onNavegar("login");
    }
  }

  return (
    <div className="layout">

      {/* LATERAL FIXA */}
      <div className="layout-sidebar">
        <Sidebar
          onNavegar={onNavegar}
        />
      </div>

      {/* ÁREA DIREITA */}
      <div className="layout-main">

        <Header
          usuario={usuario}
          onNavegar={onNavegar}
          onSair={sair}
        />

        {/* SOMENTE ESTA ÁREA ROLA */}
        <main className="main-content" ref={main} tabIndex={-1}>
          {children}
        </main>

      </div>

    </div>
  );
}

export default Layout;
