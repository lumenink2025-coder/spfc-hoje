// SPFC — Hoje na História | Service Worker v1.1.1.1
// ⚠️ MUDE O CACHE_VERSION A CADA DEPLOY!

const CACHE_VERSION = "v1.1.1.1.1.1.0.0.0.4.1";  // ← ALTERE ISSO A CADA NOVO DEPLOY
const CACHE_NAME = `spfc-hoje-${CACHE_VERSION}`;
const ASSETS = ['/', '/index.html', '/quiz.html', '/manifest.json'];

// ── INSTALL ───────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting())
  );
});

// ── ACTIVATE ────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

// ── FETCH ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  // Ignora schemes não cacheáveis (chrome-extension://, moz-extension://, etc.)
  if (!e.request.url.startsWith('http://') && !e.request.url.startsWith('https://')) return;
  if (e.request.url.includes('sw.js')) {
    e.respondWith(fetch(e.request));
    return;
  }
  if (e.request.mode === 'navigate' || e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then(resp => {
          if (resp && resp.status === 200) {
            const clone = resp.clone();
            caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
          }
          return resp;
        })
        .catch(() => caches.match(e.request).then(cached => cached || caches.match('/index.html')))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        fetch(e.request).then(resp => {
          if (resp && resp.status === 200) {
            caches.open(CACHE_NAME).then(c => c.put(e.request, resp.clone()));
          }
        }).catch(() => {});
        return cached;
      }
      return fetch(e.request).then(resp => {
        if (resp && resp.status === 200 && resp.type === 'basic') {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then(c => c.put(e.request, clone));
        }
        return resp;
      }).catch(() => caches.match('/index.html'));
    })
  );
});

// ── PUSH (FCM) ────────────────────────────────────
self.addEventListener('push', e => {
  let data = {};
  try { 
    if (e.data) data = e.data.json(); 
  } catch(_) {}

  const title = data.notification?.title || data.title || '🔴 São Paulo FC';
  const body = data.notification?.body || data.body || 'Bom dia! Você sabe o que aconteceu no SPFC no dia de hoje?';
  const url = data.data?.url || data.url || '/';

  e.waitUntil(
    self.registration.showNotification(title, {
      body: body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: 'spfc-diario',
      renotify: true,
      requireInteraction: false,
      vibrate: [300, 100, 300],
      data: { url: url },
      actions: [
        { action: 'open', title: '📅 Ver hoje na história' },
        { action: 'quiz', title: '🎮 Jogar quiz' }
      ]
    })
  );
});

// ── NOTIFICATION CLICK ────────────────────────────
self.addEventListener('notificationclick', e => {
  e.notification.close();
  const url = e.action === 'quiz' ? '/quiz.html' : (e.notification.data?.url) || '/';
  e.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(list => {
      for (const c of list) {
        if (c.url.includes(self.location.origin) && 'focus' in c) {
          c.navigate(url);
          return c.focus();
        }
      }
      return clients.openWindow(url);
    })
  );
});

// ── MESSAGES ──────────────────────────────────────
self.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
