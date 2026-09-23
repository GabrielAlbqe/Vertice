import { useState } from "react";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import Equipes from "./pages/Equipes";
import ObraDetalhes from "./pages/ObraDetalhes";
import Perfil from "./pages/Perfil";

import "./styles.css";

function App() {
  // =====================================================
  // PÁGINA ATUAL
  // =====================================================

  const [pagina, setPagina] = useState(() => {
    const idUsuario =
      localStorage.getItem("id_usuario");

    if (!idUsuario) {
      return "login";
    }

    const obraSalva =
      localStorage.getItem(
        "obra_selecionada"
      );

    if (obraSalva) {
      return "obra-detalhes";
    }

    return "dashboard";
  });

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

  function abrirObra(obra) {
    setObraSelecionada(
      obra
    );

    localStorage.setItem(
      "obra_selecionada",
      JSON.stringify(obra)
    );

    setPagina(
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

    setPagina("obras");
  }

  // =====================================================
  // LOGIN
  // =====================================================

  if (pagina === "login") {
    return (
      <Login
        onLogin={() =>
          setPagina(
            "dashboard"
          )
        }
        onCadastro={() =>
          setPagina(
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
          setPagina("login")
        }
        onVoltar={() =>
          setPagina("login")
        }
      />
    );
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
          setPagina
        }
      />
    );
  }

  // =====================================================
  // OBRAS
  // =====================================================

  if (
    pagina === "obras"
  ) {
    return (
      <Obras
        onNavegar={
          setPagina
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
          setPagina
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
          setPagina
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
          setPagina
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
        setPagina
      }
    />
  );
}

export default App;