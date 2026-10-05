import { confirmarSaida } from "../componentes/shared/useUnsavedChanges";
import { createContext, useContext, useEffect, useRef, useState } from "react";
import HeaderCanteiro from "../componentes/canteiro/HeaderCanteiro";
import BottomNav from "../componentes/canteiro/BottomNav";
import { lerUsuario, sairCanteiro } from "../canteiro/sessao";
import { listarObras } from "../api/obras";
import { buscarRecursosDaObra } from "../api/recursos";
import { listarDiarios, listarAtividades, listarRdos, listarApropriacoes, carregarApontamentos } from "../canteiro/dados";
import { lerRascunhos } from "../canteiro/rascunhos";
import "../canteiro/canteiro.css";
const Contexto = createContext(null);
export const useCanteiro = () => useContext(Contexto);
const vazio = { diarios: [], atividades: [], rdos: [], apropriacoes: [], apontamentos: [], recursos: { equipes: [], insumos: [], maquinarios: [] } };
export default function CanteiroLayout({ children, pagina, onNavegar }) {
  const [usuario] = useState(lerUsuario);
  const [obras, setObras] = useState([]);
  const [obra, setObra] = useState(null);
  const [dados, setDados] = useState(vazio);
  const [carregandoObras, setCarregandoObras] = useState(true);
  const [carregando, setCarregando] = useState(false);
  const [erroObras, setErroObras] = useState("");
  const [avisos, setAvisos] = useState([]);
  const [online, setOnline] = useState(navigator.onLine);
  const [revisao, setRevisao] = useState(0);
  const [tentativa, setTentativa] = useState(0);
  const [rascunhos, setRascunhos] = useState(() => lerRascunhos(usuario.id_usuario));
  const [rascunhoAberto, setRascunhoAberto] = useState(null);
  const main = useRef(null);
  useEffect(() => { main.current?.focus(); window.scrollTo(0, 0); }, [pagina]);
  useEffect(() => {
    const conectar = () => setOnline(true), desconectar = () => setOnline(false);
    window.addEventListener("online", conectar); window.addEventListener("offline", desconectar);
    return () => { window.removeEventListener("online", conectar); window.removeEventListener("offline", desconectar); };
  }, []);
  useEffect(() => {
    let ativo = true;
    setCarregandoObras(true); setErroObras("");
    async function carregar() {
      try {
        if (!usuario.idconstrutora) throw new Error("A sessão não informa a construtora. Entre novamente.");
        const lista = await listarObras(usuario.idconstrutora);
        if (!ativo) return;
        setObras(lista);
        let salva;
        try { salva = JSON.parse(localStorage.getItem("obra_selecionada") || "null"); } catch { salva = null; }
        const escolhida = lista.find(item => String(item.id_obra) === String(salva?.id_obra)) || null;
        setObra(escolhida); setDados(vazio);
        if (!escolhida) localStorage.removeItem("obra_selecionada");
        else localStorage.setItem("obra_selecionada", JSON.stringify(escolhida));
      } catch (erro) {
        if (ativo) { console.error("Obras do Canteiro:", erro); setErroObras(erro.message === "A sessão não informa a construtora. Entre novamente." ? erro.message : "Não foi possível carregar as obras."); }
      } finally { if (ativo) setCarregandoObras(false); }
    }
    carregar();
    return () => { ativo = false; };
  }, [usuario.idconstrutora, tentativa]);
  useEffect(() => {
    if (!obra) { setDados(vazio); setAvisos([]); setCarregando(false); return; }
    let ativo = true;
    const controle = new AbortController();
    setCarregando(true); setAvisos([]); setDados(vazio);
    async function carregar() {
      const resultados = await Promise.allSettled([
        listarDiarios(obra.id_obra, controle.signal),
        listarAtividades(obra.id_obra, controle.signal),
        buscarRecursosDaObra(obra.id_obra),
        listarRdos(obra.id_obra, controle.signal),
        listarApropriacoes(controle.signal)
      ]);
      if (!ativo) return;
      const nomes = ["diários", "atividades", "recursos", "RDOs", "consumos"];
      const mensagens = [];
      resultados.forEach((r, i) => { if (r.status === "rejected") { console.error(`Canteiro: ${nomes[i]}`, r.reason); mensagens.push(`Não foi possível carregar ${nomes[i]}.`); } });
      const valor = (i, padrao) => resultados[i].status === "fulfilled" ? resultados[i].value : padrao;
      const diarios = valor(0, []).filter(d => String(d.obrax_id) === String(obra.id_obra)).sort((a, b) => String(b.data).localeCompare(String(a.data)) || Number(b.id_diario) - Number(a.id_diario));
      const recursos = valor(2, vazio.recursos);
      let apontamentos = [];
      try { apontamentos = await carregarApontamentos(diarios, controle.signal); }
      catch (e) { if (!controle.signal.aborted) { console.error("Apontamentos:", e); mensagens.push("Não foi possível carregar apontamentos."); } }
      if (!ativo) return;
      const idsAtividades = new Set(valor(1, []).filter(a => String(a.idx_obra) === String(obra.id_obra)).map(a => String(a.id_atividade)));
      setDados({ diarios, apontamentos, rdos: valor(3, []).filter(r => String(r.id_obra) === String(obra.id_obra)), apropriacoes: valor(4, []).filter(a => idsAtividades.has(String(a.id_atividade))), atividades: valor(1, []).filter(a => String(a.idx_obra) === String(obra.id_obra)), recursos: {
        equipes: recursos.equipes.filter(e => String(e.idobra ?? e.id_obra) === String(obra.id_obra)),
        insumos: recursos.insumos.filter(e => String(e.idobra ?? e.id_obra) === String(obra.id_obra)),
        maquinarios: recursos.maquinarios.filter(e => String(e.idobra ?? e.id_obra) === String(obra.id_obra))
      } });
      setAvisos(mensagens); setCarregando(false);
    }
    carregar();
    return () => { ativo = false; controle.abort(); };
  }, [obra, revisao]);
  function selecionarObra(id) {
    const escolhida = obras.find(item => String(item.id_obra) === String(id)) || null;
    if (String(escolhida?.id_obra) === String(obra?.id_obra)) { return true; }
    if (!confirmarSaida()) return false;
    setObra(escolhida); setDados(vazio); setAvisos([]); setCarregando(Boolean(escolhida)); setRascunhoAberto(null);
    if (escolhida) localStorage.setItem("obra_selecionada", JSON.stringify(escolhida));
    else localStorage.removeItem("obra_selecionada");
    return true;
  }
  function atualizarRascunhos() { setRascunhos(lerRascunhos(usuario.id_usuario)); }
  function abrirRascunho(item) {
    const escolhida = obras.find(o => String(o.id_obra) === String(item.obra));
    if (!escolhida) return;
    if (!confirmarSaida() || selecionarObra(escolhida.id_obra) === false) return;
    setRascunhoAberto(item);
    onNavegar(({ diario: "canteiro-diario", atividade: "canteiro-atividade", material: "canteiro-material", ocorrencia: "canteiro-ocorrencia" })[item.tipo] || "canteiro-registrar");
  }
  const contexto = { usuario, obras, obra, ...dados, carregando: carregando || carregandoObras, avisos, online,
    selecionarObra, onNavegar, atualizar: () => setRevisao(v => v + 1),
    rascunhos, atualizarRascunhos, rascunhoAberto, abrirRascunho, fecharRascunho: () => setRascunhoAberto(null),
    sair: () => { if (!confirmarSaida()) return; sairCanteiro(); onNavegar("login"); } };
  return <Contexto.Provider value={contexto}><div className="ct-app"><a href="#ct-main" className="ct-skip">Ir para o conteúdo</a><HeaderCanteiro usuario={usuario} onNavegar={onNavegar} /><main id="ct-main" ref={main} tabIndex="-1" className="ct-main">
    {!online && <p className="ct-message" role="status">Você está offline. Salve um rascunho e envie manualmente quando a conexão retornar.</p>}
    {erroObras && <div className="ct-message ct-error" role="alert">{erroObras}<button className="ct-link" type="button" onClick={() => setTentativa(v => v + 1)}>Tentar novamente</button></div>}
    {pagina !== "canteiro-perfil" && <section className="ct-selector"><label className="ct-field" htmlFor="ct-obra">Obra selecionada<select id="ct-obra" value={obra?.id_obra || ""} disabled={carregandoObras} onChange={e => selecionarObra(e.target.value)}><option value="">{carregandoObras ? "Carregando obras…" : "Selecione uma obra"}</option>{obras.map(o => <option key={o.id_obra} value={o.id_obra}>{o.nome || o.obra}</option>)}</select></label>{!carregandoObras && !erroObras && obras.length === 0 && <p>Nenhuma obra disponível para sua construtora.</p>}</section>}
    {carregando && <p className="ct-message" role="status">Carregando dados da obra…</p>}
    {avisos.length > 0 && <div className="ct-message ct-error" role="alert">{avisos.map(a => <p key={a}>{a}</p>)}<button className="ct-link" type="button" onClick={contexto.atualizar}>Tentar novamente</button></div>}
    {children}
  </main><BottomNav pagina={pagina} onNavegar={onNavegar} /></div></Contexto.Provider>;
}
