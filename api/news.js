export default async function handler(req, res) {
  const q = req.query.q || 'São Paulo FC SPFC';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=pt&sortBy=publishedAt&pageSize=15&apiKey=045cb18a45b8431690459c20a94415cb`;
  
  try {
    const r = await fetch(url);
    const data = await r.json();
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.json(data);
  } catch (e) {
    res.status(502).json({ status: 'error', message: e.message });
  }
}
