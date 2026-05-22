// SPFC — Hoje na História | Service Worker v3.1
// ⚠️ MUDE O CACHE_VERSION A CADA DEPLOY!

const CACHE_VERSION = "v3.3";  // ← ALTERE ISSO A CADA NOVO DEPLOY (ex: v3.2, v3.3...)
const CACHE_NAME = `spfc-hoje-${CACHE_VERSION}`;
const ASSETS = ['/', '/index.html', '/quiz.html', '/manifest.json'];

// ── INSTALL ───────────────────────────────────────
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(ASSETS).catch(() => {}))
      .then(() => self.skipWaiting()) // ← Força ativação imediata, não espera fechar abas
  );
});

// ── ACTIVATE ────────────────────────────────────
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)) // ← Limpa TODOS caches antigos
      ))
      .then(() => self.clients.claim()) // ← Assume controle imediato das abas abertas
  );
  scheduleDailyCheck();
});

// ── FETCH ─────────────────────────────────────────
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;

  // NUNCA cacheia o próprio sw.js — sempre pega do servidor
  if (e.request.url.includes('sw.js')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // Para index.html: network-first (sempre pega versão mais nova)
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

  // Para assets estáticos: cache-first com fallback para network
  e.respondWith(
    caches.match(e.request).then(cached => {
      if (cached) {
        // Atualiza em background sem bloquear
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

// ── PUSH ──────────────────────────────────────────
self.addEventListener('push', e => {
  let data = {};
  try { if (e.data) data = e.data.json(); } catch(_) {}
  e.waitUntil(
    self.registration.showNotification(data.title || '🔴 São Paulo FC — Hoje na História', {
      body: data.body || 'Hoje o São Paulo escreveu história. Venha reviver!',
      icon: '/icons/icon-192.png',
      badge: '/icons/badge-72.png',
      tag: 'spfc-hoje',
      renotify: true,
      vibrate: [200, 100, 200],
      data: { url: data.url || '/' },
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
  const url = e.action === 'quiz' ? '/quiz.html' : (e.notification.data && e.notification.data.url) || '/';
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

// ── AGENDAMENTO DIÁRIO ────────────────────────────
function getSecondsUntil8am() {
  const now = new Date();
  const next = new Date();
  next.setHours(8, 0, 0, 0);
  if (now >= next) next.setDate(next.getDate() + 1);
  return Math.max(1, Math.floor((next - now) / 1000));
}

function getTodayNotif() {
  const now = new Date();
  const m = now.getMonth() + 1;
  const d = now.getDate();
  const key = m + '/' + d;

  const MSGS = {
    '1/22':'🎂 Rogério Ceni nasceu neste dia (1973). O maior ídolo da história do São Paulo!',
    '1/25':'🎂 Hoje é o aniversário do São Paulo FC! Fundado em 25 de janeiro de 1930.',
    '1/31':'🎂 Müller nasceu neste dia (1966). Um dos maiores artilheiros tricolores.',
    '2/8':'🏆 Supercopa Rei 2024 conquistada nesta data pelo Tricolor!',
    '2/24':'🏆 Hoje na história: SPFC campeão brasileiro pela 1ª vez (1986)!',
    '2/28':'🎂 Casemiro nasceu neste dia (1992). Revelado pelo São Paulo para o mundo!',
    '3/5':'🏆 Hoje na história: São Paulo campeão brasileiro (1977)!',
    '3/28':'⚽ Hoje na história: 10x0 no Botafogo-PB (2001)! Uma das maiores goleadas.',
    '4/2':'🏆 Hoje na história: Recopa Sul-Americana 1994 conquistada!',
    '4/22':'🎂 Kaká nasceu neste dia (1982). Bola de Ouro 2007, revelado pelo SPFC.',
    '5/26':'🏆 Hoje na história: 1ª Copa Libertadores (1993)! Uma noite inesquecível.',
    '6/6':'🎂 Cafu nasceu neste dia (1970). Lateral mais laureado da história.',
    '6/9':'🏆 Hoje na história: SPFC campeão brasileiro (1991)!',
    '6/17':'⭐ Hoje na história: Rogério Ceni estreou pelo São Paulo (1993).',
    '6/18':'⚽ Hoje na história: 9x1 no Santos (1944)! Goleada histórica no clássico.',
    '7/2':'⚽ Hoje na história: 11x0! Uma das maiores goleadas do clube (1932).',
    '7/8':'⚽ Hoje na história: 12x1 no Jabaquara (1945)! Goleada histórica.',
    '7/14':'🏆 Hoje na história: Libertadores 2005 conquistada! Bicampeões!',
    '7/26':'🎂 Telê Santana nasceu neste dia (1931). O maior treinador do SPFC.',
    '8/27':'⚽ Hoje na história: 12x1 no Sírio (1933)! Uma das maiores goleadas.',
    '9/10':'⚽ Hoje na história: 6x1 no Corinthians (1933)! Clássico histórico.',
    '9/24':'🏆 Hoje na história: Copa do Brasil 2023 conquistada pelo Tricolor!',
    '10/1':'🏟️ Hoje na história: o Morumbi foi inaugurado (1960)!',
    '10/5':'🎂 Careca nasceu neste dia (1960). Um dos maiores centroavantes do Brasil.',
    '10/18':'⭐ Raí estreou pelo São Paulo nesta data (1987). O capitão dos campeões!',
    '10/31':'🏆 Hoje na história: SPFC campeão brasileiro (2007)!',
    '11/2':'🎂 Diego Lugano nasceu neste dia (1980). Capitão e ídolo eterno.',
    '11/8':'🎂 Luís Fabiano nasceu neste dia (1980). O Fabuloso!',
    '11/11':'⚽ Hoje na história: 10x0 no Guarani (1950)! Goleada absurda.',
    '11/20':'🏆 Hoje na história: SPFC campeão brasileiro (2006)!',
    '11/30':'🎂 Muricy Ramalho nasceu neste dia (1955). Técnico do tricampeonato.',
    '12/7':'🏆 Hoje na história: SPFC tricampeão brasileiro (2008)!',
    '12/12':'🏆 Hoje na história: MUNDIAL 1993! SP 3x2 Milan. Bicampeões mundiais!',
    '12/19':'🏆 Hoje na história: MUNDIAL 2005! SP 1x0 Liverpool. Tricampeões!',
    '12/22':'🏆 Hoje na história: MUNDIAL 1992! SP 2x1 Barcelona. 1º título mundial!'
  };

  const generics = [
    'Você sabe o que aconteceu hoje na história do São Paulo? 🔴',
    'Hoje o Morumbi tem memórias especiais. Venha descobrir!',
    'O São Paulo escreveu história nesta data. Abra e reviva!',
    'Uma data marcante para o futebol tricolor. Venha ver!',
    'Você lembra onde estava neste dia histórico do SPFC?',
    'O São Paulo tem uma história incrível para cada dia do ano.',
    'Hoje na história: momentos que fizeram o Morumbi vibrar! 🔴'
  ];

  const body = MSGS[key] || generics[d % generics.length];

  return {
    title: MSGS[key] ? '🔴 São Paulo FC — Hoje na História' : '🔴 São Paulo FC',
    body: body
  };
}

let dailyTimer = null;

function scheduleDailyCheck() {
  if (dailyTimer) clearTimeout(dailyTimer);
  const secs = getSecondsUntil8am();
  dailyTimer = setTimeout(function() {
    fireDaily();
    scheduleDailyCheck();
  }, secs * 1000);
}

function fireDaily() {
  const n = getTodayNotif();
  self.registration.showNotification(n.title, {
    body: n.body,
    icon: '/icons/icon-192.png',
    badge: '/icons/badge-72.png',
    tag: 'spfc-diario',
    renotify: true,
    vibrate: [300, 100, 300, 100, 300],
    data: { url: '/' },
    actions: [
      { action: 'open', title: '📅 Ver hoje na história' },
      { action: 'quiz', title: '🎮 Jogar quiz' }
    ]
  }).catch(function() {});
}

// ── MESSAGES ──────────────────────────────────────
self.addEventListener('message', function(e) {
  if (!e.data) return;
  if (e.data.type === 'TEST_NOTIF') fireDaily();
  if (e.data.type === 'RESCHEDULE') scheduleDailyCheck();
  if (e.data.type === 'SKIP_WAITING') self.skipWaiting();
});
