import {requisitar} from './api.js';
export const PESSOAS_API='/operacional/gestao/pessoas';
export const vazioProfissional=()=>({nome:'',codigo:'',cargo:'',equipe:'',ativo:true});
export const ativoProfissional=p=>p.ativo===true||p.ativo===1||p.ativo==='1';
export const equipeProfissional=p=>p.equipe_id?'interna:'+p.equipe_id:p.terceirizada_id?'terceirizada:'+p.terceirizada_id:'';
const normalizar=v=>String(v??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLocaleLowerCase('pt-BR');
export function profissionaisUnicos(rows){return [...new Map(rows.filter(p=>Number.isSafeInteger(Number(p.id_profissional))&&Number(p.id_profissional)>0).map(p=>[String(p.id_profissional),p])).values()];}
export function filtrarProfissionais(rows,f={}){return profissionaisUnicos(rows).filter(p=>{
 if(f.obra&&String(p.id_obra)!==String(f.obra))return false;
 if(f.equipe==='sem'&&equipeProfissional(p)||f.equipe&&f.equipe!=='sem'&&equipeProfissional(p)!==f.equipe)return false;
 if(f.situacao&&ativoProfissional(p)!==(f.situacao==='ativo'))return false;
 for(const field of ['nome','codigo','cargo'])if(f[field]&&!normalizar(p[field]).includes(normalizar(f[field])))return false;
 return !f.busca||normalizar([p.nome,p.codigo,p.cargo,p.equipe].join(' ')).includes(normalizar(f.busca));
});}
export function resumoProfissionais(rows){const unicos=profissionaisUnicos(rows),ativos=unicos.filter(ativoProfissional),porEquipe={};for(const p of ativos){const team=equipeProfissional(p);if(team)porEquipe[team]=(porEquipe[team]||0)+1;}return {total:unicos.length,ativos:ativos.length,inativos:unicos.length-ativos.length,semEquipe:ativos.filter(p=>!equipeProfissional(p)).length,porEquipe};}
export function formularioProfissional(p){return {id_profissional:p.id_profissional,versao:p.versao,nome:p.nome,codigo:p.codigo,cargo:p.cargo,ativo:ativoProfissional(p),equipe:equipeProfissional(p)};}
export function payloadProfissional(form){
 const payload={};for(const [field,max]of [['nome',150],['codigo',50],['cargo',100]]){const value=String(form[field]??'').trim();if(!value||value.length>max)throw Error('Preencha '+({nome:'o nome',codigo:'o código',cargo:'o cargo'}[field])+' corretamente.');payload[field]=value;}
 const match=form.equipe?form.equipe.match(/^(interna|terceirizada):([1-9][0-9]*)$/):null;
 if(form.equipe&&(!match||!Number.isSafeInteger(Number(match[2]))))throw Error('Selecione uma equipe válida.');
 if(typeof form.ativo!=='boolean')throw Error('Selecione a situação do profissional.');
 payload.ativo=form.ativo;payload.equipe_id=match?.[1]==='interna'?Number(match[2]):null;payload.terceirizada_id=match?.[1]==='terceirizada'?Number(match[2]):null;
 if(form.versao)payload.versao=form.versao;return payload;
}
export function mensagemErroProfissionais(error){if(error?.dados?.code==='SCHEMA_NOT_READY')return 'O cadastro individual depende de uma atualização autorizada do banco de dados. Solicite a habilitação ao responsável pelo sistema.';if(error?.status===503)return 'O serviço de profissionais está temporariamente indisponível. Atualize a consulta ou tente novamente mais tarde.';return error?.message||'Não foi possível concluir a operação.';}
export async function salvarProfissional(form,retry){
 const endpoint=PESSOAS_API+(form.id_profissional?'/'+form.id_profissional:''),method=form.id_profissional?'PUT':'POST',body=JSON.stringify(payloadProfissional(form));
 const signature=method+endpoint+body;if(retry.current?.signature!==signature)retry.current={signature,id:crypto.randomUUID()};
 return requisitar(endpoint,{method,headers:{'Idempotency-Key':retry.current.id},body});
}
