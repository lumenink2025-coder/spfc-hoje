# SPFC — Hoje na História 🔴⚪⚫
### Web App / PWA do Calendário Histórico São Paulo FC

---

## 📁 Estrutura de Arquivos

```
spfc-hoje/
├── index.html          ← App principal (tudo em um arquivo)
├── sw.js               ← Service Worker (PWA + cache offline)
├── manifest.json       ← Manifesto PWA (ícones, tema, shortcuts)
├── icons/
│   ├── icon-72.png
│   ├── icon-96.png
│   ├── icon-128.png
│   ├── icon-144.png
│   ├── icon-152.png
│   ├── icon-192.png
│   ├── icon-384.png
│   ├── icon-512.png
│   └── badge-72.png
└── README.md
```

---

## 🚀 Como Publicar

### Opção 1 — Vercel (Recomendado, grátis)
```bash
npm install -g vercel
cd spfc-hoje
vercel --prod
```
→ Seu app estará em `https://spfc-hoje.vercel.app` em 60 segundos.

### Opção 2 — Netlify (Drag & Drop)
1. Acesse [netlify.com](https://netlify.com)
2. Arraste a pasta `spfc-hoje/` para o painel
3. Pronto — URL gerada automaticamente

### Opção 3 — GitHub Pages
```bash
git init
git add .
git commit -m "SPFC Hoje na História v1.0"
git branch -M main
git remote add origin https://github.com/SEU_USUARIO/spfc-hoje.git
git push -u origin main
```
→ Ative GitHub Pages nas configurações do repositório → Source: `main`

### Opção 4 — Firebase Hosting
```bash
npm install -g firebase-tools
firebase login
firebase init hosting
firebase deploy
```

---

## 🔔 Push Notifications (Configuração)

Para as notificações diárias funcionarem em produção:

### Firebase Cloud Messaging (FCM) — Recomendado
1. Crie projeto em [console.firebase.google.com](https://console.firebase.google.com)
2. Adicione o Firebase SDK ao `index.html`
3. Configure o FCM no `sw.js`
4. Use o **Firebase Scheduled Functions** para enviar às 8h todo dia

### Exemplo de payload (enviar via FCM):
```json
{
  "notification": {
    "title": "🔴 São Paulo FC — Hoje na História",
    "body": "Hoje faz aniversário de uma noite inesquecível do Tricolor."
  },
  "webpush": {
    "notification": {
      "icon": "/icons/icon-192.png",
      "badge": "/icons/badge-72.png",
      "tag": "spfc-hoje",
      "requireInteraction": false
    }
  }
}
```

### Mensagens sugeridas (rodízio diário):
- *"Hoje o Morumbi tremia. Você sabe o motivo?"*
- *"Há X anos o São Paulo escreveu história."*
- *"Você lembra onde estava nesse dia?"*
- *"Hoje faz aniversário de uma noite inesquecível."*
- *"Uma data marcante para o futebol tricolor. Venha reviver."*

---

## ⚙️ Personalização

### Adicionar novos eventos
No `index.html`, localize o objeto `DB` e adicione eventos no formato:

```javascript
DB[MES][DIA].push({
  cat: 'vitoria',        // vitoria | titulo | aniversario | estreia | despedida | fundacao
  emoji: '⚽',
  title: 'Título do evento',
  desc: 'Descrição curta',
  year: 1992,
  context: 'Contexto histórico mais longo (opcional)'
});
```

### Categorias disponíveis
| Categoria   | Emoji | Cor          |
|-------------|-------|--------------|
| vitoria     | ⚽    | Vermelho     |
| titulo      | 🏆    | Dourado      |
| aniversario | 🎂    | Azul         |
| estreia     | ⭐    | Verde        |
| despedida   | 👋    | Laranja      |
| fundacao    | 🎂    | Dourado      |

---

## 📱 PWA — Instalar no Celular

**Android (Chrome):**
1. Abra o site no Chrome
2. Toque no banner de instalação OR menu → "Adicionar à tela inicial"

**iOS (Safari):**
1. Abra o site no Safari
2. Toque em Compartilhar (ícone quadrado com seta)
3. "Adicionar à Tela de Início"

---

## 🎨 Design

- **Tipografia:** Bebas Neue (títulos) + IBM Plex Mono (código/datas) + Special Elite (corpo)
- **Paleta:** Vermelho #CC0000 · Preto #0a0a0a · Branco #F5F0E8 · Dourado #C8A84B
- **Estética:** VHS / TV antiga / transmissão esportiva retrô / cinematográfico
- **Mobile-first:** otimizado para 375-430px, responsivo até desktop

---

## 📊 Dados

- **Fonte:** Calendário Histórico SPFC 2025
- **Produção:** Michael Serra · Arquivo Histórico João Farah
- **Total de eventos:** ~450+ eventos históricos catalogados
- **Cobertura:** Janeiro a Dezembro, de 1930 até 2024

---

## 🏆 Próximos Passos Sugeridos

- [ ] Integrar com API de fotos do SPFC
- [ ] Adicionar áudio: narração dos momentos históricos
- [ ] Modo "Máquina do Tempo": veja qualquer ano
- [ ] Ranking de "dias mais históricos"
- [ ] Compartilhamento de cards no Instagram Stories
- [ ] Backend com banco de dados para atualizações fáceis
- [ ] Analytics: quais eventos mais acessados

---

*Feito com ❤️ por torcedores, para torcedores.*
*Vai São Paulo! 🔴⚪⚫*
