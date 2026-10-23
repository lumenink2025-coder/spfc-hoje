export default async function handler(req,res){
  res.setHeader('Cache-Control','s-maxage=600, stale-while-revalidate=1800');
  if(req.method!=='GET')return res.status(405).json({error:'Método não permitido.'});
  const key=process.env.NEWS_API_KEY;
  if(!key)return res.status(503).json({error:'Configure NEWS_API_KEY na hospedagem para ativar este endpoint opcional.'});
  const url=new URL('https://newsapi.org/v2/everything');
  url.searchParams.set('q',String(req.query.q||'São Paulo FC SPFC').slice(0,200));url.searchParams.set('language','pt');url.searchParams.set('sortBy','publishedAt');url.searchParams.set('pageSize','12');
  try{const r=await fetch(url,{headers:{'X-Api-Key':key},signal:AbortSignal.timeout(8000)});if(!r.ok)return res.status(502).json({error:'O provedor de notícias não respondeu.'});return res.status(200).json(await r.json());}catch{return res.status(502).json({error:'Não foi possível carregar as notícias.'});}
}
