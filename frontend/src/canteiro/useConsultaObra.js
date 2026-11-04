import { useEffect, useState } from 'react';
export default function useConsultaObra(obra, consultar, revisao = 0) {
  const [dados,setDados]=useState([]),[erro,setErro]=useState(''),[carregando,setCarregando]=useState(false),[tentativa,setTentativa]=useState(0);
  useEffect(()=>{
    const controller=new AbortController();setDados([]);setErro('');
    if(!obra){setCarregando(false);return;}
    setCarregando(true);
    consultar(obra,controller.signal).then(rows=>{if(!controller.signal.aborted)setDados(rows);}).catch(e=>{if(!controller.signal.aborted)setErro(e.message || 'Falha ao consultar registros.');}).finally(()=>{if(!controller.signal.aborted)setCarregando(false);});
    return()=>controller.abort();
  },[obra,consultar,revisao,tentativa]);
  return {dados,erro,carregando,atualizar:()=>setTentativa(t=>t+1)};
}
