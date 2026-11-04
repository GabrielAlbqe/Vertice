import { useState } from 'react';
import useRegistro from '../../canteiro/useRegistro';
import { ETAPAS_DIARIO, hoje, salvarDiario } from '../../canteiro/dados';
import EstadoObra from '../../componentes/canteiro/EstadoObra';
import { Campo, Mensagens, AcoesRegistro } from '../../componentes/canteiro/FormularioBase';
const inicial = () => ({ data: hoje(), clima: '', turno: '', etapa_atuacao: '', equipes: [], terceirizadas: [], maquinarios: [], observacoes: '', paralisacoes: '', origem_paralisacoes: '', atrasos: '', origem_atrasos: '' });
export default function DiarioObra() {
  const r = useRegistro('diario', inicial), { form, campo, ctx } = r;
  const [passo, setPasso] = useState(0);
  function validar() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data) || !Number.isFinite(Date.parse(form.data)) || new Date(form.data).toISOString().slice(0,10) !== form.data || form.data > hoje()) throw new Error('Informe uma data válida até hoje.');
    if (!['Ensolarado','Chuvoso'].includes(form.clima) || !['Manhã','Tarde','Noite'].includes(form.turno) || !ETAPAS_DIARIO.includes(form.etapa_atuacao)) throw new Error('Preencha clima, turno e etapa.');
    if (ctx.diarios.some(d => String(d.usuario_id) === String(ctx.usuario.id_usuario) && String(d.data).slice(0,10) === form.data && d.turno === form.turno)) throw new Error('Já existe um diário seu nesta data e turno. Consulte o histórico.');
  }
  const props = {form,campo,disabled:r.salvando};
  function selecionar(tipo, id, checked) { const items = form[tipo] || []; campo(tipo, checked ? [...items,Number(id)] : items.filter(x => Number(x) !== Number(id))); }
  const steps = ['Dia e etapa','Presenças e recursos','Ocorrências e notas'];
  return <><div className="ct-title"><span className="ct-eyebrow">REGISTRO DE CAMPO</span><h1>Diário de Obra</h1><p>Registre o turno. Atividades e materiais podem ser vinculados a este diário após a confirmação.</p></div><EstadoObra><form className="ct-stack" onSubmit={e => r.enviar(e,validar,salvarDiario,{...form,obrax_id:Number(ctx.obra?.id_obra)})}>
    <nav className="ct-steps" aria-label="Etapas do diário">{steps.map((s,i)=><button key={s} type="button" disabled={r.salvando} aria-current={passo===i?'step':undefined} onClick={()=>setPasso(i)}><span>{i+1}</span>{s}</button>)}</nav>
    <section className="ct-card ct-stack"><h2>{steps[passo]}</h2>
      {passo===0 && <><Campo {...props} nome="data" titulo="Data" type="date" max={hoje()} /><Campo {...props} nome="clima" titulo="Clima" opcoes={['Ensolarado','Chuvoso']} /><Campo {...props} nome="turno" titulo="Turno" opcoes={['Manhã','Tarde','Noite']} /><Campo {...props} nome="etapa_atuacao" titulo="Etapa" opcoes={ETAPAS_DIARIO} /></>}
      {passo===1 && <><h3>Equipes presentes</h3>{ctx.recursos.equipes.map(e=>{ const externa=e.origem==='terceirizada' || Boolean(e.id_equipe_terceirizada), key=externa?'terceirizadas':'equipes', id=e.id_equipe_terceirizada || e.id_cadastro_equipes; return <label className="ct-check" key={`${key}-${id}`}><input type="checkbox" disabled={r.salvando} checked={(form[key] || []).some(x=>Number(x)===Number(id))} onChange={event=>selecionar(key,id,event.target.checked)} />{e.nome_equipe}{externa?' (terceirizada)':''}</label>;})}{!ctx.recursos.equipes.length && <p>Nenhuma equipe vinculada à obra.</p>}<h3>Maquinários utilizados</h3>{ctx.recursos.maquinarios.map(m=><label className="ct-field" key={m.id_maquina}>{m.nome} · disponível: {m.quantidade ?? 'não informado'}<input type="number" min="0" max={m.quantidade ?? undefined} step="1" disabled={r.salvando} value={(form.maquinarios || []).find(x=>x.id===m.id_maquina)?.quantidade || ''} placeholder="Quantidade usada" onChange={e=>campo('maquinarios',[...(form.maquinarios || []).filter(x=>x.id!==m.id_maquina),...(Number(e.target.value)>0?[{id:m.id_maquina,quantidade:Number(e.target.value)}]:[])])} /></label>)}{!ctx.recursos.maquinarios.length && <p>Nenhum maquinário vinculado.</p>}</>}
      {passo===2 && <><Campo {...props} nome="paralisacoes" titulo="Paralisações" multiline maxLength={10000} /><Campo {...props} nome="origem_paralisacoes" titulo="Motivo da paralisação" maxLength={255} /><Campo {...props} nome="atrasos" titulo="Atrasos" multiline maxLength={10000} /><Campo {...props} nome="origem_atrasos" titulo="Motivo do atraso" maxLength={255} /><Campo {...props} nome="observacoes" titulo="Observações gerais e serviços realizados" multiline maxLength={10000} /></>}
    </section><div className="ct-row">{passo>0 && <button className="ct-button ct-secondary" type="button" onClick={()=>setPasso(p=>p-1)}>Anterior</button>}{passo<2 && <button className="ct-button" type="button" onClick={()=>setPasso(p=>p+1)}>Próximo</button>}</div><Mensagens erro={r.erro} mensagem={r.mensagem} /><AcoesRegistro registro={r} />
  </form></EstadoObra></>;
}
