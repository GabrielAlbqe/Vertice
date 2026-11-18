import ProgressoAtividades from '../../componentes/canteiro/ProgressoAtividades';
import useRegistro from '../../canteiro/useRegistro';
import { salvarAtividade, formatarData } from '../../canteiro/dados';
import { progressoAtividades } from '../../canteiro/progresso';
import EstadoObra from '../../componentes/canteiro/EstadoObra';
import { Campo, Mensagens, AcoesRegistro } from '../../componentes/canteiro/FormularioBase';
import ProgressBar from '../../componentes/canteiro/ProgressBar';
const inicial=()=>({diario_id:'',atividade_eap_id:'',percentual_dia:'',url_foto:''});
export default function RegistrarAtividade(){
 const r=useRegistro('atividade',inicial),{ctx,form,campo}=r;
 const diario=ctx.diarios.find(d=>String(d.id_diario)===String(form.diario_id));
 const atividade=progressoAtividades(ctx.atividades,ctx.apontamentos).find(a=>String(a.id_atividade)===String(form.atividade_eap_id));
 const indisponivel=ctx.avisos.some(a=>a.includes('apontamentos')||a.includes('diários'));
 const acumulado=atividade&&!indisponivel?(atividade.estado==='Sem apontamento'?0:atividade.total):null;
 const restante=acumulado===null?null:Math.max(0,Math.round((100-acumulado)*100)/100);
 function validar(){
  if(!diario)throw Error('Selecione um diário desta obra.');
  if(!atividade)throw Error('Selecione uma atividade desta obra.');
  if(form.percentual_dia===''||!Number.isFinite(Number(form.percentual_dia))||Number(form.percentual_dia)<=0||Number(form.percentual_dia)>100)throw Error('Informe um progresso maior que zero e de até 100%.');
  if(restante!==null&&Number(form.percentual_dia)>restante+0.00001)throw Error('O avanço ultrapassaria 100%. O saldo desta atividade é '+restante+'%.');
  if(form.url_foto){let url;try{url=new URL(form.url_foto);}catch{throw Error('Informe um endereço válido para a foto.');}if(!['http:','https:'].includes(url.protocol))throw Error('Use um endereço HTTP ou HTTPS para a foto.');}
 }
 return <><div className="ct-title"><span className="ct-eyebrow">EVOLUÇÃO FÍSICA</span><h1>Registrar atividade</h1><p>Vincule o serviço ao diário e informe somente o avanço executado naquele dia.</p></div><EstadoObra><form className="ct-stack" onSubmit={e=>r.enviar(e,validar,salvarAtividade,{obra_id:Number(ctx.obra?.id_obra),percentual_dia:Number(form.percentual_dia),diario_id:Number(form.diario_id),atividade_eap_id:Number(form.atividade_eap_id),url_foto:form.url_foto.trim()})}>
 <section className="ct-card ct-stack"><h2>Obra e responsável</h2><dl className="ct-resource-summary"><div><dt>Obra</dt><dd>{ctx.obra?.nome}</dd></div><div><dt>Responsável pelo envio</dt><dd>{ctx.usuario.nome||'Usuário autenticado'}</dd></div></dl></section>
 <section className="ct-card ct-stack"><h2>Diário relacionado</h2><label className="ct-field">Diário de Obra (obrigatório)<select required value={form.diario_id} disabled={r.salvando||ctx.carregando} onChange={e=>campo('diario_id',e.target.value)}><option value="">Selecione um diário</option>{ctx.diarios.map(d=><option key={d.id_diario} value={d.id_diario}>{formatarData(d.data)} · {d.turno} · #{d.id_diario}</option>)}</select></label>{diario&&<dl className="ct-resource-summary"><div><dt>Data da execução</dt><dd>{formatarData(diario.data)}</dd></div><div><dt>Turno</dt><dd>{diario.turno}</dd></div><div><dt>Clima</dt><dd>{diario.clima||'Não informado'}</dd></div><div><dt>Etapa</dt><dd>{diario.etapa_atuacao||'Não informada'}</dd></div></dl>}<button type="button" className="ct-button ct-secondary" disabled={r.salvando} onClick={()=>ctx.onNavegar('canteiro-diario')}>Criar Diário de Obra</button>{!ctx.carregando&&!ctx.diarios.length&&<p>Cadastre um diário antes de registrar a atividade.</p>}</section>
 <section className="ct-card ct-stack"><h2>Serviço executado</h2><label className="ct-field">Atividade da obra (obrigatório)<select required value={form.atividade_eap_id} disabled={r.salvando||ctx.carregando} onChange={e=>campo('atividade_eap_id',e.target.value)}><option value="">Selecione uma atividade</option>{ctx.atividades.map(a=><option key={a.id_atividade} value={a.id_atividade}>{a.descricao}</option>)}</select></label>{!ctx.carregando&&!ctx.atividades.length&&<p>Não há atividades cadastradas nesta obra. Solicite o cadastro ao Escritório.</p>}{atividade&&<><p className="ct-prewrap"><strong>{atividade.descricao}</strong></p><dl className="ct-resource-summary"><div><dt>Avanço já registrado</dt><dd>{acumulado===null?'Indisponível':acumulado+'%'}</dd></div><div><dt>Restante para conclusão</dt><dd>{restante===null?'Indisponível':restante+'%'}</dd></div></dl></>}<Campo form={form} campo={campo} disabled={r.salvando} nome="percentual_dia" titulo="Avanço executado no dia (%) — obrigatório" type="number" required min="0.01" max={restante===null?100:restante} step="0.01" inputMode="decimal"/><ProgressBar valor={form.percentual_dia}/><p className="ct-muted">Informe o percentual adicional, não o acumulado. O servidor confere o limite total antes de confirmar o registro.</p></section>
 <section className="ct-card ct-stack"><h2>Foto e informações complementares</h2><Campo form={form} campo={campo} disabled={r.salvando} nome="url_foto" titulo="Endereço de foto já publicada (opcional)" type="url" maxLength={512}/><p className="ct-muted">Registre os detalhes dos serviços, atrasos e paralisações no diário. Para enviar uma foto do dispositivo, utilize o registro de fotos da obra.</p><button type="button" className="ct-button ct-secondary" disabled={r.salvando} onClick={()=>ctx.onNavegar('canteiro-foto')}>Registrar foto da obra</button></section>
 <Mensagens erro={r.erro} mensagem={r.mensagem}/><AcoesRegistro registro={r}/></form><ProgressoAtividades atividades={ctx.atividades} apontamentos={ctx.apontamentos} indisponivel={indisponivel}/></EstadoObra></>;
}
