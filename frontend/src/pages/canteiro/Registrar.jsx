import { useState } from "react";
import useRegistro from "../../canteiro/useRegistro";
import { ETAPAS_DIARIO, hoje, salvarDiario } from "../../canteiro/dados";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import { Campo, Mensagens, AcoesRegistro } from "../../componentes/canteiro/FormularioBase";
const inicial = () => ({ data: hoje(), clima: "", turno: "", etapa_atuacao: "", equipe_interna: "", equipe_terceirizada: "", paralisacoes: "", origem_paralisacoes: "", atrasos: "", origem_atrasos: "" });
export default function Registrar({ ocorrencia = false }) {
  const r = useRegistro("diario", inicial);
  const [passo, setPasso] = useState(ocorrencia ? 2 : 0);
  const { form, campo, ctx } = r;
  function validar() {
    if (!ctx.obra || !ctx.usuario.id_usuario) throw new Error("Selecione uma obra e entre novamente se necessário.");
    if (!/^\d{4}-\d{2}-\d{2}$/.test(form.data) || form.data > hoje()) throw new Error("Informe uma data válida, até hoje.");
    if (!["Ensolarado", "Chuvoso"].includes(form.clima) || !["Manhã", "Tarde", "Noite"].includes(form.turno) || !ETAPAS_DIARIO.includes(form.etapa_atuacao)) throw new Error("Preencha clima, turno e etapa no primeiro passo.");
    if ([form.equipe_interna, form.equipe_terceirizada].some(v => v && !["A", "B", "C"].includes(v))) throw new Error("Selecione uma equipe válida.");
  }
  const campos = { form, campo, disabled: r.salvando };
  const etapas = ["Dia e etapa", "Equipes", "Ocorrências"];
  return <><div className="ct-title"><span className="ct-eyebrow">REGISTRO DE CAMPO</span><h1>{ocorrencia ? "Registrar ocorrência" : "Diário de Obra"}</h1><p>Preencha o dia de trabalho em três passos.</p></div><EstadoObra><form className="ct-stack" onSubmit={e => r.enviar(e, validar, salvarDiario, { ...form, equipe_interna: form.equipe_interna || null, equipe_terceirizada: form.equipe_terceirizada || null, obrax_id: Number(ctx.obra?.id_obra), usuario_id: Number(ctx.usuario.id_usuario) })}>
    <nav className="ct-steps" aria-label="Etapas do diário">{etapas.map((nome, i) => <button type="button" key={nome} aria-current={passo === i ? "step" : undefined} disabled={r.salvando} onClick={() => setPasso(i)}><span>{i + 1}</span>{nome}</button>)}</nav>
    <section className="ct-card ct-stack"><h2>{etapas[passo]}</h2>{passo === 0 && <><Campo {...campos} nome="data" titulo="Data" type="date" max={hoje()} /><Campo {...campos} nome="clima" titulo="Clima" opcoes={["Ensolarado", "Chuvoso"]} /><Campo {...campos} nome="turno" titulo="Turno" opcoes={["Manhã", "Tarde", "Noite"]} /><Campo {...campos} nome="etapa_atuacao" titulo="Etapa de atuação" opcoes={ETAPAS_DIARIO} /></>}{passo === 1 && <><p className="ct-muted">O diário atual identifica equipes pelos grupos A, B e C. Deixe vazio quando não houver atuação.</p><Campo {...campos} nome="equipe_interna" titulo="Equipe interna" opcoes={["A", "B", "C"]} /><Campo {...campos} nome="equipe_terceirizada" titulo="Equipe terceirizada" opcoes={["A", "B", "C"]} /></>}{passo === 2 && <><p className="ct-muted">Descreva paralisações e atrasos. Deixe vazio quando não houver ocorrência.</p><Campo {...campos} nome="paralisacoes" titulo="Paralisações / observações" multiline maxLength={10000} /><Campo {...campos} nome="origem_paralisacoes" titulo="Origem / motivo da paralisação" maxLength={255} /><Campo {...campos} nome="atrasos" titulo="Atrasos / observações" multiline maxLength={10000} /><Campo {...campos} nome="origem_atrasos" titulo="Origem / motivo do atraso" maxLength={255} /></>}</section>
    <div className="ct-row">{passo > 0 && <button type="button" className="ct-button ct-secondary" disabled={r.salvando} onClick={() => setPasso(p => p - 1)}>Anterior</button>}{passo < 2 && <button type="button" className="ct-button" disabled={r.salvando} onClick={() => setPasso(p => p + 1)}>Próximo</button>}</div><Mensagens erro={r.erro} mensagem={r.mensagem} /><AcoesRegistro registro={r} />
  </form></EstadoObra></>;
}
