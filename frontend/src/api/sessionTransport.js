const localHost=typeof location!=='undefined'&&['localhost','127.0.0.1'].includes(location.hostname)?location.hostname:'localhost';
export const API_URL=(import.meta.env?.VITE_API_URL||(import.meta.env?.PROD?'/api':`http://${localHost}:3000/api`)).replace(/\/$/,'');
export function readSession(){try{return JSON.parse(localStorage.getItem('vertice:session')||'null');}catch{return null;}}
export function sessionId(){return readSession()?.id||null;}
export function sessionHeaders(){const csrf=readSession()?.csrf;return csrf?{'X-CSRF-Token':csrf}:{};}
export function saveSession(session,user){
  if(!session?.id||!Number.isFinite(session.expiresAt)||typeof session.csrf!=='string')throw Error('Sessão inválida do servidor.');
  localStorage.removeItem('token');
  localStorage.setItem('vertice:session',JSON.stringify({id:session.id,expiresAt:session.expiresAt,csrf:session.csrf,user:String(user)}));
}
