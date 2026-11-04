import {useEffect,useState,useId} from 'react';
import {requisitar} from '../../api/api';
export default function CamposOcorrencia({form,campo,disabled=false}){
  const uid=useId();
  const [usuarios,setUsuarios]=useState([]),[erro,setErro]=useState('');
  useEffect(()=>{const c=new AbortController();requisitar('/operacional/gestao/responsaveis',{signal:c.signal}).then(r=>{if(!c.signal.aborted)setUsuarios(r);}).catch(()=>{if(!c.signal.aborted)setErro('Não foi possível consultar os responsáveis. Atualize a tela para atribuir um encarregado.');});return()=>c.abort();},[]);
  return <div className="gestao-filtros"><label>Classificação (opcional)<input id={`${uid}-classificacao`} maxLength={100} value={form.classificacao||''} disabled={disabled} onChange={e=>campo('classificacao',e.target.value)}/></label><label>Encarregado (opcional)<select id={`${uid}-responsavel`} value={form.responsavel_id||''} disabled={disabled} onChange={e=>campo('responsavel_id',e.target.value)}><option value="">Não atribuído</option>{usuarios.map(u=><option key={u.id_usuario} value={u.id_usuario}>{u.nome}</option>)}</select></label><label>Prazo previsto (opcional)<input id={`${uid}-prazo`} type="date" value={form.prazo_previsto||''} disabled={disabled} onChange={e=>campo('prazo_previsto',e.target.value)}/></label>{erro&&<p role="status">{erro}</p>}</div>;
}
