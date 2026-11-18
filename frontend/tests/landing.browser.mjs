import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,mkdir,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {resolveBrowserExecutable} from './browser-executable.mjs';
import {fixture} from './escritorio3.fixtures.mjs';
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
let vite,chrome,ws;const pending=new Map(),errors=[],consoleErrors=[],requests=[];let seq=0;
try{
 vite=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),envFile:false,define:{'import.meta.env.VITE_API_URL':JSON.stringify('/mock-api')},server:{host:'localhost',port:0},plugins:[{name:'landing-fixtures',configureServer(server){server.middlewares.use((req,res,next)=>{
  if(!req.url.startsWith('/mock-api'))return next();requests.push(req.url);
  if(fixture(req,res))return;
  res.setHeader('Content-Type','application/json');res.end(JSON.stringify(req.url.includes('/gestao/resumo')?Object.fromEntries(['ocorrencias','indicadores_diarios','indicadores_ocorrencias','equipes','terceirizadas','maquinarios','financeiro','planejamento','materiais','diarios','atividades'].map(k=>[k,[]])):req.url.includes('/usuarios/')?{id_usuario:901,nome:'Navigation test',idconstrutora:901}:[]));
 });}}]});await vite.listen();
 const base='http://localhost:'+vite.httpServer.address().port,profile=await mkdtemp(tmpdir()+'/vertice-landing-');const port=10000+Math.floor(Math.random()*40000);
 chrome=spawn(resolveBrowserExecutable(),['--headless=new','--disable-gpu','--no-first-run','--remote-debugging-port='+port,'--user-data-dir='+profile,'about:blank'],{windowsHide:true,stdio:'ignore'});
 let target;for(let i=0;i<80;i++){try{target=await(await fetch('http://127.0.0.1:'+port+'/json/new?about:blank',{method:'PUT'})).json();break;}catch{await sleep(100);}}
 assert.ok(target,'Navegador não iniciou');ws=new WebSocket(target.webSocketDebuggerUrl);await new Promise(r=>ws.addEventListener('open',r));
 const cmd=(method,params={})=>new Promise((resolve,reject)=>{const id=++seq;pending.set(id,{resolve,reject});ws.send(JSON.stringify({id,method,params}));});
 ws.addEventListener('message',event=>{const m=JSON.parse(event.data);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(Error(m.error.message)):p.resolve(m.result);}else if(m.method==='Runtime.exceptionThrown')errors.push(m.params.exceptionDetails.text);else if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')consoleErrors.push(m.params.args.map(a=>a.description||a.value).join(' '));});
 const evaluate=async expression=>{const r=await cmd('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw Error(r.exceptionDetails.exception?.description||r.exceptionDetails.text);return r.result.value;};
 const wait=async expression=>{for(let i=0;i<100;i++){if(await evaluate(expression))return;await sleep(100);}throw Error('Timeout: '+expression+'; '+(await evaluate('document.body.innerText')).slice(0,450));};
 await cmd('Page.enable');await cmd('Runtime.enable');await cmd('Page.navigate',{url:base+'/'});await wait("!!document.querySelector('.lp h1')");
 assert.equal(await evaluate('location.pathname'),'/');assert.equal(requests.length,0,'Landing pública não deve consultar dados privados');console.log(JSON.stringify(await evaluate("({leadFont:getComputedStyle(document.querySelector('.lp-lead')).fontFamily,navPosition:getComputedStyle(document.querySelector('.lp-nav')).position})")));
 assert.equal(await evaluate("document.querySelectorAll('h1').length"),1);
 assert.equal(await evaluate("[...document.querySelectorAll('.lp a[href^=\"#\"]')].every(a=>document.getElementById(a.hash.slice(1)))"),true);
 assert.equal(await evaluate("[...document.querySelectorAll('.lp a.lp-button')].filter(a=>a.textContent.includes('Acessar')).every(a=>a.pathname==='/login')"),true);
 await mkdir(new URL('./screenshots/',import.meta.url),{recursive:true});
 // FAQ: initial state, ARIA relationships, exclusive expansion and keyboard activation.
 assert.equal(await evaluate("document.querySelectorAll('#faq h3 button').length"),10);
 assert.equal(await evaluate("document.querySelectorAll('#faq button[aria-expanded=\"true\"]').length"),0);
 assert.equal(await evaluate("[...document.querySelectorAll('#faq h3 button')].every(b=>{const p=document.getElementById(b.getAttribute('aria-controls'));return p && p.getAttribute('aria-labelledby')===b.id && p.inert && p.getAttribute('aria-hidden')==='true';})"),true);
 assert.equal(await evaluate("document.querySelector('#faq').previousElementSibling.id==='sobre' && document.querySelector('#faq').nextElementSibling.classList.contains('lp-cta')"),true);
 for(let i=0;i<10;i++){
  await evaluate(`document.querySelectorAll('#faq h3 button')[${i}].click()`);
  assert.equal(await evaluate("document.querySelectorAll('#faq button[aria-expanded=\"true\"]').length"),1);
  assert.equal(await evaluate(`document.querySelectorAll('#faq h3 button')[${i}].getAttribute('aria-expanded')`),'true');
  assert.equal(await evaluate(`document.querySelectorAll('#faq .lp-faq-answer')[${i}].inert`),false);
 }
 await evaluate("document.querySelectorAll('#faq h3 button')[9].click();document.querySelector('#faq h3 button').focus()");
 for(const key of [{key:'Enter',code:'Enter',windowsVirtualKeyCode:13},{key:' ',code:'Space',windowsVirtualKeyCode:32}]){
  await cmd('Input.dispatchKeyEvent',{type:'keyDown',...key,text:key.key==='Enter'?'\r':' '});await cmd('Input.dispatchKeyEvent',{type:'keyUp',...key});await sleep(50);
  assert.equal(await evaluate("document.querySelector('#faq h3 button').getAttribute('aria-expanded')"),key.key==='Enter'?'true':'false');
 }
 await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Tab',code:'Tab',windowsVirtualKeyCode:9});
 assert.equal(await evaluate("document.activeElement===document.querySelectorAll('#faq h3 button')[1]"),true);
 await sleep(300);
 assert.equal(await evaluate("[...document.querySelectorAll('#faq .lp-faq-answer')].every(p=>p.getBoundingClientRect().height===0 && getComputedStyle(p).visibility==='hidden')"),true);
 const ax=await cmd('Accessibility.getFullAXTree');
 assert.equal(ax.nodes.filter(n=>!n.ignored && n.role?.value==='button' && n.name?.value==='O que é a Vértice?').length,1);
 for(const width of [1440,1281,1280,1101,1024,768,390,320]){
  await cmd('Emulation.setDeviceMetricsOverride',{width,height:960,deviceScaleFactor:1,mobile:width<768});
  await evaluate('window.scrollTo({top:0,behavior:"instant"})');await sleep(150);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'Overflow em '+width);
  assert.equal(await evaluate("getComputedStyle(document.body).overflowY==='hidden'"),false);
  if(width>1100){
   assert.equal(await evaluate("getComputedStyle(document.querySelector('#lp-navigation')).display"),'flex','Links visíveis no topo em '+width);
   assert.equal(await evaluate("getComputedStyle(document.querySelector('.lp-menu-toggle')).display"),'none');
   assert.equal(await evaluate("document.querySelector('.lp-home').getBoundingClientRect().right<document.querySelector('#lp-navigation').getBoundingClientRect().left"),true,'Logo e menu sem sobreposição em '+width);
  }
  if(width<=1100){await evaluate("document.querySelector('.lp-menu-toggle').click()");assert.equal(await evaluate("document.querySelector('.lp-menu-toggle').getAttribute('aria-expanded')"),'true');await cmd('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});assert.equal(await evaluate("document.querySelector('.lp-menu-toggle').getAttribute('aria-expanded')"),'false');await evaluate("document.querySelector('.lp-menu-toggle').click();document.querySelector('#lp-navigation a[href=\"#solucao\"]').click()");assert.equal(await evaluate("document.querySelector('.lp-menu-toggle').getAttribute('aria-expanded')"),'false');}
  await evaluate("document.querySelector('#faq').scrollIntoView({behavior:'instant'});document.querySelectorAll('#faq h3 button')[2].click()");await sleep(700);
  assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false,'FAQ overflow em '+width);
  assert.equal(await evaluate("document.querySelectorAll('#faq .lp-faq-answer')[2].getBoundingClientRect().height>0"),true);
  assert.equal(await evaluate("[...document.querySelectorAll('.lp-navigation>a')].every(a=>getComputedStyle(a.parentElement).display==='none' || a.getBoundingClientRect().right<=innerWidth)"),true,'Menu overflow em '+width);
  if([1440,390,320].includes(width)){const shot=await cmd('Page.captureScreenshot',{format:'png'});await writeFile(new URL('./screenshots/faq-'+width+'.png',import.meta.url),Buffer.from(shot.data,'base64'));}
  await evaluate("document.querySelectorAll('#faq h3 button')[2].click()");
  if(width===390){
   await cmd('Emulation.setTouchEmulationEnabled',{enabled:true});
   await evaluate("document.querySelector('#faq h3 button').scrollIntoView({block:'center',behavior:'instant'})");
   await sleep(450);
   const point=await evaluate("(()=>{const r=document.querySelector('#faq h3 button').getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2};})()");
   await cmd('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:[point]});await cmd('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await sleep(100);
   assert.equal(await evaluate("document.querySelector('#faq h3 button').getAttribute('aria-expanded')"),'true');
   await evaluate("document.querySelector('#faq h3 button').click()");await cmd('Emulation.setTouchEmulationEnabled',{enabled:false});
  }
  if([1440,390,320].includes(width)){await evaluate('window.scrollTo({top:0,behavior:"instant"})');await sleep(100);const shot=await cmd('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});await writeFile(new URL('./screenshots/landing-'+width+'.png',import.meta.url),Buffer.from(shot.data,'base64'));}
 }
 for(const section of ['solucao','funcionalidades','ambientes','como-funciona','sobre','faq']){await evaluate("document.getElementById('"+section+"').scrollIntoView()");await sleep(1100);assert.ok(await evaluate("document.querySelector('.lp-nav').getBoundingClientRect().top>=-1"),'Navbar fixa ao rolar');assert.equal(await evaluate('document.documentElement.scrollWidth>innerWidth+1'),false);if(['solucao','funcionalidades'].includes(section)){const shot=await cmd('Page.captureScreenshot',{format:'png'});await writeFile(new URL('./screenshots/landing-'+section+'.png',import.meta.url),Buffer.from(shot.data,'base64'));}}
 await evaluate("document.querySelectorAll('.lp-env-select button')[1].click()");assert.match(await evaluate("document.querySelector('#lp-env-detail').textContent"),/Fotos e ocorrências/);
 await cmd('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'reduce'}]});assert.equal(await evaluate("getComputedStyle(document.documentElement).scrollBehavior"),'auto');
 assert.equal(await evaluate("getComputedStyle(document.querySelector('.lp-faq-answer')).transitionDuration"),'0s');
 await evaluate("document.querySelector('#faq h3 button').click()");
 assert.equal(await evaluate("document.querySelector('#faq .lp-faq-answer').getBoundingClientRect().height>0"),true);
 assert.equal(requests.length,0,'Interagir com o FAQ não deve fazer chamadas autenticadas');
 await evaluate("document.querySelector('.lp-actions a[href=\"/login\"]').click()");await wait("location.pathname==='/login' && !!document.querySelector('#email')");
 for(const path of ['/escritorio','/canteiro']){await cmd('Page.navigate',{url:base+path});await wait("location.pathname==='/login' && !!document.querySelector('#email')");}
 for(const ambiente of ['Escritorio','Canteiro']){
  await cmd('Page.navigate',{url:base+'/'});await wait("!!document.querySelector('.lp')");
  await evaluate(`localStorage.clear();localStorage.setItem('id_usuario','901');localStorage.setItem('idconstrutora','901');localStorage.setItem('usuario',JSON.stringify({id_usuario:901,nome:'Navigation test',ambiente:${JSON.stringify(ambiente)},idconstrutora:901}));localStorage.setItem('vertice:session',JSON.stringify({id:'landing-fixture',user:'901',csrf:'fixture',expiresAt:Date.now()+3600000}));localStorage.setItem('pagina_atual','perfil');`);
  const before=await evaluate("localStorage.getItem('vertice:session')");await cmd('Page.navigate',{url:base+'/'});await wait("!!document.querySelector('.lp')");assert.equal(await evaluate("localStorage.getItem('vertice:session')"),before);assert.equal(await evaluate("localStorage.getItem('pagina_atual')"),'perfil');
  const route=ambiente==='Canteiro'?'/canteiro':'/escritorio';await cmd('Page.navigate',{url:base+route});await wait(ambiente==='Canteiro'?"!!document.querySelector('.ct-app')":"!!document.querySelector('.layout')");assert.equal(await evaluate('location.pathname'),route);
  const forbidden=ambiente==='Canteiro'?'/escritorio':'/canteiro';await cmd('Page.navigate',{url:base+forbidden});await wait('location.pathname==='+JSON.stringify(route));
 }
 assert.deepEqual(errors,[]);assert.deepEqual(consoleErrors,[]);
 console.log('PASS: landing, links, login, FAQ (10 perguntas, ARIA, teclado e toque), 8 larguras, menu, reduced motion e sessões/rotas por perfil com fixtures; nenhum backend real acessado.');
}finally{ws?.close();chrome?.kill();await vite?.close();}
