import { useEffect, useMemo, useState } from 'react';
import Layout from '../../componentes/escritorio/Layout';
import Card from '../../componentes/escritorio/Card';
import GraficoOperacional from '../../componentes/escritorio/GraficoOperacional';
import { FILTROS_OPERACIONAIS, carregarFiltrosOperacionais, carregarInteligenciaOperacional, validarPeriodoOperacional, periodoRelativoOperacional } from '../../api/inteligenciaOperacional';
import './inteligenciaOperacional.css';

const number = value => value === null || value === undefined ? 'Dados insuficientes' : Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
const pct = value => value === null || value === undefined ? 'Dados insuficientes' : number(value) + '%';
const tipo = value => value === 'atraso' ? 'Atraso' : 'Paralisação';
const option = value => <option key={value} value={value}>{value}</option>;
function Campo({ label, children, hint }) {
  return <label className="io-field"><span>{label}</span>{children}{hint && <small>{hint}</small>}</label>;
}
function Distribuicao({ title, items, field }) {
  const max = Math.max(1, ...items.map(i => i.quantidade));
  return <section className="dashboard-section io-distribution"><h2>{title}</h2>{!items.length ? <p>Sem ocorrências no recorte.</p> : items.map(item => <div className="io-distribution-row" key={item[field]}><span>{item[field]}</span><strong>{number(item.quantidade)}</strong><div className="io-meter"><span style={{ width: item.quantidade / max * 100 + '%' }} /></div></div>)}</section>;
}
export default function InteligenciaOperacional({ onNavegar }) {
  const [draft, setDraft] = useState({ ...FILTROS_OPERACIONAIS });
  const [applied, setApplied] = useState(null);
  const [meta, setMeta] = useState(null);
  const [data, setData] = useState(null);
  const [metaLoading, setMetaLoading] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metaError,setMetaError] = useState('');
  const [validation, setValidation] = useState('');
  const [retry, setRetry] = useState(0);
  const [ranking, setRanking] = useState('quantidade');
  const [metric, setMetric] = useState('quantidade');
  const [limit, setLimit] = useState(20);
  const [factor, setFactor] = useState('');
  const [associationLimit,setAssociationLimit] = useState(40);
  const [pattern, setPattern] = useState('');
  useEffect(() => {
    const controller = new AbortController();
    setMetaLoading(true); setMetaError('');
    carregarFiltrosOperacionais({ id_obra: draft.id_obra, fonte: draft.fonte }, controller.signal).then(result => {
      if (controller.signal.aborted) return;
      setMeta(result);
      if (!draft.id_obra && result.obras.length) {
        let saved;try{saved=localStorage.getItem('vertice_io_obra_'+localStorage.getItem('id_usuario'));}catch{}
        const selected=result.obras.find(o=>String(o.id_obra)===saved)||result.obras[0];
        const initial = { ...FILTROS_OPERACIONAIS, id_obra: String(selected.id_obra), fonte: draft.fonte };
        setDraft(initial); setApplied(initial);
      }
    }).catch(e => { if (!controller.signal.aborted) { setMetaError(e.message); setData(null); } }).finally(() => { if (!controller.signal.aborted) setMetaLoading(false); });
    return () => controller.abort();
  }, [draft.id_obra, draft.fonte, retry]);
  useEffect(() => {
    if (!applied?.id_obra) return;
    const controller = new AbortController();
    setLoading(true); setData(null); setError(''); setLimit(20); setPattern('');
    carregarInteligenciaOperacional(applied, controller.signal).then(result => {
      if (!controller.signal.aborted) setData(result);
    }).catch(e => { if (!controller.signal.aborted) setError(e.message); }).finally(() => { if (!controller.signal.aborted) setLoading(false); });
    return () => controller.abort();
  }, [applied, retry]);
  const patterns = useMemo(() => [...(data?.padroes || [])].sort((a, b) => (b[ranking] ?? -Infinity) - (a[ranking] ?? -Infinity)), [data, ranking]);
  const associations = useMemo(() => (data?.associacoes || []).filter(a => (!factor || a.fator === factor) && (!pattern || a.padrao_id === pattern)), [data, factor, pattern]);
  function change(key, value) {
    setValidation('');
    if (key === 'id_obra' || key === 'fonte') {
      if(key==='id_obra')try{localStorage.setItem('vertice_io_obra_'+localStorage.getItem('id_usuario'),value);}catch{}
      const next = { ...FILTROS_OPERACIONAIS, id_obra: draft.id_obra, fonte: draft.fonte, [key]: value };
      setDraft(next); setApplied(next.id_obra ? next : null); setData(null); return;
    }
    setDraft(current => ({ ...current, [key]: value }));
  }
  function submit(e) {
    e.preventDefault();
    const message = validarPeriodoOperacional(draft);
    if (message) { setValidation(message); return; }
    setValidation(''); setApplied({ ...draft });
  }
  function clear() {
    const next = { ...FILTROS_OPERACIONAIS, id_obra: draft.id_obra, fonte: draft.fonte };
    setDraft(next); setApplied(next.id_obra ? next : null); setValidation('');
  }
  const summary = data?.resumo;
  const advancedCount = ['etapa','tipo','turno','clima','origem_atraso','origem_paralisacao'].filter(key=>draft[key]).length;
  const pendingChanges = applied && JSON.stringify(draft)!==JSON.stringify(applied);
  const demoWork = meta?.obras.find(o=>o.nome.startsWith('[DEMO]'));
  const selectedWork = meta?.obras.find(o=>String(o.id_obra)===draft.id_obra);
  function preset(days) { setValidation('');setDraft(current=>({...current,...periodoRelativoOperacional(days)})); }
  const failure = metaError || error;
  const resourceReason = meta?.motivo_recursos || 'Sem vínculo direto de ocorrência com recurso.';
  return <Layout onNavegar={onNavegar}><div className="analytics-page io-page">
    <header className="dashboard-header"><div><span className="io-eyebrow">ESCRITÓRIO · ANÁLISE DE CAMPO</span><h1>Inteligência Operacional</h1><p>Canteiro registra. O Escritório acompanha padrões, associações e evolução das ocorrências.</p></div><div className="io-header-actions"><span className="io-connection">{loading || metaLoading ? "Atualizando registros" : data && !failure ? "Registros atualizados" : "Análise por obra"}</span>{demoWork && !selectedWork?.nome.startsWith("[DEMO]") && <button className="btn-secondary" type="button" onClick={()=>change("id_obra",String(demoWork.id_obra))}>Abrir demonstração</button>}</div></header>
    {selectedWork?.nome.startsWith("[DEMO]") && <div className="io-demo-notice" role="status"><strong>Dados de demonstração</strong><span>Registros sintéticos identificados para explorar os módulos. Não representam uma obra real.</span></div>}
    <section className="dashboard-section io-filter-panel" aria-label="Filtros analíticos">
      <div className="io-filter-heading"><div><h2>Recorte da análise</h2><p>Selecione a obra e o período. Refine os demais critérios quando precisar.</p></div><span className="io-filter-tag">{draft.fonte === 'diario' ? 'Diário de obra' : 'RDO estruturado'}</span></div>
      <form onSubmit={submit}>
        <div className="io-filters io-filters-primary">
          <div className="io-work-field"><Campo label="Obra"><select aria-label="Obra" value={draft.id_obra} onChange={e => change('id_obra', e.target.value)} disabled={metaLoading && !meta}><option value="">Selecione uma obra</option>{meta?.obras.map(o => <option key={o.id_obra} value={o.id_obra}>{o.nome}</option>)}</select></Campo></div>
          <Campo label="Fonte dos registros"><select aria-label="Fonte dos registros" value={draft.fonte} onChange={e => change('fonte', e.target.value)}><option value="diario">Diário de obra (Canteiro)</option><option value="rdo">RDO estruturado</option></select></Campo>
          <Campo label="Agrupar por"><select aria-label="Agrupar por" value={draft.agrupamento} onChange={e => change('agrupamento', e.target.value)}><option value="dia">Dia</option><option value="semana">Semana (segunda a domingo)</option><option value="mes">Mês</option></select></Campo>
          <Campo label="Data inicial"><input aria-label="Data inicial" type="date" value={draft.inicio} onChange={e => change('inicio', e.target.value)} /></Campo>
          <Campo label="Data final"><input aria-label="Data final" type="date" value={draft.fim} onChange={e => change('fim', e.target.value)} /></Campo>
          <div className="io-range-presets"><span>Período rápido</span><div><button type="button" onClick={() => preset(7)}>Últimos 7 dias</button><button type="button" onClick={() => preset(30)}>Últimos 30 dias</button><button type="button" onClick={() => setDraft(current => ({ ...current, inicio: '', fim: '' }))}>Todo o período</button></div></div>
        </div>
        <details className="io-advanced"><summary>Filtros avançados <span>{advancedCount ? advancedCount + ' aplicado(s) ao formulário' : 'Etapa, tipo, turno, clima e origem'}</span></summary><div className="io-filters">
          <Campo label="Etapa-padrão"><select aria-label="Etapa-padrão" value={draft.etapa} onChange={e => change('etapa', e.target.value)}><option value="">Todas as etapas</option>{meta?.etapas.map(option)}</select></Campo>
          <Campo label="Tipo de ocorrência"><select aria-label="Tipo de ocorrência" value={draft.tipo} onChange={e => change('tipo', e.target.value)}><option value="">Todos os tipos</option><option value="atraso">Atraso</option><option value="paralisacao">Paralisação</option></select></Campo>
          <Campo label="Turno"><select aria-label="Turno" value={draft.turno} onChange={e => change('turno', e.target.value)}><option value="">Todos os turnos</option>{meta?.turnos.map(option)}</select></Campo>
          <Campo label="Clima"><select aria-label="Clima" value={draft.clima} onChange={e => change('clima', e.target.value)}><option value="">Todos os climas</option>{meta?.climas.map(option)}</select></Campo>
          <Campo label="Origem do atraso"><select aria-label="Origem do atraso" value={draft.origem_atraso} onChange={e => change('origem_atraso', e.target.value)}><option value="">Todas as origens</option>{meta?.origens.atraso.map(option)}</select></Campo>
          <Campo label="Origem da paralisação"><select aria-label="Origem da paralisação" value={draft.origem_paralisacao} onChange={e => change('origem_paralisacao', e.target.value)}><option value="">Todas as origens</option>{meta?.origens.paralisacao.map(option)}</select></Campo>
        </div></details>
        <details className="io-resource-details"><summary>Sobre os filtros por recurso</summary><p id="io-resource-reason" className="io-caption">{resourceReason}</p><div className="io-filters">
          {[['equipes', 'Equipe'], ['maquinarios', 'Maquinário'], ['insumos', 'Insumo']].map(([key, label]) => <Campo key={key} label={label}><select aria-label={label} disabled aria-describedby="io-resource-reason" value="" readOnly><option value="">Filtro indisponível</option>{meta?.recursos[key].map(r => <option key={r.id} value={r.id}>{r.nome}</option>)}</select></Campo>)}
        </div></details>
        <div className="io-actions"><button className="btn-primary" type="submit" disabled={!draft.id_obra || loading || metaLoading}>Aplicar filtros</button><button className="btn-secondary" type="button" onClick={clear} disabled={!draft.id_obra}>Limpar filtros</button><button className="btn-secondary io-refresh" type="button" onClick={() => setRetry(n => n + 1)} disabled={loading || metaLoading}>Atualizar dados</button>{pendingChanges && <span className="io-pending">Há alterações para aplicar</span>}</div>
      </form>
      {validation && <p role="alert" className="io-error">{validation}</p>}
    </section>
    {(loading || metaLoading) && <div role="status" className="analytics-notice">Carregando dados operacionais…</div>}
    {failure && <div role="alert" className="io-error"><strong>Não foi possível carregar a análise.</strong><p>{failure}</p><button type="button" className="btn-secondary" onClick={() => setRetry(n => n + 1)}>Tentar novamente</button></div>}
    {!failure && !metaLoading && meta && !meta.obras.length && <section className="dashboard-section analytics-empty">Nenhuma obra disponível para sua construtora.</section>}
    {data && !failure && <>
      <div className="io-result-heading"><h2>{data.obra.nome}</h2><p>Fonte: {applied.fonte === 'diario' ? 'Diário de obra' : 'RDO estruturado'} · {summary.registros} documento(s) · {summary.periodos_analisados} período(s) observado(s){applied.inicio ? ' · de ' + applied.inicio : ''}{applied.fim ? ' · até ' + applied.fim : ''}</p></div>
      <div className="analytics-cards io-summary-cards" aria-label="Indicadores operacionais">
        <Card title="Ocorrências registradas" value={number(summary.total_ocorrencias)} description="Contagem de registros únicos na fonte selecionada." />
        <Card title="Atrasos" value={number(summary.atrasos)} description="Registros de atraso no recorte." />
        <Card title="Paralisações" value={number(summary.paralisacoes)} description="Registros de paralisação no recorte." />
        <Card title="Recorrência" value={pct(summary.recorrencia)} description="Períodos com ocorrência / períodos com documentos." />
      </div>
      <details className="io-measurements" open={applied.fonte==="rdo"}><summary>Duração e impacto <span>{applied.fonte==="diario" ? "O diário não registra duração" : "Valores na unidade registrada"}</span></summary><div className="analytics-cards io-detail-cards">
        <Card title="Duração acumulada" value={number(summary.duracao_acumulada)} description="Unidade registrada, ainda não definida como horas ou dias." />
        <Card title="Duração dos atrasos" value={number(summary.duracao_atrasos)} description="Soma das durações dos atrasos, na unidade registrada." />
        <Card title="Duração das paralisações" value={number(summary.duracao_paralisacoes)} description="Soma das durações das paralisações, na unidade registrada." />
        <Card title="Duração média" value={number(summary.duracao_media)} description={summary.duracoes_ausentes ? summary.duracoes_ausentes + ' registro(s) sem duração válida.' : 'Duração acumulada / ocorrências.'} />
        <Card title="Impacto financeiro estimado" value="Dados insuficientes" description="Sem vínculo direto e conversão de tempo comprovados." />
      </div>
      </details>
      <nav className="io-section-nav" aria-label="Seções da análise"><a href="#io-evolucao">Evolução</a><a href="#io-padroes">Padrões</a><a href="#io-associacoes">Associações</a><a href="#io-impacto">Impacto operacional</a></nav>
      {!summary.total_ocorrencias && <section className="dashboard-section analytics-empty"><h2>Nenhuma ocorrência no recorte</h2><p>{summary.registros ? 'Há documentos registrados, mas nenhum atraso ou paralisação atende aos filtros.' : 'Não há documentos para afirmar ausência de ocorrências neste período.'}</p></section>}
      <section className="dashboard-section" id="io-evolucao"><div className="io-section-header"><div><h2>Evolução operacional</h2><p>Apenas períodos documentados. Ausência de registro não significa zero.</p></div><Campo label="Indicador do gráfico"><select aria-label="Indicador do gráfico" value={metric} onChange={e => setMetric(e.target.value)}><option value="quantidade">Quantidade de ocorrências</option><option value="duracao">Duração registrada</option></select></Campo></div><GraficoOperacional serie={data.tendencias.serie} metrica={metric} />
        <div className="io-comparisons">{[['atrasos', 'Atrasos'], ['paralisacoes', 'Paralisações'], ['duracao', 'Duração'], ['recorrencia', 'Recorrência'], ['impacto_estimado', 'Impacto estimado']].map(([key, label]) => { const c = data.tendencias.comparacoes[key]; return <div key={key}><h3>{label}</h3><strong>{c.classificacao}</strong><p>Variação: {number(c.absoluta)}{key === 'recorrencia' && c.absoluta !== null ? ' p.p.' : ''}</p><small>{c.percentual === null ? 'Sem base percentual' : pct(c.percentual)}</small></div>; })}</div>
        <p className="io-caption">Comparação dos dois últimos períodos consecutivos observados. Na série, recorrência é a proporção de dias documentados com ocorrência dentro de cada período. Classificação descritiva exige três períodos consecutivos: valores estritamente crescentes, decrescentes ou iguais; demais casos são oscilantes. Não é previsão.</p>
      </section>
      <div className="io-two-columns"><Distribuicao title="Ocorrências por etapa" items={data.etapas} field="etapa" /><Distribuicao title="Ocorrências por origem" items={data.origens} field="origem" /></div>
      <section className="dashboard-section" id="io-padroes"><div className="io-section-header"><div><h2>Padrões de improdutividade</h2><p>Frequência calculada dentro do mesmo tipo de ocorrência. Duração incompleta permanece indisponível.</p></div><Campo label="Ordenar padrões"><select aria-label="Ordenar padrões" value={ranking} onChange={e => setRanking(e.target.value)}><option value="quantidade">Mais frequentes (quantidade)</option><option value="recorrencia">Mais recorrentes (%)</option><option value="duracao_acumulada">Mais prolongados (duração)</option></select></Campo></div>
        <div className="io-table-scroll" tabIndex={0}><table><caption>{patterns.length} padrão(ões) · mostrando até {limit}</caption><thead><tr>{['Etapa', 'Origem', 'Tipo', 'Turno', 'Ocorrências', 'Frequência', 'Recorrência', 'Duração acumulada', 'Duração média'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{patterns.slice(0, limit).map(p => <tr key={p.id}><td>{p.etapa}</td><td>{p.origem}</td><td>{tipo(p.tipo)}</td><td>{p.turno}</td><td>{p.quantidade}</td><td>{pct(p.frequencia)}</td><td>{pct(p.recorrencia)}</td><td>{number(p.duracao_acumulada)}</td><td>{number(p.duracao_media)}</td></tr>)}</tbody></table></div>{patterns.length > limit && <button className="btn-secondary" type="button" onClick={() => setLimit(n => n + 20)}>Mostrar mais padrões</button>}
      </section>
      <section className="dashboard-section" id="io-associacoes"><h2>Associação operacional</h2><p>Fatores registrados no documento de origem. Associação não significa causalidade.</p>
        <div className="io-association-filters"><Campo label="Padrão analisado"><select aria-label="Padrão analisado" value={pattern} onChange={e => setPattern(e.target.value)}><option value="">Todos os padrões</option>{patterns.map(p => <option key={p.id} value={p.id}>{tipo(p.tipo) + ' · ' + p.etapa + ' · ' + p.origem + ' · ' + p.turno}</option>)}</select></Campo><Campo label="Fator registrado"><select aria-label="Fator registrado" value={factor} onChange={e => setFactor(e.target.value)}><option value="">Todos os fatores</option>{['turno', 'clima', 'etapa', 'periodo'].map(option)}</select></Campo></div>
        <div className="io-table-scroll" tabIndex={0}><table><caption>{associations.length} associação(ões) · mostrando até {associationLimit}. Refine por padrão e fator.</caption><thead><tr>{['Padrão', 'Fator', 'Valor', 'Ocorrências', 'Taxa de associação', 'Taxa por exposição'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{associations.slice(0, associationLimit).map((a, i) => <tr key={a.padrao_id + a.fator + a.valor + i}><td>{tipo(a.tipo) + ' · ' + a.etapa + ' · ' + a.origem}</td><td>{a.fator}</td><td>{a.valor}</td><td>{a.quantidade}</td><td>{pct(a.taxa_associacao)}</td><td>Dados insuficientes</td></tr>)}</tbody></table></div>
        {associations.length>associationLimit && <button type="button" className="btn-secondary" onClick={()=>setAssociationLimit(n=>n+40)}>Mostrar mais associações</button>}
        <p className="analytics-notice">Equipes, máquinas e insumos: {resourceReason} Dias de atuação e tempo de utilização do RDO não são tratados como tempo improdutivo.</p>
      </section>
      <section className="dashboard-section" id="io-impacto"><h2>Impacto operacional por etapa</h2><div className="io-table-scroll" tabIndex={0}><table><caption>Estimativas financeiras separadas dos custos realizados.</caption><thead><tr>{['Etapa', 'Ocorrências', 'Duração registrada', 'Impacto de equipes', 'Impacto de máquinas', 'Participação no impacto'].map(h => <th key={h} scope="col">{h}</th>)}</tr></thead><tbody>{data.impactos.etapas.map(e => <tr key={e.etapa}><td>{e.etapa}</td><td>{e.quantidade}</td><td>{number(e.duracao)}</td><td>Dados insuficientes</td><td>Dados insuficientes</td><td>Dados insuficientes</td></tr>)}</tbody></table></div></section>
      <details className="analytics-notice io-methodology"><summary>Como interpretar os indicadores e suas limitações</summary><ul>{data.avisos.map(a => <li key={a}>{a}</li>)}</ul><p>Frequência: grupo / total do mesmo tipo × 100. Recorrência: períodos com ocorrência / períodos com documentos × 100. Duração média: soma das durações / quantidade de ocorrências, somente com dados completos. As taxas de fatores não são categorias exclusivas.</p></details>
    </>}
  </div></Layout>;
}
