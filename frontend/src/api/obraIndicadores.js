import { dataISO, numero } from "./analyticsCalculos.js";

export function calcularPrazo(obra, hoje) {
  const inicio = dataISO(obra?.data_inicio_planejada), fim = dataISO(obra?.data_termino_planejada), atual = dataISO(hoje);
  if (!inicio || !fim || !atual || fim < inicio) return null;
  const dia = 86400000;
  const inicioMs = Date.parse(`${inicio}T00:00:00Z`), fimMs = Date.parse(`${fim}T00:00:00Z`), atualMs = Date.parse(`${atual}T00:00:00Z`);
  const duracao = Math.round((fimMs - inicioMs) / dia);
  const decorridos = Math.max(0, Math.min(duracao, Math.round((atualMs - inicioMs) / dia)));
  return { duracao, decorridos, restantes: Math.max(0, Math.round((fimMs - Math.max(inicioMs, atualMs)) / dia)), percentual: duracao ? decorridos / duracao * 100 : atualMs >= fimMs ? 100 : 0 };
}

export function somarRecursos(lista, ...campos) {
  if (!lista.length) return null;
  const valores = lista.map(item => campos.map(campo => numero(item[campo])));
  if (valores.some(item => item.includes(null))) return null;
  return valores.reduce((total, item) => total + item.reduce((produto, valor) => produto * valor, 1), 0);
}
