const chave = usuario => `vertice:canteiro:rascunhos:${usuario}`;
const campos = {
  diario: ['data','clima','turno','etapa_atuacao','equipes','terceirizadas','maquinarios','observacoes','paralisacoes','origem_paralisacoes','atrasos','origem_atrasos'],
  atividade: ['diario_id','atividade_eap_id','percentual_dia','url_foto'],
  material: ['id_insumo','id_atividade','diario_id','quantidade_consumida','tipo_compra'],
  ocorrencia: ['descricao','localizacao','prioridade','classificacao','responsavel_id','prazo_previsto'],
};
function limpar(tipo, payload) {
  if (!Object.hasOwn(campos,tipo) || !payload || typeof payload !== 'object') throw new Error('Rascunho inválido.');
  return Object.fromEntries(campos[tipo].filter(k => Object.hasOwn(payload,k)).map(k => [k,
    k === 'maquinarios' ? (Array.isArray(payload[k]) ? payload[k].map(m=>({id:Number(m.id),quantidade:Number(m.quantidade)})) : []) :
    ['equipes','terceirizadas'].includes(k) ? (Array.isArray(payload[k]) ? payload[k].map(Number) : []) :
    typeof payload[k] === 'string' || typeof payload[k] === 'number' ? payload[k] : ''
  ]));
}
export function lerRascunhos(usuario) {
  try {
    const dados = JSON.parse(localStorage.getItem(chave(usuario)) || "[]");
    return Array.isArray(dados) ? dados.filter(item => item && item.id && item.obra && campos[item.tipo] && item.payload).map(item=>({
      id:item.id,obra:item.obra,nomeObra:item.nomeObra,tipo:item.tipo,payload:limpar(item.tipo,item.payload),
      chave:item.chave,estado:item.estado,atualizado:item.atualizado,
    })) : [];
  } catch { return []; }
}
export function gravarRascunho(usuario, item) {
  if (!usuario || !item.obra) throw new Error("Usuário ou obra não identificado.");
  const lista = lerRascunhos(usuario);
  const registro = { id: item.id || crypto.randomUUID(), obra: item.obra, nomeObra: item.nomeObra, tipo: item.tipo,
    payload: limpar(item.tipo,item.payload), chave: item.chave || crypto.randomUUID(),
    estado: ['rascunho','aguardando','erro'].includes(item.estado) ? item.estado : 'rascunho', atualizado: new Date().toISOString() };
  if (JSON.stringify(registro).length > 100000 || lista.length >= 100 && !lista.some(r=>r.id===registro.id)) throw new Error('Limite de rascunhos atingido.');
  localStorage.setItem(chave(usuario), JSON.stringify([...lista.filter(r => r.id !== registro.id), registro]));
  return registro;
}
export function removerRascunho(usuario, id) {
  localStorage.setItem(chave(usuario), JSON.stringify(lerRascunhos(usuario).filter(r => r.id !== id)));
}
