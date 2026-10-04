import { useEffect, useState } from "react";

export function iniciarTema() {
  let tema = "light";
  try { tema = localStorage.getItem("vertice_tema") === "dark" ? "dark" : "light"; } catch { /* Preferência indisponível. */ }
  document.documentElement.dataset.theme = tema;
  return tema;
}

export default function ThemeToggle() {
  const [tema, setTema] = useState(() => document.documentElement.dataset.theme || iniciarTema());
  useEffect(() => {
    const sincronizar = () => setTema(iniciarTema());
    window.addEventListener("storage", sincronizar);
    return () => window.removeEventListener("storage", sincronizar);
  }, []);
  function alternar() {
    const proximo = tema === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = proximo;
    setTema(proximo);
    try { localStorage.setItem("vertice_tema", proximo); } catch { /* O tema funciona também sem armazenamento. */ }
  }
  return <button type="button" className="theme-toggle" onClick={alternar} aria-label={`Ativar modo ${tema === "dark" ? "claro" : "escuro"}`} aria-pressed={tema === "dark"}>{tema === "dark" ? "☀ Claro" : "☾ Escuro"}</button>;
}
