import {useEffect,useState} from 'react';
import {resumirEquipes,somarRecursos} from '../../api/obraIndicadores';
import {carregarAnalytics} from '../../api/analytics';
import {normalizarAnalytics,calcularAnalytics} from '../../api/analyticsCalculos';
import {requisitar} from '../../api/api';
const money=v=>v===null?'Não informado':Number(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
export default function IndicadoresObra({obra,equipes,insumos,maquinarios}) {
  const [finance,setFinance]=useState(null),[error,setError]=useState(''),[revision,setRevision]=useState(0);
  const [members,setMembers]=useState(null);
  const teams=resumirEquipes(equipes);
  useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener('vertice:financeiro-atualizado',refresh);window.addEventListener('vertice:profissionais-atualizados',refresh);return()=>{window.removeEventListener('vertice:financeiro-atualizado',refresh);window.removeEventListener('vertice:profissionais-atualizados',refresh);};},[]);
  useEffect(()=>{const c=new AbortController();setFinance(null);setError('');carregarAnalytics(obra.id_obra,c.signal).then(r=>setFinance(calcularAnalytics(normalizarAnalytics(r)))).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[obra.id_obra,revision]);
  useEffect(()=>{const c=new AbortController();setMembers(null);requisitar('/operacional/gestao/pessoas',{signal:c.signal}).then(rows=>{if(!Array.isArray(rows))throw Error('Resposta inválida.');if(!c.signal.aborted)setMembers([...new Map(rows.filter(p=>p.ativo&&String(p.id_obra)===String(obra.id_obra)).map(p=>[p.id_profissional,p])).values()]);}).catch(()=>{});return()=>c.abort();},[obra.id_obra,revision]);
  const groups=[['Recursos humanos','◎',[
    ['Profissionais identificados',members?.length??null,'Pessoas ativas no cadastro individual; não somadas ao quantitativo declarado. Indisponível enquanto o cadastro não estiver habilitado.'],
    ['Profissionais declarados',teams.profissionais,'Total disponível apenas com quantidade informada em todas as equipes.'],
    ['Próprios',teams.profissionaisProprios,'Quantidade declarada nas equipes próprias.'],['Terceirizados',teams.profissionaisTerceirizados,'As equipes terceirizadas legadas não informam quantidade.'],
    ['Equipes próprias',teams.proprias],['Equipes terceirizadas',teams.terceirizadas],['Total de equipes atribuídas',teams.total]]],
    ['Equipamentos e materiais','▤',[
      ['Maquinários atribuídos',maquinarios.length,'Cadastros de equipamentos vinculados à obra.'],['Unidades de máquinas',somarRecursos(maquinarios,'quantidade')],['Máquinas / dia',money(somarRecursos(maquinarios,'quantidade','custo_diario'))],['Insumos vinculados',insumos.length],['Valor do estoque vinculado',money(somarRecursos(insumos,'quantidade_disponivel','valor_unitario')),'Estoque não representa despesa realizada.']]],
    ['Financeiro','◇',[
      ['Orçamento da obra',obra.orcamento_planejado==null?'Não informado':money(obra.orcamento_planejado)],['Equipes / dia',money(teams.custoDiario)],['Equipes / mês',money(teams.custoMensal),'Indisponível se alguma equipe não tiver custo mensal.'],['Custos previstos',finance?money(finance.planejado):'—'],['Custos realizados',finance?money(finance.realizado):'—'],['Realizado − previsto',finance?money(finance.desvio):'—','Mesma obra e recorte global; não inclui valores estimados de recursos.']]]];
  return <section className="v3-indicators"><div className="v3-heading"><div><span className="section-label">ANÁLISE DA OBRA</span><h2>Indicadores</h2><p>Somente recursos atribuídos a esta obra. Acessos ao sistema não são profissionais da obra.</p></div><button type="button" className="secondary-button" onClick={()=>setRevision(v=>v+1)}>Atualizar indicadores</button></div>
  {error&&<p className="auth-error" role="alert">{error}</p>}{finance?.avisos?.length>0&&<details><summary>Sobre os indicadores financeiros</summary>{finance.avisos.map(a=><p key={a}>{a}</p>)}</details>}
  {groups.map(([title,icon,items])=><section className="v3-group" key={title}><h3><span aria-hidden="true">{icon}</span> {title}</h3><dl className="v3-metrics">{items.map(([label,value,note])=><div key={label}><dt>{label}</dt><dd>{value??'Não informado'}</dd>{note&&<small>{note}</small>}</div>)}</dl></section>)}
  <p className="v3-note">Quantitativos declarados por equipe não identificam pessoas. O cadastro individual permite consultar integrantes sem somar a mesma pessoa novamente. Quantidades de insumos com unidades diferentes não são somadas.</p></section>;
}
