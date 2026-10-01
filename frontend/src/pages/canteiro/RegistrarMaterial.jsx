import useRegistro from "../../canteiro/useRegistro";
import { salvarMaterial } from "../../canteiro/dados";
import { obterIdInsumo } from "../../api/recursos";
import EstadoObra from "../../componentes/canteiro/EstadoObra";
import { Campo, Mensagens, AcoesRegistro } from "../../componentes/canteiro/FormularioBase";
const inicial = () => ({ id_insumo: "", id_atividade: "", quantidade_consumida: "", tipo_compra: "Planejada" });
export default function RegistrarMaterial() {
  const r = useRegistro("material", inicial), { ctx, form, campo } = r;
  function validar() {
    if (!ctx.recursos.insumos.some(i => String(obterIdInsumo(i)) === String(form.id_insumo))) throw new Error("Selecione um insumo desta obra.");
    if (!ctx.atividades.some(a => String(a.id_atividade) === String(form.id_atividade))) throw new Error("Selecione uma atividade desta obra.");
    if (!Number.isFinite(Number(form.quantidade_consumida)) || Number(form.quantidade_consumida) <= 0) throw new Error("Informe uma quantidade maior que zero.");
    if (!["Planejada", "Emergencial"].includes(form.tipo_compra)) throw new Error("Selecione o tipo de compra.");
  }
  return <><div className="ct-title"><span className="ct-eyebrow">APROPRIAÇÃO DE INSUMOS</span><h1>Registrar material</h1><p>Vincule o consumo a uma atividade da obra.</p></div><EstadoObra><form className="ct-stack" onSubmit={e => r.enviar(e, validar, salvarMaterial, { quantidade_consumida: Number(form.quantidade_consumida), tipo_compra: form.tipo_compra, id_insumo: Number(form.id_insumo), id_atividade: Number(form.id_atividade), id_usuario: Number(ctx.usuario.id_usuario) })}><section className="ct-card ct-stack"><label className="ct-field">Insumo<select value={form.id_insumo} disabled={r.salvando || ctx.carregando} onChange={e => campo("id_insumo", e.target.value)}><option value="">Selecione um insumo</option>{ctx.recursos.insumos.map(i => <option key={obterIdInsumo(i)} value={obterIdInsumo(i)}>{i.nome}</option>)}</select></label><label className="ct-field">Atividade<select value={form.id_atividade} disabled={r.salvando || ctx.carregando} onChange={e => campo("id_atividade", e.target.value)}><option value="">Selecione uma atividade</option>{ctx.atividades.map(a => <option key={a.id_atividade} value={a.id_atividade}>{a.descricao}</option>)}</select></label><Campo form={form} campo={campo} disabled={r.salvando} nome="quantidade_consumida" titulo="Quantidade consumida (unidade do insumo)" type="number" min="0.01" step="0.01" inputMode="decimal" /><Campo form={form} campo={campo} disabled={r.salvando} nome="tipo_compra" titulo="Tipo de compra" opcoes={["Planejada", "Emergencial"]} /><p className="ct-muted">O registro usa a apropriação existente e não altera o cadastro ou o estoque do insumo.</p>{!ctx.carregando && (!ctx.recursos.insumos.length || !ctx.atividades.length) && <p>É necessário ter insumos e atividades cadastrados para esta obra.</p>}</section><Mensagens erro={r.erro} mensagem={r.mensagem} /><AcoesRegistro registro={r} /></form></EstadoObra></>;
}
