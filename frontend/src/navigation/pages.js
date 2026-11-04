import { lazy } from 'react';
const loaders = {
 dashboard: () => import('../pages/escritorio/Dashboard'), obras: () => import('../pages/escritorio/Obras'),
 equipes: () => import('../pages/escritorio/Equipes'), recursos: () => import('../pages/escritorio/Recursos'),
 perfil: () => import('../pages/escritorio/Perfil'), 'obra-detalhes': () => import('../pages/escritorio/ObraDetalhes'),
 'analytics-financeiro': () => import('../pages/escritorio/AnalyticsFinanceiro'),
 canteiro: () => import('../canteiro/CanteiroApp'),
};
const pending = new Map();
function load(page) {
 if (!pending.has(page)) pending.set(page, loaders[page]().catch(error => { pending.delete(page); throw error; }));
 return pending.get(page);
}
export const pages = Object.fromEntries(Object.keys(loaders).map(page => [page, lazy(() => load(page))]));
export function preloadPage(page) {
 if (navigator.connection?.saveData || /(^|-)2g$/.test(navigator.connection?.effectiveType || '')) return;
 const key = page?.startsWith('canteiro-') ? 'canteiro' : page;
 if (loaders[key]) void load(key).catch(() => {});
}
export function preloadNavigation(event) {
 const page = event.target.closest('[data-page]')?.dataset.page;
 if (page) preloadPage(page);
}
