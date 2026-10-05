import { useEffect, useState } from "react";
import { useCanteiro } from "../../layouts/CanteiroLayout";
import { dataCurta, formatarData, listarApontamentos, temOcorrencia } from "../../canteiro/dados";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import RegistroCard from "../../componentes/canteiro/RegistroCard";
const rotulos = { clima: "Clima", turno: "Turno", etapa_atuacao: "Etapa", equipe_interna: "Equipe interna", equipe_terceirizada: "Equipe terceirizada", paralisacoes: "Paralisações", origem_paralisacoes: "Origem das paralisações", atrasos: "Atrasos", origem_atrasos: "Origem dos atrasos" };
function DetalhesDiario({ diario }) {
  const { atividades } = useCanteiro();
  const [apontamentos, setApontamentos] = useState([]);
  const [erro, setErro] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [tentativa, setTentativa] = useState(0);
  useEffect(() => {
    const controle = new AbortController();
    setCarregando(true); setErro(""); setApontamentos([]);
    listarApontamentos(diario.id_diario, controle.signal)
      .then(lista => { if (!controle.signal.aborted) setApontamentos(lista.filter(a => String(a.diario_id) === String(diario.id_diario))); })
      .catch(e => { if (!controle.signal.aborted) { console.error("Apontamentos do diário:", e); setErro("Não foi possível carregar as atividades deste diário."); } })
      .finally(() => { if (!controle.signal.aborted) setCarregando(false); });
    return () => controle.abort();
  }, [diario.id_diario, tentativa]);
  return <section className="ct-card ct-stack"><h2>Diário de {formatarData(diario.data)}</h2><dl className="ct-facts">{Object.entries(rotulos).map(([campo, titulo]) => <div key={campo}><dt>{titulo}</dt><dd>{diario[campo] || "Não informado"}</dd></div>)}</dl><h3>Atividades executadas</h3>{carregando && <p role="status">Carregando atividades…</p>}{erro && <div role="alert" className="ct-message ct-error">{erro}<button type="button" className="ct-link" onClick={() => setTentativa(t => t + 1)}>Tentar novamente</button></div>}{apontamentos.map(a => { let foto; try { const url = new URL(a.url_foto); if (["https:", "http:"].includes(url.protocol)) foto = url.href; } catch { /* URL ausente ou inválida. */ } return <article key={a.id_apontamento} className="ct-activity-record"><strong>{atividades.find(item => String(item.id_atividade) === String(a.atividade_eap_id))?.descricao || `Atividade #${a.atividade_eap_id}`}</strong><p>Executado no dia: {a.percentual_dia}%</p>{foto && <a href={foto} target="_blank" rel="noopener noreferrer">Abrir foto publicada</a>}</article>; })}{!carregando && !erro && !apontamentos.length && <p className="ct-muted">Nenhum apontamento neste diário.</p>}</section>;
}
export default function RegistrosObra() {
  const { obra, diarios, usuario, avisos } = useCanteiro();
  const [busca, setBusca] = useState(""), [inicio, setInicio] = useState(""), [fim, setFim] = useState(""), [tipo, setTipo] = useState(""), [meus, setMeus] = useState(false), [selecionado, setSelecionado] = useState(null);
  useEffect(() => { setSelecionado(null); setBusca(""); setInicio(""); setFim(""); setTipo(""); }, [obra?.id_obra]);
  const periodoInvalido = inicio && fim && inicio > fim;
  const lista = diarios.filter(d => (!meus || String(d.usuario_id) === String(usuario.id_usuario)) && (!inicio || dataCurta(d.data) >= inicio) && (!fim || dataCurta(d.data) <= fim) && (!tipo || (tipo === "atraso" ? temOcorrencia(d.atrasos) : temOcorrencia(d.paralisacoes))) && Object.values(d).join(" ").toLocaleLowerCase("pt-BR").includes(busca.toLocaleLowerCase("pt-BR")));
  const detalhe = diarios.find(d => d.id_diario === selecionado);
  return <><div className="ct-title"><span className="ct-eyebrow">REGISTROS DA OBRA</span><h1>Histórico</h1><p>Consulte diários, ocorrências e atividades executadas.</p></div><EstadoObra><div className="ct-stack"><section className="ct-card ct-stack"><label className="ct-field">Buscar nos diários<input type="search" value={busca} onChange={e => setBusca(e.target.value)} placeholder="Etapa, clima, ocorrência…" /></label><div className="ct-grid"><label className="ct-field">De<input type="date" value={inicio} onChange={e => setInicio(e.target.value)} /></label><label className="ct-field">Até<input type="date" value={fim} onChange={e => setFim(e.target.value)} /></label></div><label className="ct-field">Tipo de ocorrência<select value={tipo} onChange={e => setTipo(e.target.value)}><option value="">Todos os diários</option><option value="atraso">Com atraso</option><option value="paralisacao">Com paralisação</option></select></label><label className="ct-check"><input type="checkbox" checked={meus} onChange={e => setMeus(e.target.checked)} />Somente meus diários</label><button type="button" className="ct-button ct-secondary" onClick={() => { setBusca(""); setInicio(""); setFim(""); setTipo(""); setMeus(false); }}>Limpar filtros</button><p className="ct-muted" role="status">{periodoInvalido ? "Período inválido" : `${lista.length} ${lista.length === 1 ? "registro encontrado" : "registros encontrados"}`}</p></section>{periodoInvalido && <p className="ct-message ct-error" role="alert">A data inicial deve ser anterior à data final.</p>}{detalhe && <><button type="button" className="ct-button ct-secondary" onClick={() => setSelecionado(null)}>Fechar detalhes</button><DetalhesDiario key={detalhe.id_diario} diario={detalhe} /></>}{!periodoInvalido && lista.map(d => <RegistroCard key={d.id_diario} diario={d} onAbrir={() => setSelecionado(d.id_diario)} />)}{!periodoInvalido && !avisos.some(a => a.includes("diários")) && !lista.length && <p className="ct-card ct-muted">Nenhum registro disponível para estes filtros.</p>}</div></EstadoObra></>;
}
