import { requisitar, API_URL } from './api.js';
import {invalidarSessao} from '../canteiro/sessao.js';
import {sessionId,sessionHeaders} from './sessionTransport.js';
export const chaveEnvio = () => crypto.randomUUID();
export const enviarOperacional = (rota, payload, chave) => requisitar(`/operacional/${rota}`, {
  method: 'POST', headers: { 'Idempotency-Key': chave }, body: JSON.stringify(payload),
});
export const detalheDiario = (id, signal) => requisitar(`/operacional/diarios/${id}`, { signal });
export const consultarMateriais = (id, signal) => requisitar(`/operacional/materiais?obra_id=${id}`, { signal });
export const consultarFotos = (id, signal) => requisitar(`/operacional/fotos?obra_id=${id}`, { signal });
export const consultarOcorrencias = (id, signal) => requisitar(`/operacional/ocorrencias?obra_id=${id}`, { signal });
export const historicoOcorrencia = (id, signal) => requisitar(`/operacional/ocorrencias/${id}/historico`, { signal });
export const enviarFoto = (obra, descricao, arquivo, chave, atividade='') => requisitar(`/operacional/fotos?obra_id=${obra}&descricao=${encodeURIComponent(descricao)}${atividade?`&atividade_id=${encodeURIComponent(atividade)}`:''}`, {
  method: 'POST', headers: { 'Content-Type': arquivo.type, 'Idempotency-Key': chave }, body: arquivo,
});
export async function carregarArquivoFoto(id, signal) {
  const token=sessionId();
  const resposta = await fetch(`${API_URL}/operacional/fotos/${id}/arquivo`, {
    credentials:'include',headers:sessionHeaders(),
    signal: signal ? AbortSignal.any([signal, AbortSignal.timeout(15000)]) : AbortSignal.timeout(15000),
  });
  if(resposta.status===401)invalidarSessao(token);
  if (!resposta.ok || resposta.headers.get('Content-Type')?.split(';')[0] !== 'image/webp') throw new Error('Não foi possível carregar a foto privada.');
  return resposta.blob();
}
export async function baixarDocumentoDiario(id){
  const token=sessionId();
  const r=await fetch(`${API_URL}/operacional/diarios/${id}/documento`,{credentials:'include',headers:sessionHeaders(),signal:AbortSignal.timeout(15000)});
  if(r.status===401)invalidarSessao(token);
  if(!r.ok || !r.headers.get('Content-Type')?.startsWith('text/csv'))throw Error('Não foi possível baixar o documento do diário.');
  const url=URL.createObjectURL(await r.blob()),a=document.createElement('a');a.href=url;a.download=`diario-${id}.csv`;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
}
