import {
  useState,
} from "react";

import Login from "./pages/Login";
import Cadastro from "./pages/Cadastro";
import Dashboard from "./pages/Dashboard";
import Obras from "./pages/Obras";
import Equipes from "./pages/Equipes";
import ObraDetalhes from "./pages/ObraDetalhes";
import Perfil from "./pages/Perfil";

import "./styles.css";

function App() {
  const [
    pagina,
    setPagina,
  ] = useState(() => {
    const idUsuario =
      localStorage.getItem(
        "id_usuario"
      );

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

  const [
    obraSelecionada,
    setObraSelecionada,
  ] = useState(() => {
    try {
      return JSON.parse(
        localStorage.getItem(
          "obra_selecionada"
        ) || "null"
      );
    } catch {
      return null;
    }
  });

  function navegar(
    novaPagina
  ) {
    localStorage.setItem(
      "pagina_atual",
      novaPagina
    );

    setPagina(
      novaPagina
    );
  }

  function abrirObra(
    obra
  ) {
    setObraSelecionada(
      obra
    );

    localStorage.setItem(
      "obra_selecionada",
      JSON.stringify(
        obra
      )
    );

    navegar(
      "obra-detalhes"
    );
  }

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

  if (
    pagina === "login"
  ) {
    return (
      <Login
        onLogin={() =>
          navegar(
            "dashboard"
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

  if (
    pagina === "cadastro"
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

  if (
    pagina === "equipes"
  ) {
    return (
      <Equipes
        onNavegar={
          navegar
        }
      />
    );
  }

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

  if (
    pagina === "perfil"
  ) {
    return (
      <Perfil
        onNavegar={
          navegar
        }
      />
    );
  }

  return (
    <Dashboard
      onNavegar={
        navegar
      }
    />
  );
}

export default App;