(() => {
  'use strict';
  const sources = window.SPFCNewsSources || [];
  const externalUrl = value => {
    try { const u = new URL(value); return /^https?:$/.test(u.protocol) && !u.username && !u.password ? u.href : ''; }
    catch { return ''; }
  };
  const dateValue = item => Date.parse(item.pubDate) || 0;
  const newestFirst = (a, b) => dateValue(b) - dateValue(a);
  const recent = item => {
    const timestamp = Date.parse(item.pubDate);
    return !Number.isFinite(timestamp) || (timestamp >= Date.now() - 30 * 86400000 && timestamp <= Date.now() + 2 * 86400000);
  };
  const sourceFor = item => sources.find(s => s.id === item.sourceId || s.name === item.source);
  function clean(items) {
    const titles = new Set(), links = new Set(), counts = new Map();
    // Keep a quota for every source; a prolific publisher cannot evict the others.
    return (Array.isArray(items) ? items : []).filter(i => i && typeof i === 'object').map(i => {
      const source = sourceFor(i);
      return { title: String(i.title || '').trim().slice(0, 500), link: externalUrl(i.link),
        pubDate: String(i.pubDate || ''), source: source?.name || '', sourceId: source?.id || '' };
    }).filter(recent).sort(newestFirst).filter(i => {
      const key = i.title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (!i.sourceId || !key || !i.link || titles.has(key) || links.has(i.link) || (counts.get(i.sourceId) || 0) >= 15) return false;
      titles.add(key); links.add(i.link); counts.set(i.sourceId, (counts.get(i.sourceId) || 0) + 1); return true;
    });
  }
  function select(items, { sourceId = 'all', limit = 36 } = {}) {
    const ordered = clean(items);
    if (sourceId !== 'all') return ordered.filter(i => i.sourceId === sourceId).slice(0, limit);
    const groups = new Map();
    for (const item of ordered) {
      if (!groups.has(item.sourceId)) groups.set(item.sourceId, []);
      groups.get(item.sourceId).push(item);
    }
    const selected = [];
    // One article from each publisher per round, newest first within each round.
    for (let round = 0; selected.length < limit; round++) {
      const batch = [...groups.values()].map(items => items[round]).filter(Boolean).sort(newestFirst);
      if (!batch.length) break;
      selected.push(...batch.slice(0, limit - selected.length));
    }
    return selected;
  }
  function repairNamespaces(xml) {
    // Arquibancada's RSS currently repeats an identical xmlns:media attribute.
    // Remove identical declarations on the root only; other XML errors remain errors.
    return xml.replace(/<(rss|feed|rdf:RDF)\b[^>]*>/i, tag => {
      const seen = new Map();
      return tag.replace(/\s+(xmlns(?::[\w.-]+)?)\s*=\s*(["'])(.*?)\2/g, (attr, name, _quote, value) => {
        if (seen.get(name) === value) return '';
        seen.set(name, value); return attr;
      });
    });
  }
  function parse(xml, source) {
    const doc = new DOMParser().parseFromString(repairNamespaces(xml), 'application/xml');
    if (doc.querySelector('parsererror') || !['rss', 'feed', 'RDF'].includes(doc.documentElement.localName)) throw new Error('Feed inválido');
    return Array.from(doc.querySelectorAll('item,entry')).map(el => {
      const links = [...el.querySelectorAll('link')];
      const link = links.find(l => l.getAttribute('rel') === 'alternate') || links.find(l => !l.getAttribute('rel'));
      return {
        title: (el.querySelector('title')?.textContent || '').trim(),
        link: externalUrl(link?.getAttribute('href') || link?.textContent?.trim() || ''),
        pubDate: (el.querySelector('pubDate,published,updated')?.textContent || '').trim(),
        source: source.name, sourceId: source.id
      };
    }).filter(i => i.title && i.link && recent(i) && (!source.filter || /s[aã]o[-\s]+paulo|\bspfc\b|s[aã]o[-\s]?paulino|morumbi[s]?/i.test(i.title))).sort(newestFirst).slice(0, 15);
  }
  async function read(url) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 11000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      if (!response.ok || response.headers.get('Content-Type')?.includes('text/html')) throw new Error('Feed indisponível');
      return await response.text();
    } finally { clearTimeout(timer); }
  }
  async function feed(source) {
    try { return parse(await read(new URL('api/rss?source=' + encodeURIComponent(source.id), document.baseURI)), source); }
    catch {
      // Existing read-only RSS proxy also covers static hosting and a temporarily failing primary route.
      return parse(await read('https://red-sun-b335.lumenink2025.workers.dev/?url=' + encodeURIComponent(source.url)), source);
    }
  }
  window.SPFCNews = { sources, clean, select, parse, feed, externalUrl, repairNamespaces };
})();
