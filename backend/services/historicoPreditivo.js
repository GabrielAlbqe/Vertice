const { error } = require('../config/inteligenciaOperacional');
const num = v => v === null || v === undefined || v === '' || !Number.isFinite(Number(v)) ? null : Number(v);
const round = v => Math.round(v * 100) / 100;
function analisar({obra, custos=[], metricas=[], registros=[], ocorrencias=[]}, filtros) {
  const auditoria=[], diarios=new Map();
  for(const r of registros) if(!diarios.has(r.data)) diarios.set(r.data,{data:r.data,documentos:0,ocorrencias:0});
  for(const r of registros) diarios.get(r.data).documentos++;
  const ids=new Set(registros.map(r=>r.id_registro));
  for(const e of ocorrencias) if(ids.has(e.id_registro)&&diarios.has(e.data)) diarios.get(e.data).ocorrencias++;
  const operacional=[...diarios.values()].sort((a,b)=>a.data.localeCompare(b.data));
  const diasEvento=new Set(ocorrencias.filter(e=>ids.has(e.id_registro)).map(e=>e.data));
  let tendencia={situacao:'Dados insuficientes',anterior:null,recente:null,diferenca_pp:null};
  if(operacional.length>=6) {
    const metade=Math.floor(operacional.length/2), a=operacional.slice(0,metade),b=operacional.slice(-metade);
    const taxa=l=>l.filter(d=>diasEvento.has(d.data)).length/l.length*100;
    const anterior=round(taxa(a)),recente=round(taxa(b)),dif=round(recente-anterior);
    tendencia={situacao:dif>0?'Aumento da recorrência':dif<0?'Redução da recorrência':'Recorrência estável',anterior,recente,diferenca_pp:dif,dias_por_janela:metade};
  }
  let acumulado=0;
  const financeiro=custos.map(r=>({data:r.data,valor:num(r.valor)})).sort((a,b)=>a.data.localeCompare(b.data)).map(r=>{
    if(r.valor===null){auditoria.push('Existe custo sem valor numérico válido.');return {...r,acumulado:null};}
    acumulado=round(acumulado+r.valor);
    return {...r,acumulado};
  });
  if(auditoria.length) for(const r of financeiro) r.acumulado=null;
  const eva=metricas.map(r=>({id:r.id_metrica,data:r.data_calculo,idc:num(r.idc),idp:num(r.idp),eac:num(r.eac),rup:null,origem:'Registro EVA existente; cálculo e autoria não rastreados pela estrutura atual.'})).sort((a,b)=>a.data.localeCompare(b.data)||a.id-b.id);
  const grupos=new Map();for(const m of eva)grupos.set(m.data,(grupos.get(m.data)||0)+1);
  if([...grupos.values()].some(n=>n>1))auditoria.push('Há múltiplos registros EVA na mesma data. Nenhum foi escolhido como indicador oficial.');
  if(eva.some(m=>[m.idc,m.idp,m.eac].some(v=>v===null||v<0)))auditoria.push('Existem indicadores EVA ausentes ou negativos.');
  const ultimaData=eva.at(-1)?.data, candidatos=eva.filter(m=>m.data===ultimaData);
  const ultimo=candidatos.length===1?candidatos[0]:null;
  const alertas=[];
  if(tendencia.diferenca_pp>0)alertas.push({tipo:'Tendência observada',mensagem:'A proporção de dias com ocorrências aumentou '+tendencia.diferenca_pp+' pontos percentuais entre janelas observadas. Isso não estima a probabilidade de atraso.'});
  if(ultimo?.idc!==null&&ultimo?.idc<1)alertas.push({tipo:'Indicador registrado',mensagem:'O último IDC registrado está abaixo de 1. Revise sua origem antes de tomar decisões.'});
  if(ultimo?.idp!==null&&ultimo?.idp<1)alertas.push({tipo:'Indicador registrado',mensagem:'O último IDP registrado está abaixo de 1. Não equivale a uma previsão de dias de atraso.'});
  const orcamento=num(obra.orcamento_planejado);
  if(orcamento!==null&&acumulado>orcamento&&!auditoria.some(a=>a.includes('custo sem')))alertas.push({tipo:'Desvio observado',mensagem:'Os custos registrados até o fim do período ultrapassam o orçamento cadastrado da obra.'});
  return {versao:'historico-leitura-v1',gerado_em:new Date().toISOString(),obra:{...obra,demonstracao:String(obra.nome||'').startsWith('[DEMO]')},filtros,
    financeiro,eva,operacional,tendencia,alertas,auditoria,ultimo,
    resumo:{orcamento,custo_ate_fim:auditoria.some(a=>a.includes('custo sem'))?null:acumulado,dias_observados:operacional.length,ocorrencias:operacional.reduce((s,d)=>s+d.ocorrencias,0)},
    limites:['Histórico reconstruído por consulta; nenhuma fotografia imutável de indicadores é armazenada por este módulo.',
      'EVA exibido como registro existente, sem certificação de cálculo automático. Demonstrações não validam previsões reais.',
      'RUP indisponível: faltam homens-hora e volume executado com unidade definida.',
      'Índice consolidado, previsão de prazo e precisão de 15% não validados; faltam regras e histórico real de validação.',
      'Custos são acumulados desde o início até a data final. A data inicial filtra a exibição, preservando o acumulado.',
      'Tendência compara duas metades com igual número de dias documentados (mínimo de seis dias); dia central é excluído se necessário. Lacunas não são tratadas como zero.']};
}
function simular(custo, restante, variacao) {
  if([custo,restante,variacao].some(v=>num(v)===null)||Number(custo)<0||Number(restante)<0||Number(variacao)<-100||Number(variacao)>1000)throw error(400,'Informe custos não negativos e variação entre -100% e 1000%.');
  return round(Number(custo)+Number(restante)*(1+Number(variacao)/100));
}
module.exports={analisar,simular};
