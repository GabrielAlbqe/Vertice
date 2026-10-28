import { test, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert/strict';
import { mkdir, mkdtemp } from 'node:fs/promises';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
import { JSDOM } from 'jsdom';
import { build } from 'esbuild';
import { act, createElement } from 'react';
const require = createRequire(import.meta.url);
const { calcular } = require('../../backend/services/inteligenciaOperacional');
const { ETAPAS, TURNOS, CLIMAS } = require('../../backend/config/inteligenciaOperacional');
const user = { id_usuario: 7, nome: 'Gestão de teste', email: 'gestao@exemplo.invalid', idconstrutora: 1, status: 'Ativo', ocupacao: 'Gerência', ambiente: 'Escritório' };
const obras = [{ id_obra: 1, nome: 'Obra operacional', id_construtora: 1, status: 'Em Andamento', data_inicio_planejada: '2026-10-01', data_termino_planejada: '2026-12-31', orcamento_planejado: 1000, numero_pavimentos: 1 }];
await mkdir('node_modules/.cache', { recursive: true });
const cache = await mkdtemp(path.resolve('node_modules/.cache/io-dom-'));
await build({ entryPoints: ['src/App.jsx'], outfile: path.join(cache, 'App.mjs'), bundle: true, platform: 'node', format: 'esm', packages: 'external', jsx: 'automatic', loader: { '.css': 'empty', '.png': 'dataurl' }, logLevel: 'silent' });
let dom, root, mode, calls, navigate, App, createRoot;
globalThis.IS_REACT_ACT_ENVIRONMENT = true;
function response(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } }); }
function fixture(params) {
  const f = Object.fromEntries(params), source = f.fonte || 'diario';
  let docs = [1, 2, 3].map(i => ({ id_registro: source + ':' + i, id_obra: 1, data: '2026-10-0' + i, turno: 'Manhã', clima: 'Chuvoso' }));
  let events = docs.map((d, i) => ({ ...d, id: source + '-event:' + i, tipo: i === 2 ? 'paralisacao' : 'atraso', origem: i === 2 ? 'Condições Climáticas' : 'Equipes', etapa: 'Infraestrutura', duracao: source === 'rdo' ? [2, 1, 4][i] : null, descricao: 'Ocorrência de teste' }));
  docs = docs.filter(d => (!f.inicio || d.data >= f.inicio) && (!f.fim || d.data <= f.fim) && (!f.turno || d.turno === f.turno) && (!f.clima || d.clima === f.clima));
  const ids = new Set(docs.map(d => d.id_registro));
  events = events.filter(e => ids.has(e.id_registro) && (!f.tipo || e.tipo === f.tipo) && (!f.etapa || e.etapa === f.etapa) && (!f.origem_atraso || (e.tipo === 'atraso' && e.origem === f.origem_atraso)) && (!f.origem_paralisacao || (e.tipo === 'paralisacao' && e.origem === f.origem_paralisacao)));
  if (mode === 'empty') { docs = []; events = []; }
  return { obra: obras.find(o=>o.id_obra===Number(f.id_obra)) || obras[0], ...calcular({ registros: docs, ocorrencias: events }, { ...f, fonte: source, agrupamento: f.agrupamento || 'dia' }) };
}
beforeEach(async () => {
  dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost:5174/escritorio' });
  for (const key of ['window', 'document', 'localStorage', 'location', 'history', 'HTMLElement', 'HTMLSelectElement', 'HTMLInputElement', 'Event', 'navigator']) Object.defineProperty(globalThis, key, { configurable: true, value: dom.window[key] });
  mode = 'normal'; calls = []; navigate = [];
  localStorage.setItem('usuario', JSON.stringify(user)); localStorage.setItem('id_usuario', '7'); localStorage.setItem('idconstrutora', '1'); localStorage.setItem('ambiente', 'Escritório'); localStorage.setItem('ocupacao', 'Gerência'); localStorage.setItem('token', 'token-simulado'); localStorage.setItem('pagina_atual', 'dashboard');
  globalThis.fetch = async (input, options) => {
    const url = new URL(input); calls.push({ path: url.pathname, params: url.searchParams, options });
    if (url.pathname === '/api/inteligencia-operacional/filtros') { if(mode==='slowMetaError') await new Promise(r=>setTimeout(r,60)); return response({ obras: mode === 'noWorks' ? [] : obras, etapas: ETAPAS, turnos: TURNOS, climas: CLIMAS, recursos: { equipes: [], maquinarios: [], insumos: [] }, origens: { atraso: ['Equipes'], paralisacao: ['Condições Climáticas'] }, motivo_recursos: 'Sem vínculo direto de ocorrência com recurso.', recursos_disponiveis: false }); }
    if (url.pathname === '/api/inteligencia-operacional') {
      if (mode === 'error' || mode === 'denied' || mode === 'slowMetaError') return response({ message: mode === 'denied' ? 'Perfil sem acesso.' : 'Falha de teste.' }, mode === 'denied' ? 403 : 500);
      return response(fixture(url.searchParams));
    }
    if (url.pathname.startsWith('/api/usuarios/')) return response(user);
    if (url.pathname === '/api/obras') return response(obras);
    return response([]);
  };
  if (!App) { ({ createRoot } = await import('react-dom/client')); App = (await import(pathToFileURL(path.join(cache, 'App.mjs')).href)).default; }
  root = createRoot(document.getElementById('root'));
});
afterEach(async () => { await act(async () => { root.unmount(); }); dom.window.close(); obras.splice(1); });
const tick = async () => { await act(async () => { await new Promise(r => setTimeout(r, 5)); }); };
async function waitFor(check) { for (let i = 0; i < 100; i++) { if (check()) return; await tick(); } assert.fail('Estado não alcançado: ' + document.body.textContent.slice(-1200)); }
function button(text) { return [...document.querySelectorAll('button')].find(b => b.textContent.trim() === text); }
async function click(text) { const b = button(text); assert.ok(b, 'Botão: ' + text); await act(async () => b.click()); await tick(); }
async function input(label, value) {
  const el = document.querySelector('[aria-label="' + label + '"]'); assert.ok(el, label);
  await act(async () => { const proto = el.tagName === 'SELECT' ? HTMLSelectElement.prototype : HTMLInputElement.prototype; Object.getOwnPropertyDescriptor(proto, 'value').set.call(el, value); el.dispatchEvent(new Event(el.tagName === 'SELECT' ? 'change' : 'input', { bubbles: true })); });
  await tick();
}
const card = title => [...document.querySelectorAll('.io-page .card')].find(c => c.querySelector('h3')?.textContent === title)?.querySelector('.card-value')?.textContent;
async function render(operational = true) {
  if (operational) { history.replaceState(null, '', '/escritorio/inteligencia-operacional'); localStorage.setItem('pagina_atual', 'inteligencia-operacional'); }
  await act(async () => root.render(createElement(App)));
  if (operational && mode !== 'noWorks') await waitFor(() => card('Ocorrências registradas') !== undefined || document.querySelector('.io-error'));
  else await tick();
}
test('Menu navega do Dashboard à Inteligência Operacional com URL própria', async () => {
  await render(false); await click('Inteligência Operacional'); await waitFor(() => card('Ocorrências registradas') === '3');
  assert.equal(location.pathname, '/escritorio/inteligencia-operacional');
  assert.equal(document.querySelector('.sidebar button[aria-current="page"]')?.textContent.trim(), 'Inteligência Operacional');
});
test('URL direta carrega as quatro análises e informa dados insuficientes do diário', async () => {
  await render(); assert.equal(card('Ocorrências registradas'), '3'); assert.equal(card('Duração acumulada'), 'Dados insuficientes');
  for (const title of ['Padrões de improdutividade', 'Associação operacional', 'Impacto operacional por etapa', 'Evolução operacional']) assert.ok(document.body.textContent.includes(title));
});
test('Filtros combinados recalculam e limpar restaura os dados', async () => {
  await render(); await input('Data inicial', '2026-10-02'); await input('Data final', '2026-10-03'); await input('Tipo de ocorrência', 'atraso'); await click('Aplicar filtros');
  await waitFor(() => card('Ocorrências registradas') === '1');
  const last = calls.filter(c => c.path === '/api/inteligencia-operacional').at(-1);
  assert.equal(last.params.get('inicio'), '2026-10-02'); assert.equal(last.params.get('tipo'), 'atraso');
  await click('Limpar filtros'); await waitFor(() => card('Ocorrências registradas') === '3');
});
test('Combinação incompatível explica o problema sem enviar análise', async () => {
  await render(); await input('Tipo de ocorrência', 'atraso'); await input('Origem da paralisação', 'Condições Climáticas');
  const before = calls.length; await click('Aplicar filtros');
  assert.match(document.querySelector('[role="alert"]').textContent, /incompatíveis/); assert.equal(calls.length, before);
});
test('RDO apresenta duração, gráfico e ordenação sem inventar impacto financeiro', async () => {
  await render(); await input('Fonte dos registros', 'rdo'); await waitFor(() => card('Duração acumulada') === '7');
  assert.equal(card('Duração dos atrasos'), '3'); assert.equal(card('Duração das paralisações'), '4');
  await input('Indicador do gráfico', 'duracao'); assert.match(document.querySelector('.io-page svg').getAttribute('aria-label'), /Duração/);
  await input('Ordenar padrões', 'duracao_acumulada');
  assert.equal(card('Impacto financeiro estimado'), 'Dados insuficientes');
});
test('Filtros de recurso ficam desabilitados com motivo acessível', async () => {
  await render(); for (const label of ['Equipe', 'Maquinário', 'Insumo']) { const el = document.querySelector('[aria-label="' + label + '"]'); assert.equal(el.disabled, true); assert.equal(el.getAttribute('aria-describedby'), 'io-resource-reason'); }
  assert.match(document.getElementById('io-resource-reason').textContent, /vínculo direto/);
});
test('Erro remove os indicadores e tentar novamente recupera os dados', async () => {
  await render(); mode = 'error'; await click('Atualizar dados'); await waitFor(() => document.querySelector('.io-error'));
  assert.equal(card('Ocorrências registradas'), undefined); assert.match(document.querySelector('.io-error').textContent, /Falha de teste/);
  mode = 'normal'; await click('Tentar novamente'); await waitFor(() => card('Ocorrências registradas') === '3');
});
test('Sem documentos não apresenta gráfico nem duração fabricada', async () => {
  mode = 'empty'; await render(); assert.equal(card('Ocorrências registradas'), '0'); assert.equal(card('Duração acumulada'), 'Dados insuficientes'); assert.equal(document.querySelector('.io-page svg'), null);
  assert.ok(document.body.textContent.includes('Nenhuma ocorrência no recorte'));
});
test('Permissão negada mostra mensagem sem análise anterior', async () => {
  mode = 'denied'; await render(); assert.match(document.querySelector('.io-error').textContent, /Perfil sem acesso/); assert.equal(document.querySelector('.io-page svg'), null);
});
test('Construtora sem obras apresenta ausência de informações', async () => {
  mode = 'noWorks'; await render(); await waitFor(() => document.body.textContent.includes('Nenhuma obra disponível')); assert.equal(card('Ocorrências registradas'), undefined);
});
test('Navegação para Analytics e controle de tema existentes são preservados', async () => {
  await render(); await click('Analytics Financeiro'); await waitFor(() => location.pathname === '/escritorio/analytics');
  await act(async()=>document.querySelector('button[aria-label="Abrir perfil"]').click()); await tick(); await waitFor(() => button('Escuro')); await click('Escuro'); assert.equal(document.documentElement.dataset.theme, 'dark');
  await click('Inteligência Operacional'); await waitFor(() => card('Ocorrências registradas') === '3'); assert.equal(document.documentElement.dataset.theme, 'dark');
});

