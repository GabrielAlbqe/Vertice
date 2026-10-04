import { useEffect, useId, useRef } from "react";
export function useDialogFocus(ref, onClose, aberto = true) {
  const fechar = useRef(onClose);
  fechar.current = onClose;
  useEffect(() => {
    if (!aberto) return;
    const anterior = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    ref.current?.focus();
    function teclado(e) {
      if (e.key === "Escape") { e.preventDefault(); fechar.current?.(); }
      if (e.key !== "Tab") return;
      const itens = [...(ref.current?.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]') || [])].filter(item => !item.matches(':disabled') && item.getClientRects().length && item.tabIndex >= 0);
      const primeiro = itens[0], ultimo = itens.at(-1);
      if (!primeiro) { e.preventDefault(); return; }
      if (e.shiftKey && (document.activeElement === primeiro || document.activeElement === ref.current)) { e.preventDefault(); ultimo.focus(); }
      else if (!e.shiftKey && (document.activeElement === ultimo || document.activeElement === ref.current)) { e.preventDefault(); primeiro.focus(); }
    }
    document.addEventListener("keydown", teclado);
    return () => { document.body.style.overflow = overflow; document.removeEventListener("keydown", teclado); anterior?.focus(); };
  }, [aberto, ref]);
}
function Modal({ title, children, onClose }) {
  const ref = useRef(null), titulo = useId();
  useDialogFocus(ref, onClose);
  return (
    <div className="modal-overlay">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby={titulo} ref={ref} tabIndex={-1}>
        <div className="modal-header">
          <h2 id={titulo}>{title}</h2>

          <button type="button" aria-label="Fechar modal" onClick={onClose}>
            X
          </button>
        </div>

        <div className="modal-content">
          {children}
        </div>
      </div>
    </div>
  );
}

export default Modal;
