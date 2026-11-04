export default function MaterialSaldo({registro:r}) {
  const material=r.ctx.recursos.insumos.find(i=>String(i.id_insumos)===String(r.form.id_insumo));
  if(!material)return null;
  const disponivel=material.quantidade_disponivel;
  return <div className="ct-message"><p>Quantidade cadastrada: {disponivel ?? 'não informada'}. Unidade de medida não cadastrada.</p>{disponivel!==null && disponivel!==undefined && Number(r.form.quantidade_consumida)>Number(disponivel) && <p role="alert">A quantidade informada supera a quantidade disponível no cadastro. Confira o lançamento; o registro não fará baixa automática de estoque.</p>}</div>;
}
