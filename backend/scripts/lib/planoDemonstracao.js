const { dataValida } = require('../../utils/validar');
const ETAPAS = ['Mobilização','Infraestrutura','Supraestrutura e Alvenaria','Instalações','Revestimentos','Acabamento'];
const PESOS = [8,17,25,20,18,12];
function planoDemonstracao(referencia = '2026-10-28') {
  if (!dataValida(referencia)) throw new Error('Data de referência inválida.');
  const date = new Date(referencia + 'T00:00:00Z'), dias=[];
  while(dias.length<24) { date.setUTCDate(date.getUTCDate()-1);if(![0,6].includes(date.getUTCDay()))dias.unshift(date.toISOString().slice(0,10)); }
  const obras=[
    {nome:'[DEMO] Residencial Aurora',status:'Em Andamento',categoria:'Residencial',pavimentos:12,orcamento:900000,fator:1},
    {nome:'[DEMO] Centro Empresarial',status:'Em Andamento',categoria:'Comercial',pavimentos:8,orcamento:1400000,fator:1.35},
    {nome:'[DEMO] Parque Logístico',status:'Paralisada',categoria:'Industrial',pavimentos:2,orcamento:650000,fator:.8}
  ];
  return {versao:'vertice-demo-v1',construtora:1,referencia,dias,etapas:ETAPAS,pesos:PESOS,obras};
}
function ocorrenciaDemonstracao(index, obraIndex) {
  const atraso=index%3===0||index%7===2,paralisacao=index%6===2||(obraIndex===2&&index%5===1);
  return {atraso,paralisacao,origemAtraso:['Equipes','Insumos','Maquinários'][index%3],
    origemParalisacao:(index+obraIndex)%2===0?'Condições Climáticas':'Acidente no Trabalho',
    duracaoAtraso:.5+(index%4)*.25,duracaoParalisacao:1+(index%3)*.5};
}
module.exports={planoDemonstracao,ocorrenciaDemonstracao};
