/* Public archive: events come from the published GitHub JSON, never Firestore. */
(() => {
  'use strict';
  const GITHUB_JSON = 'https://raw.githubusercontent.com/lumenink2025-coder/spfc-hoje/main/data/eventos.json';
  const CACHE = 'spfc-home-events-github-r15';
  const normalize = items => items.filter(e => e && e.id != null && typeof e.n === 'string' &&
    Number(e.mes) >= 1 && Number(e.mes) <= 12 && Number(e.dia) >= 1 && Number(e.dia) <= 31)
    .map(e => ({ ...e, id: String(e.id), mes: Number(e.mes), dia: Number(e.dia) }));

  let eventsPromise;
  async function loadPublishedEvents() {
    if (!eventsPromise) eventsPromise = (async () => {
      try {
        const response = await fetch(GITHUB_JSON, { cache: 'no-cache', credentials: 'omit' });
        if (!response.ok) throw new Error('GitHub retornou HTTP ' + response.status);
        const items = normalize(await response.json());
        if (!items.length) throw new Error('O JSON publicado não contém eventos válidos');
        try { localStorage.setItem(CACHE, JSON.stringify({ ts: Date.now(), items })); } catch {}
        return items;
      } catch (error) {
        try {
          const cached = JSON.parse(localStorage.getItem(CACHE) || 'null');
          if (cached && Array.isArray(cached.items) && cached.items.length) return normalize(cached.items);
        } catch {}
        // The bundled JSON is the offline fallback for GitHub outages.
        const response = await fetch(new URL('data/eventos.json', document.baseURI), { cache: 'no-cache' });
        if (!response.ok) throw error;
        return normalize(await response.json());
      }
    })().catch(error => { eventsPromise = null; throw error; });
    return eventsPromise;
  }
  function initial(seed) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE) || 'null');
      if (cached && Array.isArray(cached.items)) return normalize(cached.items);
    } catch {}
    return normalize(seed || []);
  }
  function persist(items) {
    try { localStorage.setItem(CACHE, JSON.stringify({ ts: Date.now(), items })); } catch {}
  }
  async function daily(dateKey) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Data inválida');
    const [, month, day] = dateKey.split('-').map(Number);
    return (await loadPublishedEvents()).filter(e => (e.mes === month && e.dia === day) || e.destaqueData === dateKey);
  }
  function mergeDay(items, current, dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const merged = new Map(items.filter(e => !(e.mes === month && e.dia === day) && e.destaqueData !== dateKey).map(e => [e.id, e]));
    current.forEach(e => merged.set(e.id, e));
    return [...merged.values()];
  }
  async function archive() { return { items: await loadPublishedEvents(), live: true }; }
  async function detail(id) { return (await loadPublishedEvents()).find(e => e.id === String(id)) || null; }
  window.SPFCHomeData = { initial, persist, daily, mergeDay, archive, detail, normalize };
})();
