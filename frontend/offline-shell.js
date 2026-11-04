import {createHash} from 'node:crypto';
export default function offlineShell(){return {name:'vertice-offline-shell',apply:'build',generateBundle(_,bundle){
  const files=['/index.html',...Object.keys(bundle).filter(f=>/\.(js|css|png|webp|jpe?g|avif|ico|svg|woff2?)$/.test(f)).map(f=>'/'+f)];
  const version=createHash('sha256').update(JSON.stringify(files)).digest('hex').slice(0,16);
  const source=`const CACHE='vertice-shell-${version}';const FILES=${JSON.stringify(files)};
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(FILES))));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('vertice-shell-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{const req=event.request,url=new URL(req.url);if(req.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/')||req.headers.has('Authorization'))return;
if(req.mode==='navigate'){event.respondWith(fetch(req).catch(()=>caches.match('/index.html')));return;}
if(FILES.includes(url.pathname))event.respondWith(caches.open(CACHE).then(async cache=>(await cache.match(url.pathname))||fetch(req)));
});`;
  this.emitFile({type:'asset',fileName:'sw.js',source});
}};}
