import { useEffect, useRef } from "react";

export function confirmarSaida() {
  return window.dispatchEvent(new Event("vertice:confirmar-saida", { cancelable: true }));
}

export default function useUnsavedChanges(alterado, salvando = false) {
  const estado = useRef({ alterado, salvando });
  estado.current = { alterado, salvando };
  useEffect(() => {
    function verificar(evento) {
      if (estado.current.salvando || (estado.current.alterado && !window.confirm("Existem alterações não salvas. Deseja sair?"))) evento.preventDefault();
      else estado.current.alterado = false;
    }
    function fechar(evento) {
      if (!estado.current.alterado && !estado.current.salvando) return;
      evento.preventDefault(); evento.returnValue = "";
    }
    window.addEventListener("vertice:confirmar-saida", verificar);
    window.addEventListener("beforeunload", fechar);
    return () => {
      window.removeEventListener("vertice:confirmar-saida", verificar);
      window.removeEventListener("beforeunload", fechar);
    };
  }, []);
}
