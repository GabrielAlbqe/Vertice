import { dataISO, numero } from "./analyticsCalculos.js";

export function resumirAtrasos(obras, hoje) {
  let atrasadas=0, semPrazoValido=0;
  for(const obra of obras){
    const status=String(obra.status||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
    if(status==='concluida')continue;
    if(!['planejamento','em andamento','paralisada','iniciada','pausada'].includes(status)||!calcularPrazo(obra,hoje)){semPrazoValido++;continue;}
    if(dataISO(obra.data_termino_planejada)<dataISO(hoje))atrasadas++;
  }
  return {atrasadas,semPrazoValido};
}

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

export function resumirEquipes(lista) {
  const unicas=[...new Map(lista.map((e,i)=>[`${e.origem==='terceirizada'?'externa':'propria'}:${e.id_cadastro_equipes??e.id_equipe_terceirizada??`linha:${i}`}`,e])).values()];
  const proprias=unicas.filter(e=>e.origem!=='terceirizada'), terceirizadas=unicas.filter(e=>e.origem==='terceirizada');
  return {proprias:proprias.length,terceirizadas:terceirizadas.length,total:unicas.length,
    profissionaisProprios:proprias.length?somarRecursos(proprias,'quantidade_profissionais'):0,
    profissionaisTerceirizados:terceirizadas.length?somarRecursos(terceirizadas,'quantidade_profissionais'):0,
    profissionais:unicas.length?somarRecursos(unicas,'quantidade_profissionais'):0,
    custoDiario:somarRecursos(unicas.map(e=>({...e,custo_diario:e.custo_diario??e.custo_diario_total})),'custo_diario'),
    custoMensal:somarRecursos(unicas,'custo_mensal')};
}
