import {useRef,useState} from 'react';
import {requisitar} from '../api/api';
export default function RedefinirSenha({ticket}){
  const [senha,setSenha]=useState(''),[confirmar,setConfirmar]=useState(''),[erro,setErro]=useState(''),[salvando,setSalvando]=useState(false),trava=useRef(false);
  async function enviar(e){e.preventDefault();if(trava.current)return;setErro('');
    if(senha!==confirmar||senha.length<12||new TextEncoder().encode(senha).length>72){setErro('Use pelo menos 12 caracteres, até 72 bytes, e confirme a mesma senha.');return;}
    trava.current=true;setSalvando(true);
    try{const r=await requisitar('/usuarios/reset-password',{method:'POST',body:JSON.stringify({ticket,senha})});location.replace('/login?account='+encodeURIComponent(r.id_usuario));}
    catch(e){setErro(e.message);}finally{trava.current=false;setSalvando(false);}
  }
  return <main className="auth-page"><section className="auth-card"><h1>Redefinir senha</h1><p>Crie uma senha pessoal. O link expira em 30 minutos e pode ser usado uma vez.</p><form className="auth-form" onSubmit={enviar}><label className="form-group">Nova senha<input id="reset-senha" type="password" autoComplete="new-password" required minLength={12} maxLength={72} value={senha} onChange={e=>setSenha(e.target.value)} disabled={salvando}/></label><label className="form-group">Confirmar nova senha<input id="reset-confirmar" type="password" autoComplete="new-password" required value={confirmar} onChange={e=>setConfirmar(e.target.value)} disabled={salvando}/></label>{erro&&<p className="auth-error" role="alert">{erro}</p>}<button type="submit" disabled={salvando}>{salvando?'Salvando…':'Redefinir senha'}</button></form></section></main>;
}
