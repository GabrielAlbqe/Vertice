export function Campo({ nome, titulo, form, campo, opcoes, ...props }) {
  const id = `ct-${nome}`;
  return <label className="ct-field" htmlFor={id}>{titulo}{opcoes ? <select id={id} value={form[nome] ?? ""} onChange={e => campo(nome, e.target.value)} {...props}><option value="">Selecione</option>{opcoes.map(o => <option key={o} value={o}>{o}</option>)}</select> : props.multiline ? <textarea id={id} value={form[nome] ?? ""} onChange={e => campo(nome, e.target.value)} rows="3" maxLength={props.maxLength} disabled={props.disabled} /> : <input id={id} value={form[nome] ?? ""} onChange={e => campo(nome, e.target.value)} {...props} />}</label>;
}
export function Mensagens({ erro, mensagem }) { return <>{erro && <p className="ct-message ct-error" role="alert">{erro}</p>}{mensagem && <p className="ct-message ct-success" role="status">{mensagem}</p>}</>; }
export function AcoesRegistro({ registro }) {
  return <div className="ct-form-actions"><button type="button" className="ct-button ct-secondary" disabled={registro.salvando} onClick={registro.rascunhar}>Salvar rascunho</button><button type="submit" className="ct-button" disabled={registro.salvando || registro.ctx.carregando || !registro.ctx.online}>{registro.salvando ? "Enviando…" : "Enviar registro"}</button></div>;
}
