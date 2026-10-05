import useUnsavedChanges from "../componentes/shared/useUnsavedChanges";
import { useEffect, useRef, useState } from "react";
import { useCanteiro } from "../layouts/CanteiroLayout";
import { gravarRascunho, removerRascunho } from "./rascunhos";
export default function useRegistro(tipo, criarInicial) {
  const ctx = useCanteiro();
  const [form, setForm] = useState(criarInicial);
  const [mensagem, setMensagem] = useState("");
  const [erro, setErro] = useState("");
  const [salvando, setSalvando] = useState(false);
  const baseline = useRef(JSON.stringify(form));
  const localId = useRef(null);
  const [versaoSalva, setVersaoSalva] = useState(JSON.stringify(form));
  useUnsavedChanges(JSON.stringify(form) !== versaoSalva, salvando);
  const trava = useRef(false);
  const montado = useRef(true);
  const ultimaObra = useRef(null);
  const obraAtual = useRef(ctx.obra?.id_obra);
  obraAtual.current = ctx.obra?.id_obra;
  const restaurado = ctx.rascunhoAberto?.tipo === tipo && String(ctx.rascunhoAberto.obra) === String(ctx.obra?.id_obra) ? ctx.rascunhoAberto : null;
  useEffect(() => { montado.current = true; return () => { montado.current = false; }; }, []);
  useEffect(() => {
    if (!restaurado && ultimaObra.current === ctx.obra?.id_obra) return;
    ultimaObra.current = ctx.obra?.id_obra;
    const inicial = restaurado?.payload || criarInicial();
    baseline.current = JSON.stringify(inicial); setVersaoSalva(baseline.current); localId.current = restaurado?.id || null;
    setForm(inicial);
    setMensagem(restaurado ? "Rascunho restaurado. Revise os dados antes de enviar." : ""); setErro("");
  }, [ctx.obra?.id_obra, restaurado?.id]);
  useEffect(() => {
    const snapshot = JSON.stringify(form);
    if (salvando || !ctx.obra || snapshot === versaoSalva || (!localId.current && snapshot === baseline.current)) return;
    const timer = setTimeout(() => {
      try {
        const item = gravarRascunho(ctx.usuario.id_usuario, { id: localId.current, obra: ctx.obra.id_obra, nomeObra: ctx.obra.nome, tipo, payload: form });
        localId.current = item.id; setVersaoSalva(snapshot); ctx.atualizarRascunhos();
        setMensagem("Salvo neste dispositivo. Rascunho salvo automaticamente. O envio continua manual.");
      } catch { setErro("Não foi possível salvar automaticamente. Salve o rascunho antes de sair."); }
    }, 700);
    return () => clearTimeout(timer);
  }, [form, salvando, ctx.obra?.id_obra, versaoSalva]);
  function campo(nome, valor) { setForm(f => ({ ...f, [nome]: valor })); setErro(""); setMensagem(""); }
  function rascunhar() {
    try {
      const item = gravarRascunho(ctx.usuario.id_usuario, { id: localId.current, obra: ctx.obra.id_obra, nomeObra: ctx.obra.nome, tipo, payload: form });
      localId.current = item.id; setVersaoSalva(JSON.stringify(form)); ctx.atualizarRascunhos(); setErro(""); setMensagem("Rascunho salvo neste navegador. Envie manualmente quando estiver conectado.");
    } catch (e) { console.error("Rascunho:", e); setErro("Não foi possível salvar o rascunho neste navegador."); }
  }
  async function enviar(evento, validar, salvar, payload = form) {
    evento.preventDefault();
    if (trava.current) return;
    setErro(""); setMensagem("");
    let requisicaoIniciada = false;
    const obraEnviada = ctx.obra?.id_obra;
    try {
      if (!Number.isInteger(Number(ctx.obra?.id_obra)) || Number(ctx.obra?.id_obra) <= 0 || !Number.isInteger(Number(ctx.usuario.id_usuario)) || Number(ctx.usuario.id_usuario) <= 0) throw new Error("Selecione uma obra e confira sua sessão.");
      if (ctx.carregando) throw new Error("Aguarde o carregamento dos dados da obra.");
      validar();
      if (!ctx.online) throw new Error("Você está offline. Salve um rascunho para enviar depois.");
      trava.current = true; setSalvando(true); requisicaoIniciada = true;
      await salvar(payload);
    } catch (e) {
      console.error("Registro do Canteiro:", e);
      if (montado.current) { if (obraAtual.current === obraEnviada) setErro(requisicaoIniciada ? (e.status ? `Não foi possível enviar o registro. ${e.message || "Revise os dados e tente novamente."}` : "Não foi possível confirmar o envio. Consulte o histórico antes de tentar novamente.") : e.message || "Não foi possível enviar o registro."); setSalvando(false); }
      trava.current = false;
      return;
    }
    // Nenhuma escrita posterior no armazenamento pode converter um POST bem-sucedido em falha.
    let avisoLocal = "";
    try { if (localId.current) removerRascunho(ctx.usuario.id_usuario, localId.current); } catch (e) { console.error(e); avisoLocal = " O rascunho local não pôde ser removido; não o reenvie."; }
    ctx.atualizarRascunhos(); ctx.atualizar();
    if (montado.current) {
      if (obraAtual.current === obraEnviada) { localId.current = null; const inicial = criarInicial(); baseline.current = JSON.stringify(inicial); setVersaoSalva(baseline.current); setForm(inicial); setMensagem("Registro enviado com sucesso." + avisoLocal); }
      ctx.fecharRascunho(); setSalvando(false);
    }
    trava.current = false;
  }
  return { ctx, form, campo, mensagem, erro, salvando, rascunhar, enviar };
}
