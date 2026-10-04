import { useEffect, useState } from "react";
import Layout from "../../componentes/escritorio/Layout";
import { requisitar } from "../../api/api";
import { lerUsuario, sairCanteiro, usuarioSeguro } from "../../canteiro/sessao";
import ThemeToggle from "../../componentes/shared/ThemeToggle";

export default function Perfil({ onNavegar }) {
  const [usuario, setUsuario] = useState(lerUsuario);
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState("");
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true); setErro("");
    requisitar(`/usuarios/${encodeURIComponent(usuario.id_usuario)}`, { signal: controle.signal })
      .then(dados => {
        if (controle.signal.aborted) return;
        const atual = dados?.usuario || dados;
        if (!atual?.id_usuario) throw new Error("Perfil inválido.");
        setUsuario(usuarioSeguro(atual));
      })
      .catch(e => {
        if (!controle.signal.aborted) {
          console.error("Perfil:", e);
          setErro("Não foi possível atualizar o perfil. Mostrando os dados da sessão.");
        }
      })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [usuario.id_usuario, tentativa]);
  return <Layout onNavegar={onNavegar}><div className="dashboard">
    <section className="dashboard-header"><div><span className="dashboard-eyebrow">MINHA CONTA</span><h1>Perfil</h1><p>Informações e preferências da sua conta.</p></div></section>
    {carregando && <p role="status">Atualizando perfil…</p>}
    {erro && <div className="auth-error" role="alert">{erro}<button type="button" className="secondary-button" onClick={() => setTentativa(v => v + 1)}>Tentar novamente</button></div>}
    <section className="dashboard-section profile-section"><h2>Informações pessoais</h2><div className="perfil-container">
      <div className="perfil-avatar" aria-hidden="true">{usuario.nome?.charAt(0).toUpperCase() || "U"}</div>
      <dl className="perfil-dados">{[["nome", "Nome"], ["email", "E-mail"], ["ocupacao", "Função"], ["ambiente", "Ambiente"]].map(([campo, titulo]) => <div className="perfil-campo" key={campo}><dt>{titulo}</dt><dd><strong>{usuario[campo] || "Não informado"}</strong></dd></div>)}</dl>
    </div></section>
    <section className="dashboard-section profile-section"><span className="section-label">APARÊNCIA</span><h2>Preferências</h2><p>Tema</p><ThemeToggle /></section>
    <section className="dashboard-section profile-section"><h2>Conta</h2><button type="button" className="cancel-button" onClick={() => { sairCanteiro(); onNavegar("login"); }}>Sair da conta</button></section>
  </div></Layout>;
}
