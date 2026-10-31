const CHANNEL_URL = 'https://www.youtube.com/@tricolor_fat/live';

function extractAssignedJson(html, name) {
  const marker = new RegExp(`${name}\\s*=\\s*`).exec(html);
  if (!marker) return null;
  let start = marker.index + marker[0].length;
  while (/\s/.test(html[start] || '')) start++;
  if (html[start] !== '{') return null;
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
  return null;
}

function playerSaysLive(player) {
  if (!player) return null;
  const video = player.videoDetails || {};
  const broadcast = player.microformat?.playerMicroformatRenderer?.liveBroadcastDetails || {};
  if (video.isLive === true || broadcast.isLiveNow === true) return true;
  if (video.videoId && (video.isLive === false || broadcast.isLiveNow === false)) return false;
  return null;
}

function playerHtmlSaysLive(html) {
  const marker = /ytInitialPlayerResponse\s*=\s*/.exec(html);
  if (!marker) return null;
  const start = marker.index + marker[0].length;
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
    else if (char === '}' && --depth === 0) {
      const playerText = html.slice(start, i + 1);
      return /"isLiveNow"\s*:\s*true/.test(playerText) || /"videoDetails"\s*:\s*\{[^{}]*"isLive"\s*:\s*true/.test(playerText);
    }
  }
  return null;
}

function channelStreamBadge(data) {
  const stack = [data];
  while (stack.length) {
    const value = stack.pop();
    if (!value || typeof value !== 'object') continue;
    if (Array.isArray(value)) { stack.push(...value); continue; }
    const video = value.videoRenderer || value.gridVideoRenderer;
    if (video && typeof video === 'object') {
      const owner = video.ownerText?.simpleText || video.ownerText?.runs?.map(run => run.text).join('') || '';
      const badges = JSON.stringify(video.badges || []);
      const overlays = video.thumbnailOverlays || [];
      const live = video.isLiveNow === true || /BADGE_STYLE_TYPE_LIVE_NOW|"label":"(?:LIVE|AO VIVO)"/i.test(badges) || overlays.some(item => ['LIVE', 'LIVE_NOW'].includes(item.thumbnailOverlayTimeStatusRenderer?.style));
      if (live && /tricolor\s*fat/i.test(owner)) return true;
    }
    stack.push(...Object.values(value));
  }
  return false;
}

export default async function handler(req, res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') { res.setHeader('Allow', 'GET'); return res.status(405).json({ error: 'Método não permitido.' }); }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(CHANNEL_URL, {
      signal: controller.signal,
      headers: { Accept: 'text/html', 'Accept-Language': 'pt-BR,pt;q=0.9,en;q=0.8', 'User-Agent': 'Mozilla/5.0' }
    });
    if (!response.ok) throw new Error('Canal do YouTube indisponível');
    const html = await response.text();
    if (html.length > 8_000_000) throw new Error('Resposta do YouTube muito grande');

    const player = extractAssignedJson(html, 'ytInitialPlayerResponse');
    let live = playerSaysLive(player);
    if (live === null) live = playerHtmlSaysLive(html);
    if (live === null) {
      const data = extractAssignedJson(html, 'ytInitialData');
      if (!data) throw new Error('Status de transmissão indisponível');
      live = channelStreamBadge(data);
    }

    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('X-Tricolor-Live-Detector', 'player-r23');
    return res.status(200).json({ live, detector: 'player-r23', checkedAt: new Date().toISOString() });
  } catch {
    res.setHeader('Cache-Control', 'no-store');
    return res.status(502).json({ error: 'Não foi possível consultar o status do Tricolor FAT.' });
  } finally { clearTimeout(timer); }
}
