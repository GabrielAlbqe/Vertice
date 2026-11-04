export const work={id_obra:901,nome:'Obra isolada visual',status:'Em Andamento',id_construtora:901,numero_pavimentos:2,data_inicio_planejada:'2026-01-01',data_termino_planejada:'2027-01-01',orcamento_planejado:10000};
const own={id_cadastro_equipes:901,nome_equipe:'Equipe visual',idobra:901,etapa_atuacao:'Infraestrutura',quantidade_profissionais:3,custo_diario:100,custo_mensal:2000};
const secondWork={...work,id_obra:902,nome:'Segunda obra visual'};
const secondTeam={...own,id_cadastro_equipes:902,nome_equipe:'Equipe acabamento',idobra:902,etapa_atuacao:'Revestimentos',quantidade_profissionais:5,custo_diario:99999999.99};
const users=[{id_usuario:901,nome:'Navigation test',email:'office@teste.local',ambiente:'Escritório',status:'Ativo',idconstrutora:901},{id_usuario:902,nome:'Campo visual',email:'field@teste.local',ambiente:'Canteiro',status:'Ativo',idconstrutora:901}];
const people=[],costs=[];
export function fixture(req,res) {
  const route=new URL(req.url,'http://localhost').pathname.replace('/mock-api','');
  const send=value=>{res.setHeader('Content-Type','application/json');res.end(JSON.stringify(value));};
  if(req.method==='POST'){
    req.setEncoding('utf8');let body='';req.on('data',data=>body+=data);req.on('end',()=>{
      const b=body?JSON.parse(body):{};
      if(route==='/usuarios/login'){send({usuario:users[0],session:{id:'visual-login-fixture',csrf:'visual-fixture',expiresAt:Date.now()+3600000}});}
      else if(route==='/usuarios/insert'){users.push({...b,id_usuario:903,status:'Ativo'});send({insertId:903});}
      else if(route==='/operacional/gestao/pessoas'){people.push({...b,id_profissional:901,id_obra:901,equipe:'Equipe visual'});send({insertId:901});}
      else if(route==='/operacional/gestao/custos'){costs.push({...b,id_custo_realizado:costs.length+1,valor_total:Number(b.quantidade)*Number(b.custo_unitario)});send({insertId:costs.length});}
      else send({insertId:901});
    });return true;
  }
  const responses={
    '/operacional/gestao/pessoas/estado':{habilitado:true,pode_editar:true,migrations:[],historico_habilitado:false},
    '/usuarios':users,'/usuarios/901':users[0],'/operacional/gestao/pessoas':people,
    '/obras':[work,secondWork],'/obras/901':work,'/obras/902':secondWork,'/equipes':[own,secondTeam],'/equipes/901':own,
    '/equipes-terceirizadas':[], '/insumos':[], '/maquinarios':[],
    '/etapas':[{id_etapa:901,id_obra:901,nome_etapa:'Infraestrutura'}],
    '/rdo':[{id_rdo:901,id_obra:901,data_rdo:'2026-10-01'}],
    '/custos-planejados':[], '/custos-realizados':costs,
    '/operacional/gestao/custos':costs,
    '/operacional/gestao/equipes':{habilitado:false,controle:'vinculo_unico',equipes:[own,secondTeam].map(e=>({...e,equipe_id:e.id_cadastro_equipes,tipo:'propria',situacao:'Alocada',obra_nome:'Obra isolada visual',obra_id:e.idobra}))},
    '/operacional/gestao/recursos':{equipes:[own,secondTeam],insumos:[],maquinarios:[]},
  };
  if(Object.hasOwn(responses,route)){send(responses[route]);return true;}
  return false;
}
