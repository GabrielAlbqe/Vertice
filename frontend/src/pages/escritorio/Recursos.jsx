import { useEffect, useRef, useState } from "react";
import Layout from "../../componentes/escritorio/Layout";
import Modal from "../../componentes/escritorio/Modal";
import { listarObras } from "../../api/obras";
import { buscarCatalogoRecursos, criarInsumo, atualizarInsumo, excluirInsumo, criarMaquinario, atualizarMaquinario, excluirMaquinario, obterIdEquipe, obterIdInsumo, obterIdMaquinario } from "../../api/recursos";
import { ETAPAS_DIARIO } from "../../canteiro/dados";

const tipos = { equipes: "Equipes", insumos: "Insumos", maquinarios: "Maquinários" };
const ids = { equipes: obterIdEquipe, insumos: obterIdInsumo, maquinarios: obterIdMaquinario };
const moeda = v => v !== null && v !== undefined && v !== "" && Number.isFinite(Number(v)) ? Number(v).toLocaleString("pt-BR", { style: "currency", currency: "BRL" }) : "Não informado";

export default function Recursos({ onNavegar, onAbrirObra }) {
  const [obras, setObras] = useState([]), [catalogo, setCatalogo] = useState({ equipes: [], insumos: [], maquinarios: [] });
  const [tipo, setTipo] = useState("insumos"), [busca, setBusca] = useState(""), [obraId, setObraId] = useState("");
  const [carregando, setCarregando] = useState(true), [salvando, setSalvando] = useState(false), [erro, setErro] = useState(""), [sucesso, setSucesso] = useState("");
  const [editor, setEditor] = useState(null), [form, setForm] = useState({});
  const trava = useRef(false);
  async function carregar() {
    setCarregando(true); setErro("");
    try {
      const construtora = localStorage.getItem("idconstrutora") || localStorage.getItem("id_construtora");
      if (!construtora) throw new Error("Construtora não identificada. Entre novamente.");
      const lista = await listarObras(construtora);
      setObras(lista); setCatalogo(await buscarCatalogoRecursos(lista));
    } catch (e) { console.error("Recursos:", e); setErro(e.message); }
    finally { setCarregando(false); }
  }
  useEffect(() => { carregar(); }, []);
  function editar(item = null) {
    setErro(""); setSucesso(""); setEditor({ tipo, item });
    setForm({ nome: item?.nome ?? "", idobra: item?.idobra ?? obraId, quantidade_disponivel: item?.quantidade_disponivel ?? "", valor_unitario: item?.valor_unitario ?? "", quantidade: item?.quantidade ?? "", custo_diario: item?.custo_diario ?? "", etapa_atuacao: item?.etapa_atuacao ?? "", status: item?.status ?? "Ativo" });
  }
  async function salvar(e) {
    e.preventDefault(); if (trava.current) return;
    trava.current = true; setSalvando(true); setErro(""); setSucesso("");
    try {
      if (!form.nome.trim() || !obras.some(o => String(o.id_obra) === String(form.idobra))) throw new Error("Informe nome e obra.");
      const campos = editor.tipo === "insumos" ? ["quantidade_disponivel", "valor_unitario"] : ["quantidade", "custo_diario"];
      const payload = { nome: form.nome.trim(), idobra: Number(form.idobra) };
      for (const campo of campos) {
        const valor = Number(form[campo]);
        if (form[campo] === "" || !Number.isFinite(valor) || valor < 0 || (editor.tipo === "insumos" || campo === "quantidade") && !Number.isInteger(valor)) throw new Error("Informe quantidades e valores válidos. Quantidades e valores de insumos devem ser inteiros.");
        payload[campo] = valor;
      }
      if (editor.tipo === "maquinarios") { payload.etapa_atuacao = form.etapa_atuacao || null; payload.status = form.status; }
      const criar = editor.tipo === "insumos" ? criarInsumo : criarMaquinario;
      const atualizar = editor.tipo === "insumos" ? atualizarInsumo : atualizarMaquinario;
      if (editor.item) await atualizar(ids[editor.tipo](editor.item), payload); else await criar(payload);
      setEditor(null); setSucesso("Recurso salvo com sucesso."); await carregar();
    } catch (e) { console.error("Salvar recurso:", e); setErro(e.message); }
    finally { trava.current = false; setSalvando(false); }
  }
  async function excluir(item) {
    if (trava.current || !window.confirm(`Excluir definitivamente ${item.nome}? Esta ação excluirá definitivamente o cadastro.`)) return;
    trava.current = true; setSalvando(true); setErro(""); setSucesso("");
    try { await (tipo === "insumos" ? excluirInsumo : excluirMaquinario)(item); setSucesso("Cadastro excluído."); await carregar(); }
    catch (e) { console.error("Excluir recurso:", e); setErro(e.message); }
    finally { trava.current = false; setSalvando(false); }
  }
  const lista = catalogo[tipo].filter(r => (!obraId || String(r.idobra) === obraId) && `${r.nome || r.nome_equipe} ${r.etapa_atuacao || ""} ${r.status || ""}`.toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  const campo = (nome, titulo, props = {}) => <label className="form-group" key={nome}>{titulo}<input name={nome} value={form[nome] ?? ""} onChange={e => setForm(f => ({ ...f, [nome]: e.target.value }))} required {...props} /></label>;
  return <Layout onNavegar={onNavegar}><div className="dashboard"><section className="dashboard-header"><div><span className="dashboard-eyebrow">VISÃO GERAL</span><h1>Recursos</h1><p>Consulte os recursos da empresa. Gerencie os vínculos nos detalhes de cada obra.</p></div><button className="secondary-button" disabled={carregando || salvando} onClick={carregar}>Atualizar</button></section>
    {erro && !editor && <p className="auth-error" role="alert">{erro}</p>}{sucesso && <p className="mensagem-sucesso" role="status">{sucesso}</p>}
    <section className="dashboard-section"><div className="resource-tools">{Object.entries(tipos).map(([id, nome]) => <button key={id} className={tipo === id ? "button" : "secondary-button"} aria-pressed={tipo === id} disabled={salvando} onClick={() => setTipo(id)}>{nome} ({catalogo[id].length})</button>)}</div>
      <div className="resource-tools"><label>Buscar<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Nome, etapa ou status" /></label><label>Obra<select value={obraId} onChange={e => setObraId(e.target.value)}><option value="">Todas as obras</option>{obras.map(o => <option key={o.id_obra} value={o.id_obra}>{o.nome}</option>)}</select></label><button className="button" disabled={salvando || carregando} onClick={() => tipo === "equipes" ? onNavegar("equipes") : editar()}>{tipo === "equipes" ? "Gerenciar equipes" : "Cadastrar recurso"}</button></div>
      {carregando ? <p role="status">Carregando recursos…</p> : <div className="resource-grid">{lista.map(r => { const obra = obras.find(o => Number(o.id_obra) === Number(r.idobra)); return <article className="resource-card" key={`${tipo}-${ids[tipo](r)}`}><h2>{r.nome || r.nome_equipe}</h2><p>{obra?.nome || "Obra não informada"}</p><dl>{tipo === "insumos" ? <><dt>Disponível</dt><dd>{r.quantidade_disponivel ?? "Não informado"}</dd><dt>Valor unitário</dt><dd>{moeda(r.valor_unitario)}</dd></> : <><dt>{tipo === "equipes" ? "Profissionais" : "Quantidade"}</dt><dd>{r.quantidade_profissionais ?? r.quantidade ?? "Não informado"}</dd><dt>Etapa</dt><dd>{r.etapa_atuacao || "Não informada"}</dd><dt>Custo diário</dt><dd>{moeda(r.custo_diario)}</dd>{r.status && <><dt>Status</dt><dd>{r.status}</dd></>}</>}</dl><div className="acoes-inline"><button className="secondary-button" disabled={!obra || salvando} onClick={() => onAbrirObra(obra)}>Abrir obra</button>{tipo !== "equipes" && <><button className="secondary-button" disabled={salvando} onClick={() => editar(r)}>Editar</button><button className="cancel-button" disabled={salvando} onClick={() => excluir(r)}>Excluir</button></>}</div></article>; })}</div>}
      {!carregando && !erro && !lista.length && <p>Nenhum recurso encontrado para estes filtros.</p>}
    </section>
    {editor && <Modal title={`${editor.item ? "Editar" : "Cadastrar"} ${tipos[editor.tipo].toLowerCase()}`} onClose={() => { if (!salvando) setEditor(null); }}><form className="obra-form" onSubmit={salvar}><fieldset className="obra-form-grid" disabled={salvando} style={{ border: 0, padding: 0 }}>{campo("nome", "Nome", { maxLength: 45 })}<label className="form-group">Obra<select value={form.idobra ?? ""} required onChange={e => setForm(f => ({ ...f, idobra: e.target.value }))}><option value="">Selecione</option>{obras.map(o => <option key={o.id_obra} value={o.id_obra}>{o.nome}</option>)}</select></label>
      {editor.tipo === "insumos" ? <>{campo("quantidade_disponivel", "Quantidade disponível", { type: "number", min: 0, step: 1 })}{campo("valor_unitario", "Valor unitário (R$)", { type: "number", min: 0, step: 1 })}<p>O cadastro atual de insumos aceita apenas quantidades e valores inteiros.</p></> : <>{campo("quantidade", "Quantidade", { type: "number", min: 0, step: 1 })}{campo("custo_diario", "Custo diário (R$)", { type: "number", min: 0, step: ".01" })}<label className="form-group">Etapa<select value={form.etapa_atuacao} onChange={e => setForm(f => ({ ...f, etapa_atuacao: e.target.value }))}><option value="">Não informada</option>{ETAPAS_DIARIO.map(et => <option key={et}>{et}</option>)}</select></label><label className="form-group">Status<select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))}><option>Ativo</option><option>Inativo</option></select></label></>}
      </fieldset>{erro && <p className="auth-error" role="alert">{erro}</p>}<div className="modal-actions"><button type="button" className="cancel-button" disabled={salvando} onClick={() => setEditor(null)}>Cancelar</button><button className="button" disabled={salvando}>{salvando ? "Salvando…" : "Salvar"}</button></div></form></Modal>}
  </div></Layout>;
}
