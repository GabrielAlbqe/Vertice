import { useState } from "react";
import CanteiroApp from "./canteiro/CanteiroApp";
import { usuarioCanteiro, paginasCanteiro } from "./canteiro/sessao";

import Login from "./pages/Login";
import Cadastro from "./pages/escritorio/Cadastro";
import Dashboard from "./pages/escritorio/Dashboard";
import Obras from "./pages/escritorio/Obras";
import Equipes from "./pages/escritorio/Equipes";
import ObraDetalhes from "./pages/escritorio/ObraDetalhes";
import Perfil from "./pages/escritorio/Perfil";
import AnalyticsFinanceiro from "./pages/escritorio/AnalyticsFinanceiro";

import "./styles.css";

function App() {
  // =====================================================
  // PÁGINA ATUAL
  // =====================================================

  const [pagina, setPagina] = useState(() => {
    const idUsuario =
      localStorage.getItem("id_usuario");

    if (!idUsuario) {
      localStorage.setItem(
        "pagina_atual",
        "login"
      );

      return "login";
    }

    const salva = localStorage.getItem("pagina_atual");
    if (usuarioCanteiro()) {
      const destino = paginasCanteiro.includes(salva) ? salva : "canteiro-home";
      localStorage.setItem("pagina_atual", destino);
      return destino;
    }
    const paginas = ["dashboard", "obras", "equipes", "perfil", "obra-detalhes", "analytics-financeiro"];
    let destino = paginas.includes(salva) ? salva : "dashboard";
    if (destino === "obra-detalhes") {
      try {
        if (!JSON.parse(localStorage.getItem("obra_selecionada") || "null")?.id_obra) destino = "obras";
      } catch { destino = "obras"; }
    }
    localStorage.setItem("pagina_atual", destino);
    return destino;
  });

  // =====================================================
  // NAVEGAÇÃO CENTRAL
  // =====================================================

  function navegar(
    paginaDestino
  ) {
    if (!["login", "cadastro"].includes(paginaDestino)) {
      if (!localStorage.getItem("id_usuario")) paginaDestino = "login";
      else if (usuarioCanteiro() && !paginasCanteiro.includes(paginaDestino)) paginaDestino = "canteiro-home";
      else if (!usuarioCanteiro() && paginasCanteiro.includes(paginaDestino)) paginaDestino = "dashboard";
    }
    localStorage.setItem(
      "pagina_atual",
      paginaDestino
    );

    setPagina(
      paginaDestino
    );
  }


  // =====================================================
  // OBRA SELECIONADA
  // =====================================================

  const [
    obraSelecionada,
    setObraSelecionada,
  ] = useState(() => {
    const obraSalva =
      localStorage.getItem(
        "obra_selecionada"
      );

    if (!obraSalva) {
      return null;
    }

    try {
      return JSON.parse(
        obraSalva
      );
    } catch {
      return null;
    }
  });

  // =====================================================
  // ABRIR OBRA
  // =====================================================

  function abrirObra(
    obra
  ) {
    setObraSelecionada(
      obra
    );

    localStorage.setItem(
      "obra_selecionada",
      JSON.stringify(obra)
    );

    navegar(
      "obra-detalhes"
    );
  }

  // =====================================================
  // VOLTAR PARA OBRAS
  // =====================================================

  function voltarParaObras() {
    setObraSelecionada(
      null
    );

    localStorage.removeItem(
      "obra_selecionada"
    );

    navegar(
      "obras"
    );
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (
    pagina === "login"
  ) {
    return (
      <Login
        onLogin={(usuario) =>
          navegar(
            usuarioCanteiro(usuario) ? "canteiro-home" : "dashboard"
          )
        }
        onCadastro={() =>
          navegar(
            "cadastro"
          )
        }
      />
    );
  }

  // =====================================================
  // CADASTRO
  // =====================================================

  if (
    pagina ===
    "cadastro"
  ) {
    return (
      <Cadastro
        onCadastro={() =>
          navegar(
            "login"
          )
        }
        onVoltar={() =>
          navegar(
            "login"
          )
        }
      />
    );
  }

  if (localStorage.getItem("id_usuario") && usuarioCanteiro()) {
    return <CanteiroApp pagina={pagina} onNavegar={navegar} />;
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  if (
    pagina ===
    "dashboard"
  ) {
    return (
      <Dashboard
        onNavegar={
          navegar
        }
      />
    );
  }

  // =====================================================
  // OBRAS
  // =====================================================

  if (pagina === "analytics-financeiro") {
    return <AnalyticsFinanceiro onNavegar={navegar} />;
  }

  if (
    pagina === "obras"
  ) {
    return (
      <Obras
        onNavegar={
          navegar
        }
        onAbrirObra={
          abrirObra
        }
      />
    );
  }

  // =====================================================
  // DETALHES DA OBRA
  // =====================================================

  if (
    pagina ===
    "obra-detalhes"
  ) {
    return (
      <ObraDetalhes
        obra={
          obraSelecionada
        }
        onNavegar={
          navegar
        }
        onVoltar={
          voltarParaObras
        }
      />
    );
  }

  // =====================================================
  // PERFIL
  // =====================================================

  if (
    pagina ===
    "perfil"
  ) {
    return (
      <Perfil
        onNavegar={
          navegar
        }
      />
    );
  }

  // =====================================================
  // EQUIPES
  // =====================================================

  if (
    pagina ===
    "equipes"
  ) {
    return (
      <Equipes
        onNavegar={
          navegar
        }
      />
    );
  }

  // =====================================================
  // FALLBACK
  // =====================================================

  return (
    <Dashboard
      onNavegar={
        navegar
      }
    />
  );
}

export default App;
