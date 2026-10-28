/* Only verified RSS feeds. Shared by the browser and the same-origin Vercel route. */
(function (root) {
  const sources = [
    { id: 'spfc', name: 'São Paulo FC', url: 'https://www.saopaulofc.net/feed/' },
    { id: 'blog', name: 'São Paulo Blog', url: 'https://saopaulo.blog/feed/' },
    { id: 'gazeta', name: 'Gazeta Esportiva', url: 'https://www.gazetaesportiva.com/times/sao-paulo/feed/' },
    { id: 'sempre', name: 'São Paulo Sempre', url: 'https://saopaulosempre.com.br/feed/' },
    { id: 'spfc24h', name: 'SPFC 24 Horas', url: 'https://spfc24horas.com.br/feed/' },
    { id: 'avante', name: 'Avante Meu Tricolor', url: 'https://avantemeutricolor.com.br/feed/' },
    { id: 'bolavip', name: 'Bolavip Brasil', url: 'https://br.bolavip.com/rss/feed/category/sao-paulo' },
    { id: 'trivela', name: 'Trivela', url: 'https://trivela.com.br/feed/', filter: true }
  ];
  if (typeof module === 'object' && module.exports) module.exports = sources;
  else root.SPFCNewsSources = sources;
})(globalThis);
