import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {browserCandidates,resolveBrowserExecutable} from './browser-executable.mjs';
test('authorized installed browsers can be selected explicitly and invalid selections fail',()=>{
 assert.deepEqual(browserCandidates({VERTICE_BROWSER_EXECUTABLE:'/approved/chrome'},'linux'),['/approved/chrome']);
 assert.equal(resolveBrowserExecutable({CHROME_BIN:'/approved/chrome'},'linux',file=>file==='/approved/chrome'),'/approved/chrome');
 assert.throws(()=>resolveBrowserExecutable({CHROME_BIN:'/missing'},'linux',()=>false),/autorizado/);
});
test('Linux and Windows browser defaults do not change proxy or certificate protection',()=>{
 assert.equal(browserCandidates({},'linux')[0],'/usr/bin/google-chrome');assert.ok(browserCandidates({},'win32')[0].endsWith('chrome.exe'));
 for(const file of ['canteiro.real.browser.mjs','navigation.browser.mjs','canteiro.browser.mjs']){const source=readFileSync(new URL(file,import.meta.url),'utf8');assert.doesNotMatch(source,/--(?:no-proxy-server|disable-web-security|ignore-certificate-errors|no-sandbox)/);}
});
