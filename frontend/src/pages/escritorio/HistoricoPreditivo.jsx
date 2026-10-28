import GraficoHistorico from '../../componentes/escritorio/GraficoHistorico';
import {resultadoCenario} from '../../api/historicoPreditivo';
import {useEffect,useRef,useState} from 'react';
import Layout from '../../componentes/escritorio/Layout';
import {requisitar} from '../../api/api';
import './historicoPreditivo.css';
const real=v=>v===null||v===undefined?'Dados insuficientes':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
const numero=v=>v===null||v===undefined?'Dados insuficientes':Number(v).toLocaleString('pt-BR',{maximumFractionDigits:4});
const dataBR=v=>v?.split('-').reverse().join('/')||'—';
const vazio={id_obra:'',inicio:'',fim:'',fonte:'diario'};
export default function HistoricoPreditivo({onNavegar}){
 const [obras,setObras]=useState([]),[f,setF]=useState(vazio),[dados,setDados]=useState(null);
 const [metaErro,setMetaErro]=useState(''),[erro,setErro]=useState(''),[carregando,setCarregando]=useState(false),[metaLoading,setMetaLoading]=useState(true);
 const [restante,setRestante]=useState(''),[variacao,setVariacao]=useState('0');
 const controller=useRef(null),versao=useRef(0);
 useEffect(()=>{
  localStorage.setItem('pagina_atual','historico-preditivo');
  const c=new AbortController();
  requisitar('/inteligencia-operacional/filtros',{signal:c.signal}).then(meta=>{if(!c.signal.aborted){setObras(meta.obras||[]);setF({...vazio,id_obra:String(meta.obras?.[0]?.id_obra||'')});}}).catch(e=>{if(!c.signal.aborted)setMetaErro(e.message);}).finally(()=>{if(!c.signal.aborted)setMetaLoading(false);});
  return()=>{c.abort();controller.current?.abort();};
 },[]);
 async function carregar(e){
  e?.preventDefault();
  controller.current?.abort();const c=new AbortController();controller.current=c;const v=++versao.current;
  setErro('');setDados(null);setCarregando(true);setRestante('');setVariacao('0');
  try{const params=new URLSearchParams(Object.entries(f).filter(([,v])=>v));const r=await requisitar('/historico-preditivo?'+params,{signal:c.signal});if(v===versao.current&&!c.signal.aborted)setDados(r);}
  catch(e){if(v===versao.current&&!c.signal.aborted)setErro(e.message);}
  finally{if(v===versao.current&&!c.signal.aborted)setCarregando(false);}
 }
 function alterar(e){controller.current?.abort();versao.current++;setCarregando(false);setDados(null);setErro('');setF({...f,[e.target.name]:e.target.value});}
 const simulado=dados?resultadoCenario(dados.resumo.custo_ate_fim,restante,variacao):null;
 return <Layout onNavegar={onNavegar}><div className="dashboard hp-page">
  <section className="dashboard-header"><div><span className="dashboard-eyebrow">ESCRITÓRIO · MEMÓRIA E TENDÊNCIAS</span><h1>Histórico Preditivo</h1><p>Consulte a evolução registrada, acompanhe sinais de desvio e compare hipóteses de custo.</p></div></section>
  <div className="hp-notice"><strong>Análise explicável, somente de leitura.</strong> Histórico reconstruído dos registros existentes. Tendências não representam previsões validadas.</div>
  <section className="dashboard-section">
   <form onSubmit={carregar} className="hp-filtros">
    <label>Obra<select name="id_obra" value={f.id_obra} onChange={alterar} required disabled={metaLoading||!obras.length}><option value="">{metaLoading?'Carregando obras…':'Selecione'}</option>{obras.map(o=><option key={o.id_obra} value={o.id_obra}>{o.nome}</option>)}</select></label>
    <label>Fonte operacional<select name="fonte" value={f.fonte} onChange={alterar}><option value="diario">Diário de obra</option><option value="rdo">RDO estruturado</option></select></label>
    <label>Data inicial<input type="date" name="inicio" value={f.inicio} onChange={alterar} max={f.fim||undefined}/></label>
    <label>Data final<input type="date" name="fim" value={f.fim} onChange={alterar} min={f.inicio||undefined}/></label>
    <button className="button" disabled={carregando||!f.id_obra||metaLoading}>{carregando?'Consultando…':'Consultar histórico'}</button>
   </form>
   <p className="hp-caption">Fontes operacionais separadas para evitar dupla contagem. O custo acumulado inclui registros anteriores à data inicial.</p>
  </section>
  {(metaErro||erro)&&<div className="auth-error" role="alert">{metaErro||erro}</div>}
  {!metaLoading&&!obras.length&&!metaErro&&<p role="status">Nenhuma obra disponível para consulta.</p>}
  {carregando&&<p role="status">Consultando histórico da obra…</p>}
  {dados&&<>
   {dados.obra.demonstracao&&<div className="hp-notice" role="status"><strong>Obra de demonstração.</strong> Estes dados sintéticos não validam previsões reais.</div>}
   <div className="hp-result-title"><h2>{dados.obra.nome}</h2><span>Consulta: {new Date(dados.gerado_em).toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})} · Brasília</span></div>
   <section className="hp-kpis" aria-label="Resumo histórico">{[
    ['Orçamento cadastrado',real(dados.resumo.orcamento)],['Custo acumulado até a data final',real(dados.resumo.custo_ate_fim)],['Dias com registros',dados.resumo.dias_observados],['Ocorrências na fonte selecionada',dados.resumo.ocorrencias]
   ].map(([label,v])=><div key={label} className="dashboard-section"><span>{label}</span><strong>{v}</strong></div>)}</section>
   <section className="dashboard-section"><span className="section-label">COMPORTAMENTO OBSERVADO</span><h2>{dados.tendencia.situacao}</h2><p>Recorrência de dias com ocorrências: {numero(dados.tendencia.anterior)}{dados.tendencia.anterior!==null?'%':''} na primeira janela e {numero(dados.tendencia.recente)}{dados.tendencia.recente!==null?'%':''} na janela recente.</p><p className="hp-caption">São necessários seis dias documentados. Comparamos metades com o mesmo número de dias observados; lacunas não contam como dias sem ocorrências.</p>
    <div className="hp-table"><table><caption>Histórico operacional da fonte selecionada</caption><thead><tr><th>Data</th><th>Documentos</th><th>Ocorrências</th></tr></thead><tbody>{dados.operacional.length?dados.operacional.map(r=><tr key={r.data}><td>{dataBR(r.data)}</td><td>{r.documentos}</td><td>{r.ocorrencias}</td></tr>):<tr><td colSpan="3">Nenhum registro no período.</td></tr>}</tbody></table></div>
   </section>
   <div className="hp-columns">
    <section className="dashboard-section"><span className="section-label">EVOLUÇÃO FINANCEIRA</span><h2>Custos registrados</h2><GraficoHistorico serie={dados.financeiro} campo="acumulado" titulo="Evolução do custo acumulado (R$)" /><div className="hp-table"><table><caption>Custos por data e acumulado desde o início da obra</caption><thead><tr><th>Data</th><th>No dia</th><th>Acumulado</th></tr></thead><tbody>{dados.financeiro.length?dados.financeiro.map(r=><tr key={r.data}><td>{dataBR(r.data)}</td><td>{real(r.valor)}</td><td>{real(r.acumulado)}</td></tr>):<tr><td colSpan="3">Nenhum custo registrado no período.</td></tr>}</tbody></table></div></section>
    <section className="dashboard-section"><span className="section-label">EVA EXISTENTE</span><h2>IDC, IDP e EAC registrados</h2><GraficoHistorico serie={dados.eva} campo="eac" titulo="EAC registrado ao longo do tempo (R$)" /><p className="hp-caption">Valores armazenados anteriormente; a estrutura atual não certifica fórmula, autoria ou execução automática. RUP: dados insuficientes.</p><div className="hp-table"><table><caption>Indicadores existentes, incluindo registros repetidos por data</caption><thead><tr><th>Data</th><th>IDC</th><th>IDP</th><th>EAC</th></tr></thead><tbody>{dados.eva.length?dados.eva.map(r=><tr key={r.id}><td>{dataBR(r.data)}</td><td>{numero(r.idc)}</td><td>{numero(r.idp)}</td><td>{real(r.eac)}</td></tr>):<tr><td colSpan="4">Nenhum indicador registrado no período.</td></tr>}</tbody></table></div></section>
   </div>
   <section className="dashboard-section"><span className="section-label">SINAIS E CONSISTÊNCIA</span><h2>Alertas da consulta</h2>{!dados.alertas.length&&!dados.auditoria.length?<p>Nenhum sinal identificado pelas verificações disponíveis. Isso não garante ausência de riscos.</p>:<ul>{dados.alertas.map((a,i)=><li key={'a'+i}><strong>{a.tipo}: </strong>{a.mensagem}</li>)}{dados.auditoria.map((a,i)=><li key={'c'+i}><strong>Revisar dados: </strong>{a}</li>)}</ul>}</section>
   <section className="dashboard-section"><span className="section-label">SIMULAÇÃO DE CENÁRIO</span><h2>Hipótese de custo final</h2><p>Informe sua estimativa do custo restante. A variação afeta apenas esse valor; o custo já registrado permanece fixo.</p><div className="hp-filtros hp-simulation">
    <label>Custo restante estimado (R$)<input type="number" min="0" step="0.01" value={restante} onChange={e=>setRestante(e.target.value)} /></label>
    <label>Variação do custo restante (%)<input type="number" min="-100" max="1000" step="0.1" value={variacao} onChange={e=>setVariacao(e.target.value)}/></label>
    <div className="hp-scenario-result" role="status"><span>Custo final no cenário</span><strong>{real(simulado)}</strong></div>
   </div><p className="hp-caption">Cenário = custo acumulado + custo restante × (1 + variação / 100). Hipótese manual, sem previsão de prazo ou produtividade e sem salvar alterações.</p></section>
   <details className="dashboard-section"><summary>Metodologia, origem e limitações</summary><p>Versão: {dados.versao}. Isolamento por construtora e obra. Dados consultados novamente a cada atualização.</p><ul>{dados.limites.map(t=><li key={t}>{t}</li>)}</ul></details>
  </>}
 </div></Layout>;
}
