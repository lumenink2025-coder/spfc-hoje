/* Public archive: load the complete event list from the project's published JSON. */
(() => {
  'use strict';
  const CACHE = 'spfc-home-events-json-r15';
  const normalize = items => items.filter(e => e && e.id != null && typeof e.n === 'string' &&
    Number(e.mes) >= 1 && Number(e.mes) <= 12 && Number(e.dia) >= 1 && Number(e.dia) <= 31)
    .map(e => ({ ...e, id: String(e.id), mes: Number(e.mes), dia: Number(e.dia) }));
  let bundled;
  function bundle() {
    if (!bundled) bundled = fetch(new URL('data/eventos.json', document.baseURI), { cache: 'no-cache' })
      .then(response => {
        if (!response.ok) throw new Error('Não foi possível carregar data/eventos.json (' + response.status + ')');
        return response.json();
      })
      .then(normalize)
      .then(items => {
        if (!items.length) throw new Error('data/eventos.json não contém eventos válidos');
        persist(items);
        return items;
      })
      .catch(error => { bundled = null; throw error; });
    return bundled;
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
    return (await bundle()).filter(e => (e.mes === month && e.dia === day) || e.destaqueData === dateKey);
  }
  function mergeDay(items, current, dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const merged = new Map(items.filter(e => !(e.mes === month && e.dia === day) && e.destaqueData !== dateKey).map(e => [e.id, e]));
    current.forEach(e => merged.set(e.id, e));
    return [...merged.values()];
  }
  async function archive() { return { items: await bundle(), live: true }; }
  async function detail(id) { return (await bundle()).find(e => e.id === String(id)) || null; }
  window.SPFCHomeData = { initial, persist, daily, mergeDay, archive, detail, normalize };
})();
