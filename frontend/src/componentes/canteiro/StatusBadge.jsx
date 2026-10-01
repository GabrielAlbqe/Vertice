export default function StatusBadge({ status = "Não informado", aviso = false }) {
  return <span className={`ct-badge ${aviso ? "ct-badge-warning" : ""}`}>{status || "Não informado"}</span>;
}
