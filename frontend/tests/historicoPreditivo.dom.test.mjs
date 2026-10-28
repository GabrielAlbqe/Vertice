import {pathToFileURL} from 'node:url';
import {test,beforeEach,afterEach} from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp,mkdir,rm} from 'node:fs/promises';
import path from 'node:path';
import {JSDOM} from 'jsdom';
import {build} from 'esbuild';
import {act,createElement} from 'react';
await mkdir('node_modules/.cache',{recursive:true});
const cache=await mkdtemp(path.resolve('node_modules/.cache/hp-dom-'));
await build({entryPoints:['src/pages/escritorio/HistoricoPreditivo.jsx'],outfile:path.join(cache,'page.mjs'),bundle:true,platform:'node',format:'esm',packages:'external',jsx:'automatic',loader:{'.css':'empty','.png':'dataurl'},logLevel:'silent'});
let dom,root,Page,mode,calls;
globalThis.IS_REACT_ACT_ENVIRONMENT=true;
const payload={versao:'teste',gerado_em:'2026-10-28T12:00:00Z',obra:{nome:'[DEMO] Exemplo',demonstracao:true},resumo:{orcamento:1000,custo_ate_fim:100,dias_observados:0,ocorrencias:0},financeiro:[],eva:[],operacional:[],ultimo:null,tendencia:{situacao:'Dados insuficientes',anterior:null,recente:null},alertas:[],auditoria:[],limites:['Somente leitura']};
beforeEach(async()=>{
 dom=new JSDOM('<div id="root"></div>',{url:'http://localhost:5173/escritorio/historico-preditivo'});
 for(const key of ['window','document','localStorage','location','history','HTMLElement','HTMLInputElement','Event','navigator'])Object.defineProperty(globalThis,key,{configurable:true,value:dom.window[key]});
 localStorage.setItem('token','simulado');mode='ok';calls=[];
 globalThis.fetch=async(input,opts)=>{const url=new URL(input);calls.push({url,opts});let data=url.pathname.includes('/filtros')?{obras:[{id_obra:1,nome:'Exemplo'}]}:payload;const status=url.pathname.includes('/historico-preditivo')&&mode==='erro'?403:200;if(status===403)data={message:'Sem permissão.'};return new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}});};
 Page=(await import(pathToFileURL(path.join(cache,'page.mjs')).href)).default;
 const {createRoot}=await import('react-dom/client');root=createRoot(document.getElementById('root'));
 await act(async()=>{root.render(createElement(Page,{onNavegar:()=>{}}));await new Promise(r=>setTimeout(r,20));});
});
afterEach(async()=>{await act(()=>root.unmount());dom.window.close();});
async function submit(){await act(async()=>{document.querySelector('form').dispatchEvent(new Event('submit',{bubbles:true,cancelable:true}));await new Promise(r=>setTimeout(r,20));});}
test('Histórico consulta apenas por GET e identifica demonstração e dados insuficientes',async()=>{
 await submit();assert.match(document.body.textContent,/Obra de demonstração/);assert.match(document.body.textContent,/RUP: dados insuficientes/);assert.match(document.body.textContent,/Nenhum indicador registrado/);assert.ok(calls.every(c=>!c.opts?.method||c.opts.method==='GET'));
});
test('Histórico remove resultado anterior ao receber permissão negada',async()=>{
 await submit();mode='erro';await submit();assert.match(document.querySelector('[role="alert"]').textContent,/Sem permissão/);assert.ok(!document.querySelector('.hp-kpis'));
});
test('Simulação manual atualiza cenário sem nenhuma chamada de gravação',async()=>{
 await submit();const count=calls.length;const input=document.querySelector('.hp-simulation input');
 await act(()=>{Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype,'value').set.call(input,'200');input.dispatchEvent(new Event('input',{bubbles:true}));input.dispatchEvent(new Event('change',{bubbles:true}));});
 assert.match(document.querySelector('.hp-scenario-result').textContent,/300,00/);assert.equal(calls.length,count);
});

