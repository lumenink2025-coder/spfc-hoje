<<<<<<< HEAD
'use strict';
/* Change RELEASE with each complete deployment. Never unregister notification workers. */
const RELEASE = '20261025-r7';
const SCOPE_URL = new URL(self.registration.scope);
const SCOPE_KEY = SCOPE_URL.pathname.replace(/[^a-z0-9]/gi, '_');
const CACHE_PREFIX = 'spfc-hoje-app-' + SCOPE_KEY + '-';
const CACHE_NAME = CACHE_PREFIX + RELEASE;
const SHELL = [
  'index.html', 'main.html', 'calendario.html', 'style.css', 'app.js', 'account.js',
  'events.js', 'pwa.js', 'pwa.css', 'js/data-service.js', 'manifest.json', 'assets/app-icon.png'
];
const OPTIONAL = [
  'quiz.html', 'quiz-premium.css', 'quiz-sports.css', 'quiz-fixes.css',
  'jogadores.html', 'cartel-premium.css', 'spfc_historia.html', 'tecnicos.html', 'tecnico.html',
  'goleadores.html', 'galeria-dos-imortais.html', 'wondler.html', 'suite-premium.css',
  'data/eventos.json', 'data/perguntas.json', 'data/wordle.json', 'data/dados.json',
  'data/jogos.json', 'data/tematico.json', 'data/spfc-tecnicos-titulos.json',
  'data/spfc-enciclopedia-gols.json', 'data/premiacoes-spfc.json', 'assets/hero.jpg', 'assets/paulista.webp'
];
const EXCLUDED = /^(?:api\/|functions\/|admin(?:\.|-)|cadastro\.html$|perfil\.html$|palpitometro\.html$|sw\.js$|OneSignal|js\/profile-auth\.js$)/;
function keyFor(url) { const key = new URL(url); key.search = ''; key.hash = ''; if (key.pathname === SCOPE_URL.pathname) key.pathname += 'index.html'; return key.href; }
async function store(cache, request, response) {
  if (!response.ok || response.type !== 'basic' || response.headers.get('Cache-Control')?.includes('no-store')) return;
  const url = new URL(typeof request === 'string' ? request : request.url);
  if (/\.(?:js|css|json)$/.test(url.pathname) && response.headers.get('Content-Type')?.includes('text/html')) return;
  await cache.put(keyFor(url), response.clone()).catch(() => {});
}
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // Essential shell is atomic; optional offline pages cannot prevent an update.
    await cache.addAll(SHELL.map(path => new Request(new URL(path, SCOPE_URL), { cache: 'reload' })));
    await Promise.allSettled(OPTIONAL.map(async path => {
      const request = new Request(new URL(path, SCOPE_URL), { cache: 'reload' });
      const response = await fetch(request);
      await store(cache, request, response);
    }));
    if (!self.registration.active) await self.skipWaiting();
  })());
});
self.addEventListener('message', event => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if (event.data?.type === 'GET_VERSION') event.ports[0]?.postMessage({ release: RELEASE });
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    // Legacy prefixes are cleaned only at the original root scope, never across subprojects.
    const legacy = key => SCOPE_URL.pathname === '/' && /^spfc-hoje-premium-/.test(key);
    await Promise.all(keys.filter(key => key !== CACHE_NAME && (key.startsWith(CACHE_PREFIX) || legacy(key))).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== SCOPE_URL.origin || !url.pathname.startsWith(SCOPE_URL.pathname)) return;
  const path = url.pathname.slice(SCOPE_URL.pathname.length);
  if (EXCLUDED.test(path) || request.headers.has('Authorization') || request.headers.has('Range')) return;
  if (path && !/\.(?:html|css|js|json|png|webp|jpg|jpeg|ico)$/.test(path)) return;
  const work = (async () => {
    const cache = await caches.open(CACHE_NAME);
    try {
      // Bypass stale HTTP copies as well as Cache Storage. Firebase/RSS never enter this handler.
      const response = await fetch(new Request(request, { cache: 'no-cache' }));
      if (response.status >= 500) {
        const cached = await cache.match(keyFor(url));
        if (cached) return cached;
      }
      await store(cache, request, response);
      return response;
    } catch {
      const cached = await cache.match(keyFor(url));
      if (cached) return cached;
      if (request.mode === 'navigate') return new Response('<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SPFC Hoje · Offline</title><body style="background:#17141d;color:#eee;font:16px/1.6 system-ui;padding:32px"><h1>Você está sem conexão.</h1><p>Esta página ainda não foi salva para uso offline.</p><a style="color:#ff7998" href="' + SCOPE_URL.pathname + 'index.html">Voltar ao início</a><p><button onclick="location.reload()">Tentar novamente</button></p></body></html>', { status: 503, headers: {'Content-Type':'text/html; charset=utf-8'} });
      return Response.error();
    }
  })();
  event.respondWith(work);
  event.waitUntil(work.then(() => {}).catch(() => {}));
});
=======
const CACHE_NAME='spfc-hoje-premium-20261023-profile-about-4';
const ASSETS=['./index.html','./main.html','./style.css','./app.js','./account.js','./events.js','./manifest.json','./assets/logo-original.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE_NAME).then(c=>c.addAll(ASSETS)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('spfc-hoje-')&&k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',e=>{const u=new URL(e.request.url);if(e.request.method!=='GET'||u.origin!==self.location.origin||/\/(api\/|admin(?:\.|-)|cadastro\.html|perfil\.html|sw\.js|OneSignal)/.test(u.pathname))return;if(!/\.(?:html|css|js|json|png|webp|jpg|ico)$/.test(u.pathname)&&!u.pathname.endsWith('/'))return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&r.type==='basic'){const copy=r.clone();e.waitUntil(caches.open(CACHE_NAME).then(c=>c.put(e.request,copy)));}return r;}).catch(async()=>{const hit=await caches.match(e.request);if(hit)return hit;if(e.request.mode==='navigate')return new Response('<!doctype html><html lang="pt-BR"><meta name="viewport" content="width=device-width"><title>SPFC Hoje · Offline</title><body style="background:#18181d;color:#eee;font-family:sans-serif;padding:30px"><h1>Você está sem conexão.</h1><p>Esta tela ainda não está disponível offline. Reconecte e tente novamente.</p><button onclick="location.reload()">Tentar novamente</button></body></html>',{headers:{'Content-Type':'text/html; charset=utf-8'}});return Response.error();}));});
>>>>>>> af3d2308c39348c99a2c0625c4513bb079364545
