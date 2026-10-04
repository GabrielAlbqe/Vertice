import { requisitar } from "../api/api.js";
// Contratos conferidos em backend/app.js, routes, controllers, models e bd.sql.
// Reutiliza o transporte existente; não altera os módulos de API do Escritório.
export const ETAPAS_DIARIO = ["Mobilização", "Infraestrutura", "Supraestrutura e Alvenaria", "Instalações", "Revestimentos", "Acabamentos"];
export const dataCurta = valor => String(valor || "").slice(0, 10);
export const formatarData = valor => /^\d{4}-\d{2}-\d{2}$/.test(dataCurta(valor)) ? dataCurta(valor).split("-").reverse().join("/") : "Não informada";
export function hoje() { return new Intl.DateTimeFormat("sv-SE", { timeZone: "America/Sao_Paulo" }).format(new Date()); }
export async function consultarLista(rota, signal) {
  const dados = await requisitar(rota, { signal });
  if (!Array.isArray(dados)) throw new Error("Formato de resposta inesperado.");
  return dados;
}
export const listarDiarios = (id, signal) => consultarLista(`/diarios-obra?obrax_id=${encodeURIComponent(id)}`, signal);
export const listarAtividades = (id, signal) => consultarLista(`/atividades-eap?idx_obra=${encodeURIComponent(id)}`, signal);
export const listarApontamentos = (id, signal) => consultarLista(`/apontamentos-fisicos?diario_id=${encodeURIComponent(id)}`, signal);
export const salvarDiario = payload => requisitar("/diarios-obra/insert", { method: "POST", body: JSON.stringify(payload) });
export const salvarAtividade = payload => requisitar("/apontamentos-fisicos/insert", { method: "POST", body: JSON.stringify(payload) });
export const salvarMaterial = payload => requisitar("/apropriacoes/insert", { method: "POST", body: JSON.stringify(payload) });
export const listarRdos = (id, signal) => consultarLista(`/rdo?id_obra=${encodeURIComponent(id)}`, signal);
export const listarApropriacoes = signal => consultarLista("/apropriacoes", signal);
export async function carregarApontamentos(diarios, signal) {
  const registros = [];
  for (let i = 0; i < diarios.length; i += 4) {
    const lote = await Promise.all(diarios.slice(i, i + 4).map(async diario => {
      const lista = await listarApontamentos(diario.id_diario, signal);
      return lista.filter(a => String(a.diario_id) === String(diario.id_diario)).map(a => ({ ...a, data: diario.data }));
    }));
    registros.push(...lote.flat());
  }
  return registros;
}
export function temOcorrencia(valor) {
  const texto = String(valor || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
  return Boolean(texto && !/^(nenhum(a)?|n\/a|nao|sem (atrasos?|paralisacoes?|ocorrencias?)|0|-)\.?$/.test(texto));
}
export function ocorrenciasDiarios(diarios) {
  return diarios.flatMap(diario => [["paralisacoes", "origem_paralisacoes", "Paralisação"], ["atrasos", "origem_atrasos", "Atraso"]]
    .filter(([campo]) => temOcorrencia(diario[campo]))
    .map(([campo, origem, tipo]) => ({ id: `${diario.id_diario}-${campo}`, tipo, descricao: diario[campo], origem: diario[origem], data: diario.data, diario })));
}
