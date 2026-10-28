import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const { calcular } = require('../../backend/services/inteligenciaOperacional');
const { ETAPAS, TURNOS, CLIMAS } = require('../../backend/config/inteligenciaOperacional');
const base = process.env.VERTICE_BROWSER_URL || 'http://localhost:5174', port = 9336;
const profile = path.resolve('node_modules/.cache/operacional-browser-' + Date.now());
await mkdir(profile, { recursive: true });
const chrome = spawn('C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', '--disable-gpu', '--no-proxy-server', '--no-first-run', '--no-default-browser-check', '--remote-debugging-port=' + port, '--user-data-dir=' + profile, 'about:blank'], { windowsHide: true, stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let ws, mode = 'normal', sequence = 0;
const pending = new Map(), exceptions = [], reactErrors = [], requests = [], passed = [];
const user = { id_usuario: 7, nome: 'Gestão de teste', email: 'gestao@exemplo.invalid', idconstrutora: 1, status: 'Ativo', ocupacao: 'Gerência', ambiente: 'Escritório' };
const obras = [{ id_obra: 1, nome: 'Obra de teste da análise operacional', id_construtora: 1 }, { id_obra: 2, nome: 'Obra sem registros', id_construtora: 1 }];
function fixture(query) {
  const f = Object.fromEntries(query), source = f.fonte || 'diario';
  let docs = [1, 2, 3].map(i => ({ id_registro: source + ':' + i, id_obra: 1, data: '2026-10-0' + i, turno: 'Manhã', clima: 'Chuvoso' }));
  let events = docs.map((d, i) => ({ ...d, id: source + '-evento:' + i, tipo: i === 2 ? 'paralisacao' : 'atraso', origem: i === 2 ? 'Condições Climáticas' : i === 1 ? 'Insumos' : 'Equipes', etapa: 'Infraestrutura', duracao: source === 'diario' ? null : [2, 1, 4][i], descricao: 'Ocorrência registrada para teste de navegador' }));
  docs = docs.filter(d => (!f.inicio || d.data >= f.inicio) && (!f.fim || d.data <= f.fim) && (!f.turno || d.turno === f.turno) && (!f.clima || d.clima === f.clima));
  const ids = new Set(docs.map(d => d.id_registro));
  events = events.filter(e => ids.has(e.id_registro) && (!f.tipo || e.tipo === f.tipo) && (!f.etapa || e.etapa === f.etapa) && (!f.origem_atraso || (e.tipo === 'atraso' && e.origem === f.origem_atraso)) && (!f.origem_paralisacao || (e.tipo === 'paralisacao' && e.origem === f.origem_paralisacao)));
  if (mode === 'empty' || f.id_obra === '2') { docs = []; events = []; }
  return { obra: obras.find(o => o.id_obra === Number(f.id_obra)) || obras[0], ...calcular({ registros: docs, ocorrencias: events }, { ...f, fonte: source, agrupamento: f.agrupamento || 'dia' }) };
}
function cmd(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++sequence, timeout = setTimeout(() => { pending.delete(id); reject(new Error('Timeout CDP: ' + method)); }, 15000);
    pending.set(id, { resolve, reject, timeout }); ws.send(JSON.stringify({ id, method, params }));
  });
}
async function intercept(p) {
  const url = new URL(p.request.url), route = url.pathname;
  requests.push({ method: p.request.method, path: route, query: url.search });
  let status = 200, body;
  if (p.request.method === 'OPTIONS') status = 204;
  else if (route === '/api/inteligencia-operacional/filtros') body = { obras, etapas: ETAPAS, turnos: TURNOS, climas: CLIMAS, recursos: { equipes: [{ id: 1, nome: 'Equipe de teste' }], maquinarios: [{ id: 1, nome: 'Máquina de teste' }], insumos: [{ id: 1, nome: 'Insumo de teste' }] }, origens: { atraso: ['Equipes', 'Insumos'], paralisacao: ['Condições Climáticas'] }, motivo_recursos: 'Sem vínculo direto de ocorrência com recurso.', recursos_disponiveis: false };
  else if (route === '/api/inteligencia-operacional') {
    await sleep(120);
    if (mode === 'error' || mode === 'denied') { status = mode === 'denied' ? 403 : 500; body = { message: mode === 'denied' ? 'Perfil sem acesso à análise.' : 'Erro temporário de teste.' }; }
    else body = fixture(url.searchParams);
  } else if (route.startsWith('/api/usuarios/')) body = user;
  else if (route === '/api/obras') body = obras;
  else body = [];
  await cmd('Fetch.fulfillRequest', { requestId: p.requestId, responseCode: status, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }, { name: 'Access-Control-Allow-Origin', value: base }, { name: 'Access-Control-Allow-Methods', value: 'GET,POST,OPTIONS' }, { name: 'Access-Control-Allow-Headers', value: 'content-type,authorization' }], body: status === 204 ? '' : Buffer.from(JSON.stringify(body)).toString('base64') });
}
async function evaluate(expression) {
  const r = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true });
  if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
  return r.result.value;
}
async function waitFor(expression) {
  for (let i = 0; i < 160; i++) { if (await evaluate(expression)) return; await sleep(100); }
  throw new Error('Não encontrado: ' + expression + '\n' + await evaluate('document.body.innerText'));
}
async function click(text) {
  await evaluate("(()=>{const b=[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===" + JSON.stringify(text) + ");if(!b||b.disabled)throw new Error('Botão indisponível: '+ " + JSON.stringify(text) + ");b.click();})()");
}
async function input(label, value) {
  await evaluate("(()=>{const el=document.querySelector('[aria-label=" + JSON.stringify(label) + "]');if(!el)throw new Error('Campo ausente');const setter=Object.getOwnPropertyDescriptor(el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype,'value').set;setter.call(el," + JSON.stringify(value) + ");el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()");
  await sleep(60);
}
const card = title => "[...document.querySelectorAll('.io-page .card')].find(c=>c.querySelector('h3')?.textContent===" + JSON.stringify(title) + ")?.querySelector('.card-value')?.textContent";
try {
  let target;
  for (let i = 0; i < 80; i++) { try { target = await (await fetch('http://127.0.0.1:' + port + '/json/new?about:blank', { method: 'PUT' })).json(); break; } catch { await sleep(150); } }
  assert.ok(target?.webSocketDebuggerUrl, 'Chrome não iniciou');
  ws = new WebSocket(target.webSocketDebuggerUrl); await new Promise((resolve, reject) => { ws.addEventListener('open', resolve); ws.addEventListener('error', reject); });
  ws.addEventListener('message', async ev => {
    const m = JSON.parse(ev.data);
    if (m.id) { const p = pending.get(m.id); if (!p) return; clearTimeout(p.timeout); pending.delete(m.id); m.error ? p.reject(new Error(JSON.stringify(m.error))) : p.resolve(m.result); }
    else if (m.method === 'Fetch.requestPaused') { try { await intercept(m.params); } catch (e) { exceptions.push(e.message); } }
    else if (m.method === 'Runtime.exceptionThrown') exceptions.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
    else if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      const message = m.params.args.map(a => a.value || a.description || '').join(' ');
      if (/React|unique.*key|Maximum update|Warning:/i.test(message)) reactErrors.push(message);
    }
  });
  await cmd('Runtime.enable'); await cmd('Page.enable'); await cmd('Network.enable');
  await cmd('Fetch.enable', { patterns: [{ urlPattern: '*localhost:3000/api/*' }] });
  await cmd('Page.navigate', { url: base + '/login' }); await waitFor("!!document.querySelector('#email')");
  await evaluate("localStorage.clear();localStorage.setItem('usuario'," + JSON.stringify(JSON.stringify(user)) + ");localStorage.setItem('id_usuario','7');localStorage.setItem('idconstrutora','1');localStorage.setItem('ambiente','Escritório');localStorage.setItem('ocupacao','Gerência');localStorage.setItem('token','token-simulado');localStorage.setItem('pagina_atual','dashboard');");
  await cmd('Page.navigate', { url: base + '/escritorio' }); await waitFor("!!document.querySelector('.sidebar')");
  await click('Inteligência Operacional');
  await waitFor("document.querySelector('.io-page h1')?.textContent==='Inteligência Operacional'");
  await waitFor("document.body.innerText.includes('Carregando dados operacionais')");
  await waitFor(card('Ocorrências registradas') + "==='3'");
  assert.equal(await evaluate("location.pathname"), '/escritorio/inteligencia-operacional');
  assert.equal(await evaluate("document.querySelectorAll('.io-page select:disabled').length"), 3);
  assert.equal(await evaluate(card('Duração acumulada')), 'Dados insuficientes');
  passed.push('Menu do Escritório, carregamento, fonte Diário, indicadores reais da fixture e filtros indisponíveis explicados');
  await input('Data inicial', '2026-10-02'); await input('Data final', '2026-10-03'); await input('Etapa-padrão', 'Infraestrutura'); await input('Tipo de ocorrência', 'atraso');
  await click('Aplicar filtros'); await waitFor(card('Ocorrências registradas') + "==='1'");
  const last = requests.filter(r => r.path === '/api/inteligencia-operacional').at(-1);
  assert.ok(last.query.includes('inicio=2026-10-02') && last.query.includes('etapa=Infraestrutura') && last.query.includes('tipo=atraso'));
  passed.push('Filtros combinados recalculam indicadores e seguem para a API');
  await input('Origem da paralisação', 'Condições Climáticas'); const before = requests.length; await click('Aplicar filtros');
  await waitFor("document.body.innerText.includes('incompatíveis')"); assert.equal(requests.length, before);
  await click('Limpar filtros'); await waitFor(card('Ocorrências registradas') + "==='3'");
  passed.push('Combinações incompatíveis explicadas sem consulta; limpar filtros restaura resultados');
  await input('Fonte dos registros', 'rdo'); await waitFor(card('Duração acumulada') + "==='7'");
  await input('Indicador do gráfico', 'duracao'); await waitFor("!!document.querySelector('.io-page svg[aria-label*=\"Duração\"]')");
  await input('Ordenar padrões', 'duracao_acumulada'); await input('Fator registrado', 'clima');
  assert.ok(await evaluate("!!document.querySelector('.io-page svg rect')"));
  passed.push('Fonte RDO, duração, ordenação de padrões, associação e gráfico');
  const light = await evaluate("getComputedStyle(document.querySelector('.io-page .card')).backgroundColor");
  await mkdir('tests/screenshots', { recursive: true });
  for (const width of [375, 390, 768, 1366]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: width < 768 }); await sleep(100);
    assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'), false, 'Overflow na largura ' + width);
    if (width === 390) { const image = await cmd('Page.captureScreenshot', { format: 'png' }); await writeFile('tests/screenshots/inteligencia-operacional-390.png', Buffer.from(image.data, 'base64')); }
  }
  await evaluate("document.documentElement.dataset.theme='dark'");
  const dark = await evaluate("getComputedStyle(document.querySelector('.io-page .card')).backgroundColor"); assert.notEqual(light, dark);
  const darkImage = await cmd('Page.captureScreenshot', { format: 'png' }); await writeFile('tests/screenshots/inteligencia-operacional-dark.png', Buffer.from(darkImage.data, 'base64'));
  passed.push('Responsividade em 375, 390, 768 e 1366 px, tabela/gráfico com rolagem própria e temas claro/escuro');
  mode = 'error'; await click('Atualizar dados'); await waitFor("document.body.innerText.includes('Erro temporário de teste')");
  assert.equal(await evaluate("!!document.querySelector('.io-page svg')"), false);
  mode = 'normal'; await click('Tentar novamente'); await waitFor(card('Ocorrências registradas') + "==='3'");
  passed.push('Falha remove resultados antigos; tentar novamente recupera os dados');
  mode = 'empty'; await click('Atualizar dados'); await waitFor("document.body.innerText.includes('Nenhuma ocorrência no recorte')");
  assert.equal(await evaluate(card('Duração acumulada')), 'Dados insuficientes');
  passed.push('Ausência de documentos não inventa duração nem gráfico');
  mode = 'denied'; await click('Atualizar dados'); await waitFor("document.body.innerText.includes('Perfil sem acesso')");
  passed.push('Erro de permissão é apresentado sem expor resultados');
  mode = 'normal'; await cmd('Page.reload'); await waitFor(card('Ocorrências registradas') + "==='3'");
  assert.equal(await evaluate('location.pathname'), '/escritorio/inteligencia-operacional');
  await click('Analytics Financeiro'); await waitFor("location.pathname==='/escritorio/analytics'");
  passed.push('Recarga da URL direta e navegação para Analytics Financeiro preservadas');
  assert.deepEqual(exceptions, []); assert.deepEqual(reactErrors, []);
  assert.ok(requests.every(r => ['GET', 'OPTIONS'].includes(r.method)), 'Teste de análise efetuou escrita');
  await writeFile('tests/inteligencia-operacional-browser-result.json', JSON.stringify({ passou: true, verificacoes: passed.length, resultados: passed, excecoes: exceptions, errosReact: reactErrors, somenteLeitura: true }, null, 2));
  console.log(passed.join('\n')); console.log('PASSOU: ' + passed.length + ' cenários de navegador; sem exceções ou erros React.');
} finally {
  if (ws?.readyState === WebSocket.OPEN) { try { ws.send(JSON.stringify({ id: 999999, method: 'Browser.close' })); } catch {} ws.close(); }
  chrome.kill();
}
