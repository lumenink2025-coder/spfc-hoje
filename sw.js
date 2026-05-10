// SPFC — Hoje na História | Service Worker v1.0

const CACHE_NAME = 'spfc-hoje-v1';
const ASSETS = [
  '/',
  '/index.html'
];

// INSTALL
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

// ACTIVATE
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// FETCH — Cache First with Network Fallback
self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});

// PUSH NOTIFICATIONS
self.addEventListener('push', (e) => {
  const data = e.data ? e.data.json() : {};
  const title = data.title || '🔴 São Paulo FC — Hoje na História';
  const body = data.body || 'Hoje o São Paulo escreveu história. Venha reviver!';
  
  e.waitUntil(
    self.registration.showNotification(title, {
      body,
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: 'spfc-hoje',
      renotify: true,
      requireInteraction: false,
      actions: [
        { action: 'open', title: 'Ver história de hoje' }
      ]
    })
  );
});

// NOTIFICATION CLICK
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  e.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url.includes('/') && 'focus' in client) return client.focus();
      }
      if (clients.openWindow) return clients.openWindow('/');
    })
  );
});

// BACKGROUND SYNC — Agenda notificação diária (simulado)
self.addEventListener('message', (e) => {
  if (e.data && e.data.type === 'SCHEDULE_NOTIFICATION') {
    // Agendamento via push server — configure com Firebase FCM ou similar
    console.log('SPFC SW: Notificação agendada para as 8h');
  }
});
