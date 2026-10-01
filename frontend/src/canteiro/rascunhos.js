const chave = usuario => `vertice:canteiro:rascunhos:${usuario}`;
export function lerRascunhos(usuario) {
  try {
    const dados = JSON.parse(localStorage.getItem(chave(usuario)) || "[]");
    return Array.isArray(dados) ? dados.filter(item => item && item.id && item.obra && item.tipo && item.payload) : [];
  } catch { return []; }
}
export function gravarRascunho(usuario, item) {
  if (!usuario || !item.obra) throw new Error("Usuário ou obra não identificado.");
  const lista = lerRascunhos(usuario);
  const registro = { ...item, id: item.id || crypto.randomUUID(), atualizado: new Date().toISOString() };
  localStorage.setItem(chave(usuario), JSON.stringify([...lista.filter(r => r.id !== registro.id), registro]));
  return registro;
}
export function removerRascunho(usuario, id) {
  localStorage.setItem(chave(usuario), JSON.stringify(lerRascunhos(usuario).filter(r => r.id !== id)));
}
