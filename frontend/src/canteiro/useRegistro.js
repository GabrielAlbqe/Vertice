import { useEffect, useRef, useState } from "react";
import { useCanteiro } from "../layouts/CanteiroLayout";
import { gravarRascunho, removerRascunho } from "./rascunhos";
export default function useRegistro(tipo, criarInicial) {
  const ctx = useCanteiro();
  const [form, setForm] = useState(criarInicial);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const [idLocal, setIdLocal] = useState(null);
  const trava = useRef(false);
  const montado = useRef(true);
  const ultimaObra = useRef(null);
  const restaurado = ctx.rascunhoAberto?.tipo === tipo && String(ctx.rascunhoAberto.obra) === String(ctx.obra?.id_obra) ? ctx.rascunhoAberto : null;
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  useEffect(() => {
    if (!restaurado && ultimaObra.current === ctx.obra?.id_obra) return;
    ultimaObra.current = ctx.obra?.id_obra;
    setForm(restaurado?.payload || criarInicial());
    setIdLocal(restaurado?.id || null); setMensagem(restaurado ? "Rascunho restaurado. Revise os dados antes de enviar." : ""); setErro("");
  }, [ctx.obra?.id_obra, restaurado?.id]);
  function campo(nome, valor) { setForm(f => ({ ...f, [nome]: valor })); setErro(""); setMensagem(""); }
  function rascunhar() {
    try {
      const item = gravarRascunho(ctx.usuario.id_usuario, { id: idLocal, obra: ctx.obra.id_obra, nomeObra: ctx.obra.nome, tipo, payload: form });
      setIdLocal(item.id); ctx.atualizarRascunhos(); setErro(""); setMensagem("Rascunho salvo neste navegador. Envie manualmente quando estiver conectado.");
    } catch (e) { console.error("Rascunho:", e); setErro("Não foi possível salvar o rascunho neste navegador."); }
  }
  async function enviar(evento, validar, salvar, payload = form) {
    evento.preventDefault();
    if (trava.current) return;
    setErro(""); setMensagem("");
    let requisicaoIniciada = false;
    try {
      if (!ctx.obra || !ctx.usuario.id_usuario) throw new Error("Selecione uma obra e confira sua sessão.");
      validar();
      if (!ctx.online) throw new Error("Você está offline. Salve um rascunho para enviar depois.");
      trava.current = true; setSalvando(true); requisicaoIniciada = true;
      await salvar(payload);
    } catch (e) {
      console.error("Registro do Canteiro:", e);
      if (montado.current) { setErro(requisicaoIniciada ? (e.status ? `Não foi possível enviar o registro. ${e.message || "Revise os dados e tente novamente."}` : "Não foi possível confirmar o envio. Consulte o histórico antes de tentar novamente.") : e.message || "Não foi possível enviar o registro."); setSalvando(false); }
      trava.current = false;
      return;
    }
    // Nenhuma escrita posterior no armazenamento pode converter um POST bem-sucedido em falha.
    let avisoLocal = "";
    try { if (idLocal) removerRascunho(ctx.usuario.id_usuario, idLocal); } catch (e) { console.error(e); avisoLocal = " O rascunho local não pôde ser removido; não o reenvie."; }
    ctx.atualizarRascunhos(); ctx.atualizar();
    if (montado.current) {
      setIdLocal(null); setForm(criarInicial()); setMensagem("Registro enviado com sucesso." + avisoLocal);
      ctx.fecharRascunho(); setSalvando(false);
    }
    trava.current = false;
  }
  return { ctx, form, campo, mensagem, erro, salvando, rascunhar, enviar };
}