test('Sucesso tardio dos filtros não apaga falha da análise paralela', async () => {
  await render(); mode='slowMetaError'; await click('Atualizar dados'); await waitFor(()=>document.querySelector('.io-error'));
  await act(async()=>{await new Promise(r=>setTimeout(r,90));});
  assert.match(document.querySelector('.io-error').textContent,/Falha de teste/); assert.equal(card('Ocorrências registradas'),undefined);
});

test('Filtros avançados começam recolhidos e períodos rápidos aguardam aplicação',async()=>{
 await render();assert.equal(document.querySelector('.io-advanced').open,false);
 const before=calls.filter(c=>c.path==='/api/inteligencia-operacional').length;
 await click('Últimos 7 dias');
 assert.ok(document.querySelector('[aria-label="Data inicial"]').value);assert.ok(document.querySelector('[aria-label="Data final"]').value);
 assert.equal(calls.filter(c=>c.path==='/api/inteligencia-operacional').length,before);
 assert.ok(document.body.textContent.includes('Há alterações para aplicar'));
});
test('Demonstração é acessível sem misturar a identificação com obra real',async()=>{
 obras.push({id_obra:2,nome:'[DEMO] Obra de demonstração',id_construtora:1});
 await render();await click('Abrir demonstração');await waitFor(()=>document.querySelector('.io-demo-notice'));
 assert.match(document.querySelector('.io-demo-notice').textContent,/Não representam uma obra real/);
 assert.equal(document.querySelector('[aria-label="Obra"]').value,'2');
 assert.equal(localStorage.getItem('vertice_io_obra_7'),'2');
});
