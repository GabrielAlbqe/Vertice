import { useEffect, useState } from "react";
import { useCanteiro } from "../../layouts/CanteiroLayout";
import { requisitar } from "../../api/api";
import ThemeToggle from "../../componentes/shared/ThemeToggle";
import { usuarioSeguro } from "../../canteiro/sessao";
export default function CanteiroPerfil() {
  const ctx = useCanteiro();
  const [usuario, setUsuario] = useState(ctx.usuario), [erro, setErro] = useState(""), [tentativa, setTentativa] = useState(0), [carregando, setCarregando] = useState(false);
  useEffect(() => {
    const controle = new AbortController(); setErro(""); setCarregando(true);
    requisitar(`/usuarios/${encodeURIComponent(ctx.usuario.id_usuario)}`, { signal: controle.signal })
      .then(dados => { if (!controle.signal.aborted) { const atual = dados?.usuario || dados; if (!atual?.id_usuario) throw new Error("Perfil inválido."); setUsuario(usuarioSeguro(atual)); } })
      .catch(e => { if (!controle.signal.aborted) { console.error("Perfil do Canteiro:", e); setErro("Não foi possível atualizar o perfil. Mostrando os dados da sessão."); } })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [ctx.usuario.id_usuario, tentativa]);
  return <><div className="ct-title"><span className="ct-eyebrow">MINHA CONTA</span><h1>Perfil</h1></div><div className="ct-stack">{carregando && <p role="status">Atualizando perfil…</p>}{erro && <div role="alert" className="ct-message ct-error">{erro}<button type="button" className="ct-link" onClick={() => setTentativa(v => v + 1)}>Tentar novamente</button></div>}<section className="ct-card"><h2>Informações pessoais</h2><div className="ct-profile-avatar">{usuario.nome?.charAt(0).toUpperCase() || "U"}</div><h2>{usuario.nome}</h2><dl className="ct-facts">{[["email", "E-mail"], ["ocupacao", "Função"], ["ambiente", "Ambiente"], ["status", "Status"], ["idconstrutora", "Construtora"]].map(([campo, titulo]) => <div key={campo}><dt>{titulo}</dt><dd>{usuario[campo] || "Não informado"}</dd></div>)}</dl></section><section className="ct-card profile-section"><span className="ct-eyebrow">APARÊNCIA</span><h2>Preferências</h2><p>Tema</p><ThemeToggle /></section><section className="ct-card ct-stack"><h2>Conta</h2><button type="button" className="ct-button ct-secondary" onClick={() => ctx.onNavegar("canteiro-foto")}>Prévia local de fotos</button><button type="button" className="ct-button" onClick={ctx.sair}>Sair da conta</button><p className="ct-muted">Seus rascunhos permanecem neste navegador e ficam disponíveis somente na sessão do mesmo usuário.</p></section></div></>;
}
