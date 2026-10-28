import sources from '../js/news-sources.js';

/* No API key. Source IDs, not caller-provided URLs, determine every upstream request. */
export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Método não permitido.' }); }
  const source = sources.find(item => item.id === req.query?.source);
  if (!source) return res.status(400).json({ error: 'Fonte inválida.' });
  const controller = new AbortController(), timer = setTimeout(() => controller.abort(), 9000);
  try {
    let url = new URL(source.url), upstream;
    for (let redirects = 0; redirects <= 3; redirects++) {
      upstream = await fetch(url, { signal: controller.signal, redirect: 'manual', headers: {
        Accept: 'application/rss+xml, application/atom+xml, application/xml, text/xml',
        'User-Agent': 'SPFC-Hoje-RSS/1.0 (+https://spfc-hoje.vercel.app/)'
      } });
      if (![301, 302, 303, 307, 308].includes(upstream.status)) break;
      const next = new URL(upstream.headers.get('location') || '', url);
      await upstream.body?.cancel();
      if (next.protocol !== 'https:' || next.hostname.replace(/^www\./, '') !== new URL(source.url).hostname.replace(/^www\./, '') || next.port || redirects === 3) throw new Error('Redirecionamento inválido');
      url = next;
    }
    if (!upstream.ok) throw new Error('Fonte indisponível');
    const reader = upstream.body.getReader(), chunks = []; let size = 0;
    while (true) {
      const { value, done } = await reader.read(); if (done) break;
      size += value.byteLength;
      if (size > 2500000) { await reader.cancel(); throw new Error('Feed muito grande'); }
      chunks.push(Buffer.from(value));
    }
    const xml = Buffer.concat(chunks).toString('utf8');
    if (!/<(?:rss|feed|rdf:RDF)[\s>]/i.test(xml) || /<!DOCTYPE\s+html|<html[\s>]/i.test(xml.slice(0, 500))) throw new Error('RSS inválido');
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=600, stale-while-revalidate=1800');
    res.setHeader('Content-Type', 'application/xml; charset=utf-8');
    return res.status(200).send(xml);
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Esta fonte está temporariamente indisponível.' });
  } finally { clearTimeout(timer); }
}
