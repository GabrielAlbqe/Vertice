import { useEffect, useState } from "react";

export default function Toast({ message, type = "success" }) {
  const [visivel, setVisivel] = useState(false);
  useEffect(() => {
    setVisivel(Boolean(message));
    if (!message) return;
    const timer = setTimeout(() => setVisivel(false), 6500);
    return () => clearTimeout(timer);
  }, [message]);
  if (!message || !visivel) return null;
  return <div className={`vertice-toast vertice-toast-${type}`} role={type === "error" ? "alert" : "status"} aria-atomic="true">
    <span>{message}</span><button type="button" onClick={() => setVisivel(false)} aria-label="Fechar notificação">×</button>
  </div>;
}
