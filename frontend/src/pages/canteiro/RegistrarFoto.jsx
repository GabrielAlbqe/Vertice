import { useEffect,useRef,useState } from 'react';
import { useCanteiro } from '../../layouts/CanteiroLayout';
import { enviarFoto,chaveEnvio } from '../../api/operacional';
import useUnsavedChanges from '../../componentes/shared/useUnsavedChanges';
import EstadoObra from '../../componentes/canteiro/EstadoObra';
import GaleriaFotos from '../../componentes/canteiro/GaleriaFotos';
export default function RegistrarFoto() {
  const ctx=useCanteiro(),[fila,setFila]=useState([]),[atividade,setAtividade]=useState(''),[descricao,setDescricao]=useState(''),[preview,setPreview]=useState(''),[erro,setErro]=useState(''),[mensagem,setMensagem]=useState(''),[salvando,setSalvando]=useState(false),[revisao,setRevisao]=useState(0);
  const arquivo=fila[0]?.arquivo;
  const key=useRef(chaveEnvio()),trava=useRef(false),montado=useRef(true),obra=useRef(ctx.obra?.id_obra),iniciado=useRef(false);
  obra.current=ctx.obra?.id_obra;
  useUnsavedChanges(Boolean(arquivo || descricao),salvando);
  useEffect(()=>{montado.current=true;return()=>{montado.current=false;};},[]);
  useEffect(()=>{setFila([]);setDescricao('');setAtividade('');setErro('');setMensagem('');iniciado.current=false;key.current=chaveEnvio();},[ctx.obra?.id_obra]);
  useEffect(()=>{if(!arquivo){setPreview('');return;}const url=URL.createObjectURL(arquivo);setPreview(url);return()=>URL.revokeObjectURL(url);},[arquivo]);
  function escolher(e){const files=[...(e.target.files||[])];e.target.value='';if(!files.length)return;setErro('');setMensagem('');
    if(files.length>10||files.reduce((n,f)=>n+f.size,0)>20*1024*1024||files.some(f=>!['image/jpeg','image/png','image/webp'].includes(f.type)||f.size>5*1024*1024||!f.size)){setErro('Selecione até 10 fotos JPEG, PNG ou WebP de até 5 MB cada e 20 MB no total.');return;}
    const unique=new Map(files.map(f=>[f.name+':'+f.size+':'+f.lastModified,f]));setFila([...unique.values()].map(arquivo=>({arquivo,chave:chaveEnvio()})));iniciado.current=false;key.current=chaveEnvio();}
  async function enviar(e){e.preventDefault();if(trava.current)return;setErro('');setMensagem('');const work=ctx.obra?.id_obra;
    if(!arquivo || !descricao.trim() || descricao.trim().length>1000){setErro('Selecione a foto e descreva a imagem em até 1000 caracteres.');return;}
    if(!ctx.online){setErro('Sem conexão. A imagem está apenas em memória; mantenha esta tela aberta e envie manualmente ao reconectar.');return;}
    trava.current=true;setSalvando(true);iniciado.current=true;
    try{let duplicadas=0;for(let i=0;i<fila.length;i++){
      const item=fila[i],r=await enviarFoto(work,descricao.trim(),item.arquivo,item.chave,atividade);if(!r?.insertId)throw new Error('Confirmação inválida.');if(r.deduplicada)duplicadas++;
      if(montado.current && obra.current===work){setFila(rest=>rest.filter(f=>f.chave!==item.chave));setMensagem(`Foto ${i+1} de ${fila.length} confirmada.`);setRevisao(v=>v+1);}
    }
    if(montado.current && obra.current===work){setDescricao('');setMensagem(fila.length===1?'Foto enviada e confirmada pelo servidor.':`${fila.length} fotos confirmadas pelo servidor.`);if(duplicadas)setMensagem(m=>m+` ${duplicadas} imagem(ns) já existia(m); registros originais preservados.`);key.current=chaveEnvio();iniciado.current=false;}}
    catch(err){if(montado.current && obra.current===work){
      if([400,401,403,404,413,415,422].includes(err.status)){
        iniciado.current=false;
        setFila(rest=>rest.map(item=>({...item,chave:chaveEnvio()})));
      }
      setErro(err.status?err.message:'Não foi possível confirmar o envio. Consulte a galeria; repetir o mesmo envio usa a mesma chave para evitar duplicidade.');
    }}
    finally{trava.current=false;if(montado.current)setSalvando(false);}
  }
  return <><div className="ct-title"><span className="ct-eyebrow">FOTOS DE CAMPO</span><h1>Registrar foto</h1><p>Imagens privadas, vinculadas à obra e ao usuário responsável.</p></div><EstadoObra><div className="ct-stack"><form className="ct-card ct-stack" onSubmit={enviar}><h2>Nova foto</h2><label className="ct-field">Atividade (opcional)<select value={atividade} disabled={salvando || iniciado.current} onChange={e=>setAtividade(e.target.value)}><option value="">Sem vínculo com atividade</option>{ctx.atividades.map(a=><option key={a.id_atividade} value={a.id_atividade}>{a.descricao}</option>)}</select></label><label className="ct-field">Selecionar da galeria<input type="file" accept="image/jpeg,image/png,image/webp" multiple disabled={salvando || iniciado.current} onChange={escolher} /></label><label className="ct-field">Capturar pela câmera<input type="file" accept="image/jpeg,image/png,image/webp" capture="environment" disabled={salvando || iniciado.current} onChange={escolher} /></label>{!!fila.length && <p role="status">{fila.length} foto(s) na fila. Envio sequencial; somente as não confirmadas permanecem para repetição manual.</p>}{preview && <div className="ct-photo"><img src={preview} alt="Prévia local da foto a enviar" /></div>}<label className="ct-field">Descrição da imagem<textarea required maxLength={1000} rows="3" value={descricao} disabled={salvando || iniciado.current} onChange={e=>setDescricao(e.target.value)} /></label><p className="ct-muted">Até 10 fotos, 5 MB por foto e 20 MB no total. Mesma descrição para o lote. A imagem não fica em rascunhos. Sem conexão, mantenha a tela aberta; ao sair, será necessário selecionar o arquivo novamente.</p>{erro && <p role="alert" className="ct-message ct-error">{erro}</p>}{mensagem && <p role="status" className="ct-message">{mensagem}</p>}<button type="submit" className="ct-button" disabled={salvando || ctx.carregando || !ctx.online || !arquivo}>{salvando?'Enviando foto…':'Enviar foto'}</button>{arquivo && <button type="button" className="ct-button ct-secondary" disabled={salvando} onClick={()=>{setFila([]);setDescricao('');iniciado.current=false;key.current=chaveEnvio();setErro('');}}>Descartar seleção local</button>}</form><GaleriaFotos atividades={ctx.atividades} obra={ctx.obra?.id_obra} revisao={revisao} /></div></EstadoObra></>;
}
