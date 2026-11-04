import test from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import {fileURLToPath} from 'node:url';
import {createServer} from 'vite';
import {API_URL} from '../src/api/sessionTransport.js';
test('local /api proxy preserves HttpOnly cookies and Origin without requiring bearer',async()=>{
 assert.equal(API_URL,'/api');
 const calls=[];
 const api=http.createServer((req,res)=>{calls.push({url:req.url,cookie:req.headers.cookie,origin:req.headers.origin,authorization:req.headers.authorization});if(req.url==='/api/usuarios/login')res.setHeader('Set-Cookie','vertice_session=synthetic-proxy-test; HttpOnly; SameSite=Lax; Path=/');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({ok:true}));});
 await new Promise(resolve=>api.listen(0,'127.0.0.1',resolve));
 const vite=await createServer({root:fileURLToPath(new URL('..',import.meta.url)),server:{host:'127.0.0.1',port:0,proxy:{'/api':{target:'http://127.0.0.1:'+api.address().port,changeOrigin:false}}},logLevel:'error'});
 try{
  assert.equal(vite.config.server.proxy['/api'].changeOrigin,false);
  await vite.listen();const base='http://127.0.0.1:'+vite.httpServer.address().port;
  const login=await fetch(base+'/api/usuarios/login',{method:'POST',headers:{Origin:base}});assert.equal(login.status,200);assert.match(login.headers.get('set-cookie'),/HttpOnly/);
  const cookie=login.headers.get('set-cookie').split(';')[0];
  const r=await fetch(base+'/api/obras?id_construtora=1',{headers:{Cookie:cookie,Origin:base}});assert.equal(r.status,200);
  assert.equal(calls[1].cookie,cookie);assert.equal(calls[1].origin,base);assert.equal(calls[1].authorization,undefined);assert.equal(calls[1].url,'/api/obras?id_construtora=1');
 }finally{await vite.close();api.closeAllConnections();await new Promise(resolve=>api.close(resolve));}
});
