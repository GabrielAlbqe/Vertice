import {useEffect,useState} from 'react';
import {requisitar} from '../../api/api';
import Profissionais from './Profissionais';
export default function EquipesExternas({obra='',equipes=[]}) {
  const [rows,setRows]=useState([]),[error,setError]=useState(''),[search,setSearch]=useState(''),[revision,setRevision]=useState(0);
  useEffect(()=>{const c=new AbortController();requisitar('/equipes-terceirizadas',{signal:c.signal}).then(r=>{if(!Array.isArray(r))throw Error('Resposta inválida.');setRows(r);setError('');}).catch(e=>{if(!c.signal.aborted)setError(e.message);});return()=>c.abort();},[revision]);
  const external=rows.map(e=>({...e,origem:'terceirizada'}));
  const visible=external.filter(e=>(!obra||String(e.id_obra)===String(obra))&&e.nome_equipe.toLocaleLowerCase().includes(search.toLocaleLowerCase()));
  return <><section className="v3-panel"><div className="v3-heading"><div><span className="section-label">RECURSOS TERCEIRIZADOS</span><h2>Equipes terceirizadas</h2><p>{external.length} cadastros na construtora. O filtro de obra mostra apenas as equipes atribuídas à obra selecionada. Quantidade individual e custo mensal não são informados no cadastro legado.</p></div><button className="secondary-button" type="button" onClick={()=>setRevision(v=>v+1)}>Atualizar terceirizadas</button></div>{error&&<p className="auth-error" role="alert">{error}</p>}<label className="v3-search">Buscar terceirizada<input type="search" value={search} onChange={e=>setSearch(e.target.value)}/></label><div className="v3-people">{visible.map(e=><article key={e.id_equipe_terceirizada}><h3>{e.nome_equipe}</h3><p>Obra #{e.id_obra}</p><strong>{Number(e.custo_diario_total).toLocaleString('pt-BR',{style:'currency',currency:'BRL'})} / dia</strong></article>)}</div>{!error&&!visible.length&&<p>Nenhuma equipe terceirizada neste recorte.</p>}</section><Profissionais obra={obra} equipes={[...equipes,...external]}/></>;
}
