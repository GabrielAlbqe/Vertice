export default function GraficoHistorico({serie,campo,titulo}){
 const pontos=serie.filter(r=>r[campo]!==null&&r[campo]!==undefined&&Number.isFinite(Number(r[campo]))).slice(-90);
 if(!pontos.length)return <p className="hp-caption">Dados insuficientes para o gráfico.</p>;
 const max=Math.max(1,...pontos.map(r=>Math.abs(Number(r[campo]))));
 const x=i=>50+(pontos.length===1?255:i*510/(pontos.length-1)), y=v=>110-Number(v)/max*85;
 return <figure className="hp-chart"><figcaption>{titulo}</figcaption><svg viewBox="0 0 620 240" role="img" aria-label={titulo}>
  <line x1="50" y1="110" x2="565" y2="110" stroke="currentColor" opacity=".2"/>
  <text x="8" y="22">{max.toLocaleString('pt-BR',{maximumFractionDigits:0})}</text><text x="18" y="115">0</text>
  {pontos.map((r,i)=><g key={r.id||r.data}><circle cx={x(i)} cy={y(r[campo])} r="4" fill="var(--link,#1677ff)"><title>{r.data+': '+Number(r[campo]).toLocaleString('pt-BR',{maximumFractionDigits:4})}</title></circle></g>)}
  <text x="50" y="228">{pontos[0].data.split('-').reverse().join('/')}</text><text x="565" y="228" textAnchor="end">{pontos.at(-1).data.split('-').reverse().join('/')}</text>
 </svg><p className="hp-caption">Pontos observados; sem interpolação de lacunas. {serie.length>90?'Exibidos os últimos 90 pontos válidos.':'Valores completos na tabela abaixo.'}</p></figure>;
}
