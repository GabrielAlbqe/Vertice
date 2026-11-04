import { Component, Suspense } from 'react';
function Placeholder() {
 return <div className="route-placeholder" role="status" aria-label="Preparando conteúdo">
 <div aria-hidden="true" className="route-skeleton-heading" />
 <div aria-hidden="true" className="route-skeleton-cards">{[0,1,2].map(i => <div key={i} />)}</div>
 <div aria-hidden="true" className="route-skeleton-panel" /></div>;
}
class RouteError extends Component {
 state = { error: false };
 componentDidUpdate(previous) {
  if (previous.page !== this.props.page && this.state.error) this.setState({ error: false });
 }
 static getDerivedStateFromError() { return { error: true }; }
 render() {
  if (this.state.error) return <section className="ct-card" role="alert"><h1>Não foi possível abrir esta tela</h1>
  <p>Confira sua conexão e tente novamente. Os rascunhos salvos permanecem neste dispositivo.</p>
  <button type="button" onClick={() => location.reload()}>Tentar novamente</button></section>;
  return this.props.children;
 }
}
export default function RouteContent({page, children}) {
 return <RouteError page={page}><Suspense fallback={<Placeholder />}><div className="route-content" key={page}>{children}</div></Suspense></RouteError>;
}
