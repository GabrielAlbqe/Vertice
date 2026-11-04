import Layout from './componentes/escritorio/Layout';
import CanteiroLayout from './layouts/CanteiroLayout';
import RouteContent from './navigation/RouteContent';
import { pages, preloadPage } from './navigation/pages';
const { dashboard: Dashboard, obras: Obras, equipes: Equipes, recursos: Recursos, perfil: Perfil, 'obra-detalhes': ObraDetalhes, 'analytics-financeiro': AnalyticsFinanceiro, canteiro: CanteiroApp } = pages;
import { startTransition, useEffect, useState } from "react";
import { usuarioCanteiro, paginasCanteiro, sessaoValida, invalidarSessao } from "./canteiro/sessao";

import Login from "./pages/Login";

import "./styles.css";
import { confirmarSaida } from "./componentes/shared/useUnsavedChanges";
import {sessionId} from './api/sessionTransport';
import RedefinirSenha from './pages/RedefinirSenha';

const rotas = { dashboard: "/escritorio", obras: "/escritorio/obras", equipes: "/escritorio/equipes", recursos: "/escritorio/recursos", perfil: "/escritorio/perfil", "obra-detalhes": "/escritorio/obra", "analytics-financeiro": "/escritorio/analytics", login: "/login" };
paginasCanteiro.forEach(p => { rotas[p] = p === "canteiro-home" ? "/canteiro" : "/canteiro/" + p.replace("canteiro-", ""); });

function App() {
  const [resetTicket]=useState(()=>{
    const params=new URLSearchParams(location.hash.slice(1)),ticket=params.get('reset');
    if(ticket)history.replaceState(null,'','/login');
    return ticket;
  });
  useEffect(()=>{
    const encerrar=()=>{setObraSelecionada(null);setPagina('login');history.replaceState(null,'','/login');};
    const conferir=()=>{if(localStorage.getItem('id_usuario') && !sessaoValida())invalidarSessao(sessionId());};
    window.addEventListener('vertice:sessao-expirada',encerrar);
    window.addEventListener('focus',conferir);
    const timer=setInterval(conferir,30000);conferir();
    return()=>{clearInterval(timer);window.removeEventListener('focus',conferir);window.removeEventListener('vertice:sessao-expirada',encerrar);};
  },[]);
  useEffect(() => {
    const lerRota = () => {
      const destino = Object.keys(rotas).find(p => rotas[p] === window.location.pathname.replace(/\/$/, ""));
      if (navegar(destino || (localStorage.getItem("id_usuario") ? (usuarioCanteiro() ? "canteiro-home" : "dashboard") : "login"), true) === false) history.pushState(null, "", rotas[localStorage.getItem("pagina_atual")] || "/login");
    };
    lerRota();
    window.addEventListener("popstate", lerRota);
    return () => window.removeEventListener("popstate", lerRota);
  }, []);
  // =====================================================
  // PÁGINA ATUAL
  // =====================================================

  const [pagina, setPagina] = useState(() => {
    const destinoUrl = Object.keys(rotas).find(p => rotas[p] === window.location.pathname.replace(/\/$/, ""));
    if (["login"].includes(destinoUrl)) return destinoUrl;
    const idUsuario =
      sessaoValida() ? localStorage.getItem("id_usuario") : null;

    if (!idUsuario) {
      localStorage.setItem(
        "pagina_atual",
        "login"
      );

      return "login";
    }

    const salva = destinoUrl || localStorage.getItem("pagina_atual");
    if (usuarioCanteiro()) {
      const destino = paginasCanteiro.includes(salva) ? salva : "canteiro-home";
      localStorage.setItem("pagina_atual", destino);
      return destino;
    }
    const paginas = ["dashboard", "obras", "equipes", "recursos", "perfil", "obra-detalhes", "analytics-financeiro"];
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
    paginaDestino, substituir = false
  ) {
    if (!["login"].includes(paginaDestino)) {
      if (!localStorage.getItem("id_usuario")) paginaDestino = "login";
      else if (usuarioCanteiro() && !paginasCanteiro.includes(paginaDestino)) paginaDestino = "canteiro-home";
      else if (!usuarioCanteiro() && paginasCanteiro.includes(paginaDestino)) paginaDestino = "dashboard";
    }
    if (paginaDestino === "obra-detalhes") {
      try { if (!JSON.parse(localStorage.getItem("obra_selecionada") || "null")?.id_obra) paginaDestino = "obras"; }
      catch { paginaDestino = "obras"; }
    }
    const rota = rotas[paginaDestino] || rotas.dashboard;
    if (paginaDestino !== localStorage.getItem("pagina_atual") && !confirmarSaida()) return false;
    if (location.pathname !== rota) history[substituir ? "replaceState" : "pushState"](null, "", rota);
    localStorage.setItem(
      "pagina_atual",
      paginaDestino
    );

    preloadPage(paginaDestino);
    if (!['login'].includes(paginaDestino) && !['login'].includes(pagina)) {
      startTransition(() => setPagina(paginaDestino));
    } else setPagina(paginaDestino);
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

  if(resetTicket)return <RedefinirSenha ticket={resetTicket}/>;
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
      />
    );
  }

  if (localStorage.getItem("id_usuario") && usuarioCanteiro()) {
    return <CanteiroLayout pagina={pagina} onNavegar={navegar}><RouteContent page={pagina}><CanteiroApp pagina={pagina} onNavegar={navegar} /></RouteContent></CanteiroLayout>;
  }

  // =====================================================
  // DASHBOARD
  // =====================================================

  function renderEscritorio() {
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

  if (pagina === "recursos") return <Recursos onNavegar={navegar} onAbrirObra={abrirObra} />;

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
  return <Layout onNavegar={navegar} pagina={pagina}><RouteContent page={pagina}>{renderEscritorio()}</RouteContent></Layout>;
}
export default App;
