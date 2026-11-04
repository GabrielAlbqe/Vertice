import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {cloudConfiguration} from '../scripts/cloud-config.mjs';
const env={PUBLIC_FRONTEND_URL:'https://app.company.test',PUBLIC_API_URL:'https://api.host.test'};
test('CSP usa origem exata da API, sem liberar todos os domínios HTTPS',()=>{
  const config=cloudConfiguration(env),headers=config.routes[0].headers;
  assert.equal(config.version,3);assert.match(headers['Content-Security-Policy'],/connect-src 'self' https:\/\/api\.host\.test;/);assert.doesNotMatch(headers['Content-Security-Policy'],/connect-src 'self' https:;/);assert.match(headers['Strict-Transport-Security'],/max-age/);
});
test('proxy /api é avaliado antes da SPA e preserva a origem do navegador',()=>{
  const routes=cloudConfiguration(env).routes,proxy=routes.find(r=>r.src==='/api/(.*)');assert.equal(proxy.dest,env.PUBLIC_API_URL+'/api/$1');assert.ok(routes.indexOf(proxy)<routes.findIndex(r=>r.handle==='filesystem'));assert.equal(routes.at(-1).dest,'/index.html');
  assert.throws(()=>cloudConfiguration({}));assert.throws(()=>cloudConfiguration({...env,PUBLIC_API_URL:'http://api.host.test'}));
  assert.equal(proxy.transforms[0].args,'$ORIGIN_SECRET');assert.deepEqual(proxy.transforms[0].env,['ORIGIN_SECRET']);assert.equal(proxy.headers['Cache-Control'],'no-store');
  assert.equal(JSON.stringify(cloudConfiguration({...env,ORIGIN_SECRET:'private-value-never-output'})).includes('private-value-never-output'),false);
});
test('Vercel usa Build Output API e não publica automaticamente commits',()=>{
  const config=JSON.parse(readFileSync(new URL('../vercel.json',import.meta.url),'utf8'));assert.equal(config.framework,null);assert.equal(config.buildCommand,'node scripts/build-cloud.mjs');assert.equal(config.git.deploymentEnabled,false);
});
