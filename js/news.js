(() => {
  'use strict';
  const sources = window.SPFCNewsSources || [];
  const externalUrl = value => { try { const u = new URL(value); return /^https?:$/.test(u.protocol) ? u.href : ''; } catch { return ''; } };
  function clean(items) {
    const titles = new Set(), links = new Set();
    return items.filter(i => {
      const key = String(i.title || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]/g, '');
      const link = externalUrl(i.link);
      if (!key || !link || titles.has(key) || links.has(link)) return false;
      titles.add(key); links.add(link); return true;
    }).sort((a, b) => (Date.parse(b.pubDate) || 0) - (Date.parse(a.pubDate) || 0)).slice(0, 80);
  }
  function parse(xml, source) {
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    if (doc.querySelector('parsererror') || !['rss', 'feed', 'RDF'].includes(doc.documentElement.localName)) throw new Error('Feed inválido');
    return Array.from(doc.querySelectorAll('item,entry')).map(el => {
      const links = [...el.querySelectorAll('link')];
      const link = links.find(l => l.getAttribute('rel') === 'alternate') || links.find(l => !l.getAttribute('rel'));
      return {
        title: (el.querySelector('title')?.textContent || '').trim(),
        link: externalUrl(link?.getAttribute('href') || link?.textContent?.trim() || ''),
        pubDate: (el.querySelector('pubDate,published,updated')?.textContent || '').trim(), source: source.name
      };
    }).filter(i => i.title && i.link && (!source.filter || /s[aã]o paulo|spfc/i.test(i.title))).slice(0, 10);
  }
  async function read(url) {
    const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 11000);
    try {
      const response = await fetch(url, { signal: controller.signal, credentials: 'omit' });
      const isStatic = [404, 405].includes(response.status) || (response.ok && response.headers.get('Content-Type')?.includes('text/html'));
      if (!response.ok || isStatic) throw Object.assign(new Error('Feed indisponível'), { isStatic });
      return await response.text();
    } finally { clearTimeout(timer); }
  }
  async function feed(source) {
    let xml;
    try { xml = await read(new URL('api/rss?source=' + encodeURIComponent(source.id), document.baseURI)); }
    catch (error) {
      if (!error.isStatic) throw error;
      // GitHub Pages and local static previews have no Vercel functions.
      xml = await read('https://red-sun-b335.lumenink2025.workers.dev/?url=' + encodeURIComponent(source.url));
    }
    return parse(xml, source);
  }
  window.SPFCNews = { sources, clean, parse, feed, externalUrl };
})();
