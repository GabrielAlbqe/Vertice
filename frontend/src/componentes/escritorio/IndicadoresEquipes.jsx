const icons = {
  equipes: <><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8 9h8M8 13h3M15 13h1M8 17h8"/></>,
  profissionais: <><circle cx="9" cy="8" r="3"/><path d="M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6M21 20v-2a6 6 0 0 0-4-5"/></>,
  custo: <><rect x="2" y="5" width="20" height="14" rx="3"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/></>,
};
export default function IndicadoresEquipes({total, profissionais, custo, carregando, erro}) {
  const items = [
    ['equipes', 'Equipes cadastradas', total, 'Próprias no recorte selecionado.'],
    ['profissionais', 'Profissionais declarados', profissionais ?? 'Não informado', 'Quantidades informadas nas equipes.'],
    ['custo', 'Custo diário total', custo == null ? 'Não informado' : custo.toLocaleString('pt-BR', {style:'currency', currency:'BRL'}), 'Diárias das equipes selecionadas.'],
  ];
  return <section className="equipes-indicadores" aria-label="Indicadores das equipes próprias" aria-busy={carregando}>
    <p className="equipes-scope">Equipes próprias <span aria-hidden="true">·</span> Indicadores conforme os filtros. Terceirizadas na seção abaixo.</p>
    {carregando && <span className="sr-only" role="status">Atualizando indicadores das equipes…</span>}
    <dl className="equipes-kpis">{items.map(([key, title, value, description]) => <div className="equipes-kpi" key={key}>
      <dt><span className="equipes-kpi-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{icons[key]}</svg></span><span>{title}</span></dt>
      <dd>{carregando ? <span className="equipes-kpi-skeleton" aria-hidden="true"/> : erro ? 'Indisponível' : value}</dd>
      <p>{description}</p>
    </div>)}</dl>
  </section>;
}
