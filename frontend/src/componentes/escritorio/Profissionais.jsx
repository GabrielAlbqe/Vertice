import DetalhesHistorico from '../shared/DetalhesHistorico';
import {useEffect,useState,useRef} from 'react';
import {requisitar} from '../../api/api';
import useUnsavedChanges,{confirmarSaida} from '../shared/useUnsavedChanges';
import {PESSOAS_API,vazioProfissional,ativoProfissional,equipeProfissional,filtrarProfissionais,resumoProfissionais,formularioProfissional,mensagemErroProfissionais,salvarProfissional} from '../../api/profissionais';
const filtrosVazios=()=>({busca:'',nome:'',codigo:'',cargo:'',equipe:'',situacao:''});
const chaveEquipe=t=>(t.tipo==='terceirizada'?'terceirizada:':'interna:')+t.equipe_id;
export default function Profissionais({obra=''}){
 const [rows,setRows]=useState([]),[teams,setTeams]=useState([]),[estado,setEstado]=useState(null),[form,setForm]=useState(vazioProfissional),[baseline,setBaseline]=useState(()=>JSON.stringify(vazioProfissional()));
 const [erro,setErro]=useState(''),[sucesso,setSucesso]=useState(''),[loading,setLoading]=useState(true),[saving,setSaving]=useState(false),[revision,setRevision]=useState(0),[filtros,setFiltros]=useState(filtrosVazios),[aberto,setAberto]=useState(false),[historico,setHistorico]=useState(null);
 const lock=useRef(false),key=useRef(null),controller=useRef(null),sequence=useRef(0),formNode=useRef(null),historySequence=useRef(0),mounted=useRef(false);
 const alterado=JSON.stringify(form)!==baseline;
 useUnsavedChanges(alterado,saving);
 async function carregar(){
  controller.current?.abort();const c=new AbortController();controller.current=c;const seq=++sequence.current;
  setLoading(true);setErro('');
  try{
   const state=await requisitar(PESSOAS_API+'/estado',{signal:c.signal});
   if(typeof state?.habilitado!=='boolean'||typeof state.pode_editar!=='boolean')throw Error('Não foi possível verificar a habilitação do cadastro. Atualize a consulta.');
   if(c.signal.aborted||seq!==sequence.current)return;setEstado(state);
   if(!state.habilitado){setRows([]);setTeams([]);return;}
   const [people,catalog]=await Promise.all([requisitar(PESSOAS_API,{signal:c.signal}),requisitar('/operacional/gestao/equipes',{signal:c.signal})]);
   if(!Array.isArray(people)||!Array.isArray(catalog.equipes))throw Error('Resposta inválida na consulta de integrantes ou equipes.');
   if(c.signal.aborted||seq!==sequence.current)return;
   setRows(people);setTeams([...new Map(catalog.equipes.map(t=>[chaveEquipe(t),t])).values()]);
  }catch(e){if(!c.signal.aborted&&seq===sequence.current){setRows([]);setEstado(null);setErro(mensagemErroProfissionais(e));}}
  finally{if(!c.signal.aborted&&seq===sequence.current)setLoading(false);}
 }
 useEffect(()=>{mounted.current=true;return()=>{mounted.current=false;controller.current?.abort();historySequence.current++;};},[]);
 useEffect(()=>{carregar();return()=>controller.current?.abort();},[revision]);
 useEffect(()=>{const refresh=()=>setRevision(v=>v+1);window.addEventListener('vertice:financeiro-atualizado',refresh);return()=>window.removeEventListener('vertice:financeiro-atualizado',refresh);},[]);
 function editar(p){if(lock.current||alterado&&!confirmarSaida())return;const next=formularioProfissional(p);setForm(next);setBaseline(JSON.stringify(next));key.current=null;setAberto(true);setSucesso('');setErro('');setHistorico(null);historySequence.current++;requestAnimationFrame(()=>formNode.current?.querySelector('input')?.focus());}
 function limpar(){const next=vazioProfissional();setForm(next);setBaseline(JSON.stringify(next));key.current=null;}
 async function persistir(next,message){
  if(lock.current||!estado?.habilitado||!estado.pode_editar)return;lock.current=true;setSaving(true);setErro('');setSucesso('');
  try{
   const response=await salvarProfissional(next,key);
   if(!mounted.current)return;
   if(next===form)limpar();key.current=null;setHistorico(null);historySequence.current++;setSucesso(message||response.message||'Profissional salvo com sucesso.');
   window.dispatchEvent(new CustomEvent('vertice:profissionais-atualizados'));
   await carregar();return true;
  }catch(e){if(mounted.current)setErro(mensagemErroProfissionais(e));return false;}
  finally{lock.current=false;if(mounted.current)setSaving(false);}
 }
 async function save(e){e.preventDefault();await persistir(form);}
 async function situacao(p){if(alterado&&!confirmarSaida())return;if(!window.confirm((ativoProfissional(p)?'Desativar ':'Reativar ')+p.nome+'?'))return;const next={...formularioProfissional(p),ativo:!ativoProfissional(p)};const saved=await persistir(next,next.ativo?'Profissional reativado com sucesso.':'Profissional desativado com sucesso.');if(saved&&mounted.current)limpar();}
 async function verHistorico(p){const seq=++historySequence.current;setErro('');try{const rows=await requisitar('/operacional/gestao/operacoes/historico?recurso=pessoas&recurso_id='+p.id_profissional);if(mounted.current&&seq===historySequence.current)setHistorico({nome:p.nome,rows});}catch(e){if(mounted.current&&seq===historySequence.current)setErro(e.message);}}
 const visible=filtrarProfissionais(rows,{...filtros,obra}),resumo=resumoProfissionais(visible),disabled=loading||saving||!estado?.habilitado||!estado.pode_editar;
 const disponiveis=teams.filter(t=>t.ativo!==false&&t.ativo!==0||chaveEquipe(t)===form.equipe);
 const field=(name,value)=>setForm(f=>({...f,[name]:value}));
 const filtro=(name,value)=>setFiltros(f=>({...f,[name]:value}));
 return <section className="v3-panel profissionais-panel" aria-busy={loading||saving}>
  <div className="v3-heading"><div><span className="section-label">INTEGRANTES DAS EQUIPES</span><h2>Profissionais</h2><p>Cadastro individual da construtora, independente das contas de acesso. Cada profissional possui um código único e pode integrar uma equipe atual.</p></div><button type="button" className="secondary-button" disabled={loading||saving} onClick={()=>setRevision(v=>v+1)}>Atualizar integrantes</button></div>
  {loading&&<p role="status">Consultando integrantes…</p>}{erro&&<p role="alert" className="auth-error">{erro}</p>}{sucesso&&<p role="status">{sucesso}</p>}
  {!loading&&estado&&!estado.habilitado&&<p role="alert">O cadastro individual depende de uma atualização autorizada do banco de dados. Solicite a habilitação ao responsável pelo sistema. Os quantitativos declarados das equipes continuam disponíveis e não foram alterados.</p>}
  {!loading&&estado?.habilitado&&!estado.pode_editar&&<p>Seu perfil permite consultar os integrantes. O cadastro e as alterações são reservados ao Escritório autorizado.</p>}
  <details open={aberto} onToggle={e=>setAberto(e.currentTarget.open)}><summary>{form.id_profissional?'Editar profissional':'Cadastrar profissional'}</summary>
   <form className="profissionais-form" onSubmit={save} ref={formNode}><fieldset className="v3-filters" disabled={disabled} style={{border:0,padding:0}}>
    {[['nome','Nome',150],['codigo','Código único na construtora',50],['cargo','Cargo',100]].map(([name,label,max])=><label key={name}>{label}<input name={name} required maxLength={max} value={form[name]} onChange={e=>field(name,e.target.value)}/></label>)}
    <label>Equipe atual<select aria-label="Equipe atual do profissional" value={form.equipe} onChange={e=>field('equipe',e.target.value)}><option value="">Sem equipe</option>{disponiveis.map(t=><option key={chaveEquipe(t)} value={chaveEquipe(t)}>{t.nome_equipe} · {t.tipo==='terceirizada'?'Terceirizada':'Própria'} · {t.obra_nome||'Sem obra atribuída'}{t.ativo===false||t.ativo===0?' · Inativa':''}</option>)}{form.equipe&&!disponiveis.some(t=>chaveEquipe(t)===form.equipe)&&<option value={form.equipe}>Vínculo atual indisponível — selecione outra equipe ou desvincule</option>}</select></label>
    <label>Situação<select value={String(form.ativo)} onChange={e=>field('ativo',e.target.value==='true')}><option value="true">Ativo</option><option value="false">Inativo</option></select></label>
    <button className="button" type="submit">{saving?'Salvando…':'Salvar profissional'}</button><button className="secondary-button" type="button" onClick={limpar}>Cancelar edição</button>
   </fieldset><p>Escolha outra equipe para transferir ou “Sem equipe” para desvincular. Somente equipes da mesma construtora são aceitas.</p></form>
  </details>
  <div className="v3-filters profissionais-filtros"><label>Buscar integrante<input type="search" value={filtros.busca} onChange={e=>filtro('busca',e.target.value)} placeholder="Nome, código, cargo ou equipe"/></label>
   {[['nome','Filtrar nome'],['codigo','Filtrar código'],['cargo','Filtrar cargo']].map(([name,label])=><label key={name}>{label}<input type="search" value={filtros[name]} onChange={e=>filtro(name,e.target.value)}/></label>)}
   <label>Filtrar equipe<select aria-label="Filtrar equipe de profissionais" value={filtros.equipe} onChange={e=>filtro('equipe',e.target.value)}><option value="">Todas as equipes</option><option value="sem">Sem equipe</option>{teams.map(t=><option key={chaveEquipe(t)} value={chaveEquipe(t)}>{t.nome_equipe} · {t.tipo==='terceirizada'?'Terceirizada':'Própria'}</option>)}</select></label>
   <label>Situação do profissional<select value={filtros.situacao} onChange={e=>filtro('situacao',e.target.value)}><option value="">Todas</option><option value="ativo">Ativos</option><option value="inativo">Inativos</option></select></label><button type="button" className="secondary-button" onClick={()=>setFiltros(filtrosVazios())}>Limpar filtros de integrantes</button>
  </div>
  {!loading&&estado?.habilitado&&!erro&&<><p role="status">{resumo.total} integrantes neste recorte · {resumo.ativos} ativos · {resumo.inativos} inativos · {resumo.semEquipe} ativos sem equipe. Não somados às quantidades declaradas para evitar dupla contagem.</p>
   <div className="v3-people">{Object.entries(resumo.porEquipe).map(([key,total])=><p key={key}>{teams.find(t=>chaveEquipe(t)===key)?.nome_equipe||'Equipe '+key}: <strong>{total}</strong> integrantes ativos identificados</p>)}</div></>}
  {!loading&&estado?.habilitado&&<div className="v3-people">{visible.map(p=><article key={p.id_profissional}><h3>{p.nome}</h3><p>{p.codigo} · {p.cargo}</p><p>{p.equipe||'Sem equipe'} · {ativoProfissional(p)?'Ativo':'Inativo'}</p><p>{p.obra_nome||'Sem obra atribuída'}</p>
   <button type="button" className="secondary-button" disabled={disabled} onClick={()=>editar(p)}>Editar integrante</button><button type="button" className="secondary-button" disabled={disabled} onClick={()=>situacao(p)}>{ativoProfissional(p)?'Desativar integrante':'Reativar integrante'}</button>
   {estado.pode_editar&&<button type="button" className="secondary-button" disabled={saving||!estado.historico_habilitado} onClick={()=>verHistorico(p)}>Histórico de vínculos</button>}
  </article>)}</div>}
  {!loading&&estado?.habilitado&&!estado.historico_habilitado&&<p>O histórico de vínculos ainda depende da habilitação do histórico pelo responsável. Cadastro e edição permanecem disponíveis.</p>}
  {historico&&<div className="v4-records"><h3>Histórico de {historico.nome}</h3>{historico.rows.length?historico.rows.map(r=><article key={r.id}><h4>{r.evento}</h4><p>{r.responsavel} · {new Date(String(r.registrado_em).replace(' ','T')+'Z').toLocaleString('pt-BR',{timeZone:'America/Sao_Paulo'})}</p><DetalhesHistorico dados={r.detalhes}/></article>):<p>Nenhuma alteração registrada. Vínculos anteriores à habilitação do histórico não são reconstruídos.</p>}</div>}
  {!loading&&estado?.habilitado&&!erro&&!visible.length&&<p>Nenhum integrante individual encontrado para os filtros selecionados.</p>}
 </section>;
}
