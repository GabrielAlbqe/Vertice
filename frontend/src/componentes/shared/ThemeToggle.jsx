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
  function selecionar(proximo) {
    document.documentElement.dataset.theme = proximo;
    setTema(proximo);
    try { localStorage.setItem("vertice_tema", proximo); } catch { /* O tema funciona também sem armazenamento. */ }
  }
  return <div className="theme-control" role="group" aria-label="Tema">
    {[['light', 'Claro'], ['dark', 'Escuro']].map(([valor, nome]) =>
      <button key={valor} type="button" className="theme-toggle" onClick={() => selecionar(valor)} aria-pressed={tema === valor}>{nome}</button>
    )}
  </div>;
}
