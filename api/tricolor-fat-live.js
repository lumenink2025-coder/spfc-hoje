const CHANNEL_URL = 'https://www.youtube.com/@tricolor_fat/streams';

function extractInitialData(html) {
  const marker = /ytInitialData\s*=\s*/.exec(html);
  if (!marker) throw new Error('Dados do canal indisponíveis');
  let start = marker.index + marker[0].length;
  while (/\s/.test(html[start] || '')) start++;
  if (html[start] !== '{') throw new Error('Dados do canal inválidos');
  let depth = 0, quoted = false, escaped = false;
  for (let i = start; i < html.length; i++) {
    const char = html[i];
    if (quoted) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === '"') quoted = false;
      continue;
    }
    if (char === '"') quoted = true;
    else if (char === '{') depth++;
    else if (char === '}' && --depth === 0) return JSON.parse(html.slice(start, i + 1));
  }
  throw new Error('Dados do canal incompletos');
}

function channelIsLive(data) {
  const stack = [data];
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value)) { stack.push(...value); continue; }
    const video = value.videoRenderer || value.gridVideoRenderer || value.richItemRenderer?.content?.videoRenderer;
    if (video && typeof video === 'object') {
      if (video.isLiveNow === true) return true;
      const badges = JSON.stringify(video.badges || []);
      if (/BADGE_STYLE_TYPE_LIVE_NOW|"label":"(?:LIVE|AO VIVO)"/i.test(badges)) return true;
      if ((video.thumbnailOverlays || []).some(item => {
        const style = item.thumbnailOverlayTimeStatusRenderer?.style;
        return style === 'LIVE' || style === 'LIVE_NOW';
      })) return true;
    }
    stack.push(...Object.values(value));
  }
  return false;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Método não permitido.' }); }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const response = await fetch(CHANNEL_URL, {
      signal: controller.signal,
      headers: { Accept: 'text/html', 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/125 Safari/537.36' }
    });
    if (!response.ok) throw new Error('Canal do YouTube indisponível');
    const html = await response.text();
    if (html.length > 8_000_000) throw new Error('Resposta do YouTube muito grande');
    const live = channelIsLive(extractInitialData(html));
    res.setHeader('Cache-Control', 'public, max-age=20, s-maxage=30, stale-while-revalidate=60');
    return res.status(200).json({ live, checkedAt: new Date().toISOString() });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Não foi possível consultar o status do Tricolor FAT.' });
  } finally { clearTimeout(timer); }
}
