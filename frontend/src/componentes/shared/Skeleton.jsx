export default function Skeleton({ label = "Carregando informações…", rows = 3 }) {
  return <div className="vertice-skeleton" role="status" aria-label={label}>
    <span className="sr-only">{label}</span>
    <div aria-hidden="true">{Array.from({ length: rows }, (_, i) => <span key={i} />)}</div>
  </div>;
}
