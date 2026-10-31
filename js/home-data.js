/* Public archive: immediate seed/cache, small daily queries, full archive in the background. */
(() => {
  'use strict';
  const BASE = 'https://firestore.googleapis.com/v1/projects/spfc-hoje-da329/databases/(default)/documents';
  const CACHE = 'spfc-home-events-r10';
  const normalize = items => items.filter(e => e && e.id != null && typeof e.n === 'string' &&
    Number(e.mes) >= 1 && Number(e.mes) <= 12 && Number(e.dia) >= 1 && Number(e.dia) <= 31)
    .map(e => ({ ...e, id: String(e.id), mes: Number(e.mes), dia: Number(e.dia) }));
  function value(v) {
    if ('nullValue' in v) return null;
    if ('integerValue' in v || 'doubleValue' in v) return Number(v.integerValue ?? v.doubleValue);
    if ('booleanValue' in v) return v.booleanValue;
    if ('arrayValue' in v) return (v.arrayValue.values || []).map(value);
    if ('mapValue' in v) return fields(v.mapValue.fields);
    return v.stringValue ?? v.timestampValue ?? '';
  }
  const fields = obj => Object.fromEntries(Object.entries(obj || {}).map(([k, v]) => [k, value(v)]));
  const documentEvent = doc => ({ ...fields(doc.fields), id: doc.name.split('/').pop() });
  async function request(url, body) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetch(url, { credentials: 'omit', signal: controller.signal,
        ...(body ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}) });
      if (!response.ok) throw new Error('Acervo indisponível (' + response.status + ')');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  function initial(seed) {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE));
      if (cached && cached.ts >= (window.SPFC_SEED_BUILT_AT || 0) && Array.isArray(cached.items)) return normalize(cached.items);
    } catch { /* Private mode and full storage do not block the Home. */ }
    return normalize(seed || []);
  }
  function persist(items) {
    try { localStorage.setItem(CACHE, JSON.stringify({ ts: Date.now(), items })); } catch { /* Best effort. */ }
  }
  async function daily(dateKey) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateKey)) throw new Error('Data inválida');
    const [, month, day] = dateKey.split('-').map(Number);
    const equal = (fieldPath, val) => ({ fieldFilter: { field: { fieldPath }, op: 'EQUAL',
      value: typeof val === 'number' ? { integerValue: String(val) } : { stringValue: val } } });
    const queries = [
      { compositeFilter: { op: 'AND', filters: [equal('mes', month), equal('dia', day)] } },
      equal('destaqueData', dateKey)
    ];
    const results = await Promise.all(queries.map(where => request(BASE + ':runQuery', {
      structuredQuery: { from: [{ collectionId: 'eventos' }], where }
    })));
    const unique = new Map(results.flat().filter(row => row.document).map(row => {
      const e = documentEvent(row.document); return [e.id, e];
    }));
    return normalize([...unique.values()]);
  }
  function mergeDay(items, current, dateKey) {
    const [, month, day] = dateKey.split('-').map(Number);
    const merged = new Map(items.filter(e => !(e.mes === month && e.dia === day) && e.destaqueData !== dateKey).map(e => [e.id, e]));
    current.forEach(e => merged.set(e.id, e));
    return [...merged.values()];
  }
  let bundled;
  function bundle() {
    if (!bundled) bundled = request(new URL('data/eventos.json', document.baseURI)).then(normalize).catch(error => { bundled = null; throw error; });
    return bundled;
  }
  async function archive() {
    try {
      const items = []; let token = '';
      do {
        const url = new URL(BASE + '/eventos'); url.searchParams.set('pageSize', '1000');
        if (token) url.searchParams.set('pageToken', token);
        const page = await request(url); items.push(...(page.documents || []).map(documentEvent)); token = page.nextPageToken || '';
      } while (token);
      return { items: normalize(items), live: true };
    } catch { return { items: await bundle(), live: false }; }
  }
  async function detail(id) {
    try { return documentEvent(await request(BASE + '/eventos/' + encodeURIComponent(id))); }
    catch { return (await bundle()).find(e => e.id === id) || null; }
  }
  window.SPFCHomeData = { initial, persist, daily, mergeDay, archive, detail, normalize };
})();
