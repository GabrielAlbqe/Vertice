import useRegistro from "../../canteiro/useRegistro";
import { hoje, salvarDiario } from "../../canteiro/dados";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import { Campo, Mensagens, AcoesRegistro } from "../../componentes/canteiro/FormularioBase";
const inicial = () => ({ data: hoje(), tipo: "Paralisação", descricao: "", origem: "" });
export default function RegistrarOcorrencia() {
  const r = useRegistro("ocorrencia", inicial), { ctx, form, campo } = r;
  function validar() {
    if (!form.descricao.trim()) throw new Error("Descreva a ocorrência.");
    if (!form.data || form.data > hoje()) throw new Error("Informe uma data até hoje.");
    if (!["Paralisação", "Atraso"].includes(form.tipo)) throw new Error("Selecione o tipo de ocorrência.");
  }
  const payload = { data: form.data, clima: null, turno: null, etapa_atuacao: null, equipe_interna: null, equipe_terceirizada: null, paralisacoes: form.tipo === "Paralisação" ? form.descricao.trim() : "", origem_paralisacoes: form.tipo === "Paralisação" ? form.origem.trim() : "", atrasos: form.tipo === "Atraso" ? form.descricao.trim() : "", origem_atrasos: form.tipo === "Atraso" ? form.origem.trim() : "", obrax_id: Number(ctx.obra?.id_obra), usuario_id: Number(ctx.usuario.id_usuario) };
  return <><div className="ct-title"><span className="ct-eyebrow">REGISTRO DE CAMPO</span><h1>Registrar ocorrência</h1><p>A ocorrência será registrada no diário da obra.</p></div><EstadoObra><form className="ct-stack" onSubmit={e => r.enviar(e, validar, salvarDiario, payload)}><section className="ct-card ct-stack"><Campo form={form} campo={campo} disabled={r.salvando} nome="tipo" titulo="Tipo" opcoes={["Paralisação", "Atraso"]} /><Campo form={form} campo={campo} disabled={r.salvando} nome="descricao" titulo="Descrição" multiline maxLength={10000} /><Campo form={form} campo={campo} disabled={r.salvando} nome="origem" titulo="Origem / motivo (opcional)" maxLength={255} /><Campo form={form} campo={campo} disabled={r.salvando} nome="data" titulo="Data" type="date" max={hoje()} /><p className="ct-muted">Responsável: {ctx.usuario.nome}</p></section><Mensagens erro={r.erro} mensagem={r.mensagem} /><AcoesRegistro registro={r} /></form></EstadoObra></>;
}
