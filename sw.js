<<<<<<< HEAD
const CACHE_NAME='spfc-hoje-premium-20261023-profile-about-4';
const ASSETS=['./index.html','./main.html','./style.css','./app.js','./account.js','./events.js','./manifest.json','./assets/logo-original.png'];
=======
const CACHE_NAME='spfc-hoje-premium-20261023-editorial-3';
const ASSETS=['./index.html','./main.html','./style.css','./app.js','./events.js','./manifest.json','./assets/logo-original.png'];
>>>>>>> be006ea812141fac608bcabf4722c8fcd8bf2bec
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spfc-hoje-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||/\/(api\/|admin(?:\.|-)|cadastro\.html|perfil\.html|sw\.js|OneSignal)/.test(u.pathname))return;if(!/\.(?:html|css|js|json|png|webp|jpg|ico)$/.test(u.pathname)&&!u.pathname.endsWith('/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)));}return r;}).catch(async()=>{const hit=await caches.match(e.request);if(hit)return hit;if(e.request.mode==='navigate')return new Response('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width"><title>SPFC Hoje · Offline</title><body style="background:#18181d;color:#eee;font-family:sans-serif;padding:30px"><h1>Você está sem conexão.</h1><p>Esta tela ainda não está disponível offline. Reconecte e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});return Response.error();}));});
