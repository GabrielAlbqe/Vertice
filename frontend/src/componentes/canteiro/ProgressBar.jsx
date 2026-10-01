export default function ProgressBar({ valor }) {
  const numero = Number(valor);
  if (!Number.isFinite(numero)) return null;
  return <progress className="ct-progress" max="100" value={Math.max(0, Math.min(100, numero))} aria-label="Progresso executado" />;
}
