const number = value => Number(value).toLocaleString('pt-BR', { maximumFractionDigits: 2 });
export default function GraficoOperacional({ serie, metrica = 'quantidade' }) {
  const points = serie.slice(-120), duration = metrica === 'duracao';
  const max = Math.max(1, ...points.map(p => duration ? p.duracao || 0 : p.quantidade));
  if (!points.length || (duration && points.every(p => p.duracao === null))) return <div className="analytics-empty">Dados insuficientes para este gráfico.</div>;
  const width = Math.max(620, points.length * 52 + 100), baseline = 190, height = 275;
  return <div>
    <div className="io-chart-scroll" tabIndex={0} aria-label="Gráfico rolável por período">
      <svg viewBox={'0 0 ' + width + ' ' + height} style={{ minWidth: width }} role="img" aria-label={duration ? 'Duração registrada por período, unidade não definida' : 'Atrasos e paralisações por período observado'}>
        <line x1="48" y1={baseline} x2={width - 15} y2={baseline} className="io-gridline" />
        {[0, .5, 1].map(t => <g key={t}><line x1="48" y1={baseline - t * 155} x2={width - 15} y2={baseline - t * 155} className="io-gridline" /><text x="40" y={baseline - t * 155 + 4} textAnchor="end">{number(max * t)}</text></g>)}
        {points.map((p, i) => {
          const x = 66 + i * (width - 100) / points.length, h = n => n / max * 155;
          return <g key={p.periodo}>
            {duration ? p.duracao === null ? <text x={x} y={baseline - 8}>?</text> :
              <rect x={x} y={baseline - h(p.duracao)} width="22" height={h(p.duracao)} className="io-bar-atraso"><title>{p.periodo + ': ' + number(p.duracao) + ' na unidade registrada'}</title></rect> :
              <><rect x={x} y={baseline - h(p.quantidade)} width="22" height={h(p.atrasos)} className="io-bar-atraso"><title>{p.periodo + ': ' + p.atrasos + ' atraso(s)'}</title></rect><rect x={x} y={baseline - h(p.paralisacoes)} width="22" height={h(p.paralisacoes)} className="io-bar-paralisacao"><title>{p.periodo + ': ' + p.paralisacoes + ' paralisação(ões)'}</title></rect></>}
            <text x={x + 11} y={baseline + 15} transform={'rotate(-45 ' + (x + 11) + ' ' + (baseline + 15) + ')'} textAnchor="end">{p.periodo.split('-').reverse().join('/')}</text>
          </g>;
        })}
      </svg>
    </div>
    <p className="io-caption">{duration ? 'Valores na unidade registrada; “?” indica duração indisponível.' : 'Azul: atrasos · Verde: paralisações. Apenas períodos com documentos são exibidos.'}{serie.length > 120 ? ' Gráfico limitado aos 120 períodos observados mais recentes.' : ''}</p>
  </div>;
}
