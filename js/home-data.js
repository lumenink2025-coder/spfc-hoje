/* Acervo histórico exclusivamente local: data/eventos.json. Sem consultas ao Firebase/Firestore. */
(() => {
  'use strict';
  const CACHE = 'spfc-home-events-local-v1';
  const normalize = items => (Array.isArray(items) ? items : []).filter(e => e && e.id != null && typeof e.n === 'string' &&
    Number(e.mes) >= 1 && Number(e.mes) <= 12 && Number(e.dia) >= 1 && Number(e.dia) <= 31)
    .map(e => ({ ...e, id: String(e.id), mes: Number(e.mes), dia: Number(e.dia) }));
  function initial(seed) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE));
      if (cached && cached.ts >= (window.SPFC_SEED_BUILT_AT || 0) && Array.isArray(cached.items)) return normalize(cached.items);
    } catch { /* cache opcional */ }
    return normalize(seed || []);
  }
  function persist(items) {
    try { localStorage.setItem(CACHE, JSON.stringify({ ts: Date.now(), items: normalize(items) })); } catch { /* cache opcional */ }
  }
  let bundled;
  function bundle() {
    if (!bundled) bundled = fetch(new URL('data/eventos.json', document.baseURI), { cache: 'no-cache' })
      .then(r => { if (!r.ok) throw new Error('Não foi possível carregar data/eventos.json'); return r.json(); })
      .then(normalize).catch(error => { bundled = null; throw error; });
    return bundled;
  }
  async function daily(dateKey) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Data inválida');
    const [, month, day] = dateKey.split('-').map(Number);
    return (await bundle()).filter(e => (e.mes === month && e.dia === day) || e.destaqueData === dateKey);
  }
  function mergeDay(items, current, dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const merged = new Map(normalize(items).filter(e => !(e.mes === month && e.dia === day) && e.destaqueData !== dateKey).map(e => [e.id, e]));
    normalize(current).forEach(e => merged.set(e.id, e));
    return [...merged.values()];
  }
  async function archive() { return { items: await bundle(), live: false }; }
  async function detail(id) { return (await bundle()).find(e => e.id === String(id)) || null; }
  window.SPFCHomeData = { initial, persist, daily, mergeDay, archive, detail, normalize };
})();
