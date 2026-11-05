import {fileURLToPath} from 'node:url';
import {resolveBrowserExecutable} from './browser-executable.mjs';
import {fixture,work} from './escritorio3.fixtures.mjs';
﻿import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {createServer} from 'vite';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let vite,chrome,ws,fail=false;const errors=[],consoleErrors=[];
try {
 vite=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),envFile:false,define:{'import.meta.env.VITE_API_URL':JSON.stringify('/mock-api')},server:{host:'127.0.0.1',port:0},plugins:[{name:'navigation-fixtures',configureServer(server){server.middlewares.use((req,res,next)=>{
  if(req.url.startsWith('/mock-api') && fixture(req,res)) return;
  if(req.url.startsWith('/mock-api')) {res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url.includes('/gestao/resumo')?Object.fromEntries(['ocorrencias','indicadores_diarios','indicadores_ocorrencias','equipes','terceirizadas','maquinarios','financeiro','planejamento','materiais','diarios','atividades'].map(k=>[k,[]])):req.url.includes('/usuarios/')?{id_usuario:901,nome:'Navigation test',idconstrutora:901}:[]));return;}
  if(req.url.includes('/pages/escritorio/Recursos.jsx')&&fail){fail=false;res.statusCode=503;res.end('Test chunk unavailable');return;}
  if(req.url.includes('/canteiro/CanteiroApp.jsx')){setTimeout(next,650);return;}
  if(/\/pages\/escritorio\/(Obras|Equipes)\.jsx/.test(req.url)){setTimeout(next,650);return;}
  next();
 });}}]});await vite.listen();const base=`http://127.0.0.1:${vite.httpServer.address().port}`;
 const profile=await mkdtemp(tmpdir()+'/vertice-navigation-');const port=10000+Math.floor(Math.random()*40000);
 chrome=spawn(resolveBrowserExecutable(),['--headless=new','--disable-gpu','--no-first-run',`--remote-debugging-port=${port}`,`--user-data-dir=${profile}`,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let target;for(let i=0;i<100;i++){try{target=await(await fetch(`http://127.0.0.1:${port}/json/new?about:blank`,{method:'PUT'})).json();break;}catch{await sleep(100);}}
 assert.ok(target);ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));let seq=0;const pending=new Map();
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.consoleAPICalled' && m.params.type==='error') consoleErrors.push(m.params.args.map(a=>a.description||a.value).join(' '));else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);});
 await cmd('Page.enable');await cmd('Runtime.enable');
 const evaluate=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<120;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('Timeout: '+expression+' '+await evaluate('document.body.innerText'));};
 const seed=ambiente=>`localStorage.clear();localStorage.setItem('id_usuario','901');localStorage.setItem('idconstrutora','901');localStorage.setItem('usuario',JSON.stringify({id_usuario:901,nome:'Navigation test',ambiente:${JSON.stringify(ambiente)},idconstrutora:901}));localStorage.setItem('vertice:session',JSON.stringify({id:'navigation-fixture',user:'901',csrf:'fixture',expiresAt:Date.now()+3600000}));`;
 await cmd('Page.navigate',{url:base+'/login'});await wait("!!document.querySelector('#email')");
 await cmd('Page.navigate',{url:base+'/cadastro'});await wait("!!document.querySelector('#email') && location.pathname==='/login'");
 for(const width of [1440,768,390,360,320]) {
  await cmd('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:width<768});
  for(const theme of ['light','dark']) {
   await evaluate(`document.documentElement.dataset.theme=${JSON.stringify(theme)};`);
   assert.equal(await evaluate("document.querySelector('.auth-brand-card h1').textContent"),'V\u00e9rtice');
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.auth-brand-card h1')).color"),'rgb(248, 251, 255)');
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.auth-brand-card h1')).textShadow"),'none');
   assert.equal(await evaluate("document.querySelector('.auth-brand-symbol img').complete && document.querySelector('.auth-brand-symbol img').naturalWidth>0"),true);
   assert.equal(await evaluate("[...document.querySelectorAll('.auth-brand-card,.auth-brand-card h1,.auth-brand-tagline')].every(e=>e.scrollWidth<=e.clientWidth+1)"),true,'Brand fits '+width+'/'+theme);
   assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Login overflow '+width+'/'+theme);
  }
  if(process.env.VERTICE_LOGIN_PREVIEW && [1440,390].includes(width)) {
   const screenshot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});const destination=profile+'/login-'+width+'.png';await writeFile(destination,Buffer.from(screenshot.data,'base64'));console.log('PREVIEW: '+destination);
  }
 }
 await cmd('Emulation.setDeviceMetricsOverride',{width:1440,height:960,deviceScaleFactor:1,mobile:false});
 await evaluate("document.documentElement.dataset.theme='light';document.querySelector('.auth-card form').requestSubmit();");assert.equal(await evaluate("document.querySelector('#email').validity.valueMissing"),true);
 await evaluate("for(const [selector,value] of [['#email','office@teste.local'],['#senha','Isolated-login-fixture!']]){const el=document.querySelector(selector);Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,value);el.dispatchEvent(new Event('input',{bubbles:true}));}");await evaluate("document.querySelector('.auth-card form').requestSubmit()");await wait("!!document.querySelector('.sidebar')");
 console.log('PASS: login brand at five widths, both themes, crisp typography, required fields and login submission');
 assert.equal(await evaluate("[...document.querySelectorAll('button,a')].some(e=>/cadastre-se/i.test(e.textContent))"),false);
 await cmd('Page.navigate',{url:base+'/cadastro'});await wait("!!document.querySelector('.sidebar') && location.pathname==='/escritorio'");
 await evaluate(seed('Escritorio'));await cmd('Page.navigate',{url:base+'/escritorio'});await wait("!!document.querySelector('.sidebar') && !!document.querySelector('.route-content h1')");
 await evaluate("window.shell=document.querySelector('.layout');window.sidebar=document.querySelector('.sidebar');window.header=document.querySelector('header');true;");
 for(const page of ['obras','equipes','perfil','dashboard']) {
  await evaluate(`document.querySelector('[data-page="${page}"]').click()`);await sleep(180);
  assert.equal(await evaluate('document.querySelector(".layout")===window.shell && document.querySelector(".sidebar")===window.sidebar && document.querySelector("header")===window.header'),true);
  assert.equal(await evaluate("/Carregando (p\u00e1gina|tela)/i.test(document.body.innerText)"),false);
  await wait(`localStorage.getItem('pagina_atual')==='${page}' && !!document.querySelector('[data-page="${page}"][aria-current="page"]')`);
 }
 await cmd('Page.getNavigationHistory').then(async ({entries,currentIndex})=>{await cmd('Page.navigateToHistoryEntry',{entryId:entries[currentIndex-1].id});});await wait("!!document.querySelector('[data-page=perfil][aria-current=page]')");await evaluate("document.querySelector('[data-page=dashboard]').click()");await wait("!!document.querySelector('[data-page=dashboard][aria-current=page]')");
 console.log('PASS: office navigation and persistent shell with slow chunks');
 await evaluate("document.querySelector('[data-page=\"analytics-financeiro\"]').dispatchEvent(new FocusEvent('focusin',{bubbles:true}))");await sleep(400);
 await wait("performance.getEntriesByType('resource').some(r=>r.name.includes('/AnalyticsFinanceiro.jsx'))");console.log('PASS: intent preloading');await wait("!!document.querySelector('.route-content')");
 await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate("getComputedStyle(document.querySelector('.route-content')).animationName"),'none');console.log('PASS: reduced motion');
 fail=true;await evaluate("document.querySelector('[data-page=\"recursos\"]').click()");await wait("!!document.querySelector('.route-content')===false && !!document.querySelector('[role=alert] button')");assert.equal(await evaluate('document.querySelector(".layout")===window.shell'),true);await evaluate("document.querySelector('[role=alert] button').click()");await wait("!!document.querySelector('.recursos-page') || (location.pathname==='/escritorio/recursos' && !!document.querySelector('.route-content h1'))");console.log('PASS: chunk error and reload retry preserve navigation');

 const input=async(selector,value)=>{await evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});if(!el)throw Error('Missing input '+${JSON.stringify(selector)});const proto=el.tagName==='SELECT'?HTMLSelectElement.prototype:HTMLInputElement.prototype;Object.getOwnPropertyDescriptor(proto,'value').set.call(el,${JSON.stringify(value)});el.dispatchEvent(new Event(el.tagName==='SELECT'?'change':'input',{bubbles:true}));})()`);};
 await evaluate("document.querySelector('[data-page=perfil]').click()");await wait("document.querySelector('.gestao-usuarios h2')?.textContent==='Gest\u00e3o de pessoas' && document.querySelectorAll('.usuarios-lista article').length===2");
 await input('.gestao-usuarios input[type=search]','Campo');await wait("document.querySelectorAll('.usuarios-lista article').length===1");
 await input('#usuario-nome','Novo acesso visual');await input('#usuario-email','new@teste.local');await input('#usuario-senha','Isolated-fixture-123!');await evaluate("document.querySelector('.usuarios-form').requestSubmit()");await wait("document.body.innerText.includes('confirmado')");
 console.log('PASS: people access metrics, search and user creation');
 await evaluate("document.querySelector('[data-page=equipes]').click()");await wait("[...document.querySelectorAll('.v3-panel h2')].some(e=>e.textContent==='Profissionais')");

 await wait("document.querySelector('.equipes-kpis dd')?.textContent==='2'");
 const teamValues=()=>evaluate("[...document.querySelectorAll('.equipes-kpis dd')].map(e=>e.textContent.replace(/\\s/g,''))");
 assert.deepEqual(await teamValues(),['2','8','R$100.000.099,99']);
 await input('#filtro-obra-equipe','901');await wait("document.querySelector('.equipes-kpis dd')?.textContent==='1'");assert.deepEqual(await teamValues(),['1','3','R$100,00']);
 await input('#filtro-area-equipe','Revestimentos');await wait("document.querySelector('.equipes-kpis dd')?.textContent==='0'");assert.deepEqual(await teamValues(),['0','0','R$0,00']);
 await evaluate("document.querySelector('.filtros-equipes button').click()");await input('#pesquisa-equipe','acabamento');await wait("document.querySelector('.equipes-kpis dd')?.textContent==='1'");assert.deepEqual(await teamValues(),['1','5','R$99.999.999,99']);
 for(const [width,columns] of [[1440,3],[1024,2],[768,2],[390,1],[360,1]]) {
  await cmd('Emulation.setDeviceMetricsOverride',{width,height:900,deviceScaleFactor:1,mobile:width<768});
  assert.equal(await evaluate("getComputedStyle(document.querySelector('.equipes-kpis')).gridTemplateColumns.split(' ').length"),columns,'KPI columns at '+width);
  assert.equal(await evaluate("[...document.querySelectorAll('.equipes-kpi')].every(e=>e.scrollWidth<=e.clientWidth+1)"),true,'No card clipping at '+width);
  assert.equal(await evaluate("[...document.querySelectorAll('.equipes-kpi dd')].every(e=>e.scrollWidth<=e.clientWidth+1)"),true,'No value clipping at '+width);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'No page overflow at '+width);
 }
 await cmd('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});
 assert.equal(await evaluate("document.querySelector('#filtro-obra-equipe').getBoundingClientRect().width<=220"),true);
 assert.equal(await evaluate("new Set([...document.querySelectorAll('.equipes-kpi')].map(e=>e.getBoundingClientRect().height)).size"),1);
 await evaluate("document.documentElement.dataset.theme='dark';document.querySelector('#filtro-obra-equipe').focus();");
 assert.equal(await evaluate("getComputedStyle(document.querySelector('#filtro-obra-equipe')).height"),'42px');
 await evaluate("document.documentElement.dataset.theme='light';document.querySelector('.filtros-equipes button').click();");await wait("document.querySelector('.equipes-kpis dd')?.textContent==='2'");
 console.log('PASS: team filters synchronize all KPIs, empty results, large currency values, responsive grid, compact controls and dark theme');
 await evaluate("[...document.querySelectorAll('summary')].find(e=>e.textContent==='Cadastrar profissional').click()");
 const professional=".v3-panel:has(h2) form";
 await input(professional+' input[maxlength="150"]','Integrante visual');await input(professional+' input[maxlength="50"]','VIS-1');await input(professional+' input[maxlength="100"]','Pedreiro');await input(professional+' select','interna:901');await evaluate("document.querySelector('.v3-panel form').requestSubmit()");await wait("document.querySelector('.v3-people')?.parentElement?.innerText.includes('Integrante visual') || [...document.querySelectorAll('.profissionais-panel .v3-people article')].some(e=>e.innerText.includes('Integrante visual'))");
 console.log('PASS: individual professional creation and team membership');
 await evaluate(`localStorage.setItem('obra_selecionada',JSON.stringify(${JSON.stringify(work)}))`);await cmd('Page.navigate',{url:base+'/escritorio/obra'});await wait("[...document.querySelectorAll('button')].some(b=>b.textContent.trim()==='Indicadores')");await evaluate("[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Indicadores').click()");await wait("!!document.querySelector('.v3-indicators') && !!document.querySelector('.v3-panel details')");
 await evaluate("[...document.querySelectorAll('summary')].find(e=>e.textContent==='Registrar despesa realizada').click()");await wait("!!document.querySelector('.v3-panel form button[type=submit]:not(:disabled)')");await input('.v3-panel form select','901');await input('.v3-panel form label:nth-child(2) select','901');await input('.v3-panel form label:nth-child(4) select','901');await input('.v3-panel form input[type=number]','2');await input('.v3-panel form label:nth-child(6) input','30');await evaluate("document.querySelector('.v3-panel form').requestSubmit()");await wait("document.body.innerText.includes('Despesa confirmada')");
 await wait("[...document.querySelectorAll('.v3-indicators dd')].some(e=>e.textContent.includes('60,00'))");
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
 console.log('PASS: grouped work indicators, expense creation, financial refresh and mobile layout');
 await evaluate("document.querySelector('[data-page=analytics-financeiro]').click()");await wait("!!document.querySelector('#analytics-obra option[value=\"901\"]')");await input('#analytics-obra','901');await wait("!!document.querySelector('.analytics-chart svg')");assert.equal(await evaluate("document.querySelectorAll('.analytics-point-realizado').length"),1);console.log('PASS: financial chart renders a single dated expense');
 await evaluate("document.querySelector('[data-page=dashboard]').click()");await wait("!!document.querySelector('.gestao-filtros')");await input('.gestao-filtros input[type=date]','2026-10-01');await input('.gestao-filtros label:last-of-type input','2026-10-10');await evaluate("document.querySelector('.gestao-filtros').requestSubmit()");await wait("performance.getEntriesByType('resource').some(e=>e.name.includes('inicio=2026-10-01')&&e.name.includes('fim=2026-10-10'))");await evaluate("[...document.querySelectorAll('.gestao-filtros button')].find(b=>b.textContent==='Limpar filtros').click()");assert.equal(await evaluate("document.querySelector('.gestao-filtros input[type=date]').value"),'');console.log('PASS: operational period apply and clear filters');
 await evaluate(seed('Canteiro'));await cmd('Page.navigate',{url:base+'/canteiro'});await wait("!!document.querySelector('.ct-nav')");await sleep(180);assert.equal(await evaluate("!!document.querySelector('.route-placeholder') && getComputedStyle(document.querySelector('.route-placeholder')).opacity==='1'"),true);await wait("!!document.querySelector('.route-content')");await evaluate("window.field=document.querySelector('.ct-app');window.nav=document.querySelector('.ct-nav');true;");
 await cmd('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 for(const page of ['canteiro-registrar','canteiro-pendencias','canteiro-historico','canteiro-perfil','canteiro-home']) {
  await evaluate(`document.querySelector('[data-page="${page}"]').click()`);await wait(`!!document.querySelector('[data-page="${page}"][aria-current="page"]')`);
  assert.equal(await evaluate("document.querySelector('.ct-app')===window.field && document.querySelector('.ct-nav')===window.nav"),true);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);
 }
 console.log('PASS: field navigation, persistent shell and mobile layout');
 assert.ok(consoleErrors.every(error=>error.includes('Failed to fetch dynamically imported module:')),consoleErrors.join('\n'));
 assert.ok(errors.length <= 1,'Only the deliberately failed import may raise an exception');
} finally {ws?.close();chrome?.kill();await vite?.close();}
