const prefix='vertice:canteiro:offline:';
const maxAge=24*60*60*1000;
import {readSession} from '../api/sessionTransport.js';
function sessaoValida(){const session=readSession();return Number.isFinite(session?.expiresAt)&&session.expiresAt>Date.now();}
export function guardarCache(usuario,obra,dados){
  if(!sessaoValida()||readSession()?.user!==String(usuario.id_usuario))return false;
  if(!usuario.id_usuario||!usuario.idconstrutora||!obra?.id_obra)return false;
  const record={usuario:String(usuario.id_usuario),construtora:String(usuario.idconstrutora),obra,dados,atualizado:new Date().toISOString()};
  // Cache de consulta, sem tokens, credenciais, URLs de fotos ou binários.
  const encoded=JSON.stringify(record,(key,value)=>/senha|password|token|secret|authorization|url_foto/i.test(key)?undefined:value);
  if(encoded.length>800000)return false;
  try{localStorage.setItem(prefix+usuario.id_usuario,encoded);return true;}catch{return false;}
}
export function lerCache(usuario,obraId){
  if(!sessaoValida()||readSession()?.user!==String(usuario.id_usuario))return null;
  try{const r=JSON.parse(localStorage.getItem(prefix+usuario.id_usuario)||'null'),age=Date.now()-Date.parse(r?.atualizado);
    if(!r||r.usuario!==String(usuario.id_usuario)||r.construtora!==String(usuario.idconstrutora)||!r.obra?.id_obra||(obraId&&String(obraId)!==String(r.obra.id_obra))||!Number.isFinite(age)||age<0||age>maxAge)return null;
    if(!['diarios','atividades','apontamentos','apropriacoes','rdos'].every(k=>Array.isArray(r.dados?.[k]))||!['equipes','insumos','maquinarios'].every(k=>Array.isArray(r.dados?.recursos?.[k])))return null;
    return r;
  }catch{return null;}
}
export function limparCache(usuario){try{localStorage.removeItem(prefix+usuario);}catch{/* Não altera os rascunhos. */}}
