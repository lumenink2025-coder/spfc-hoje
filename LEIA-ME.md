# SPFC Hoje — versão premium

Pacote para substituir os arquivos do site, mantendo as contas e dados do Firebase existente.

## Publicar na Vercel

1. Guarde uma cópia do projeto atualmente publicado.
2. Extraia o ZIP. Envie o conteúdo de `spfc-hoje-premium/` para a raiz do repositório conectado à Vercel.
3. Use o preset **Other**, sem comando de build e sem diretório de saída adicional. `index.html`, `main.html`, `admin.html` e `vercel.json` devem estar na raiz.
4. Publique. `index.html` e `main.html` abrem diretamente o layout editorial, sem redirecionamento; `admin.html` é o painel de administração.
5. Em um domínio novo, autorize-o em Firebase Authentication → Settings → Authorized domains. As regras e permissões atuais do Firestore continuam obrigatórias.

## Telas

- `main.html`: layout editorial aprovado, calendário lateral no desktop, destaques, RSS e links para os catálogos completos.
- `calendario.html`: endereço adicional para o mesmo layout editorial.
- `quiz.html`: quiz completo com o visual aprovado e correção do banner.
- `jogadores.html`: Cartel Tricolor; 1.534 registros e filtros originais.
- `spfc_historia.html`: arquivo com 6.079 partidas.
- `tecnicos.html` e `tecnico.html`: catálogo e ficha de técnicos.
- `goleadores.html`: artilharia.
- `galeria-dos-imortais.html`: condecorações.
- `wondler.html`, `palpitometro.html`, `cadastro.html`, `perfil.html`: modos e conta.
- `admin.html`: eventos, perguntas, Wordle, relatos, destaques, palpites, temas e goleadores.

## Senha do admin

A senha pedida foi mantida no valor `ADMIN_PASS` do código, conforme solicitado. O login real usa `signInWithEmailAndPassword` e o e-mail administrativo já existente. A constante `ADMIN_PASS` não define nem altera a senha da conta no Firebase.

**A senha do Firebase não foi alterada nesta entrega.** Para usar a nova senha no login, altere a senha dessa conta pelo fluxo de redefinição do Firebase Authentication. A autenticação e as regras do banco não foram contornadas. O logout agora encerra a sessão Firebase.

## Notícias, imagens e notificações

O RSS mantém o serviço intermediário existente. Sua disponibilidade depende desse serviço externo; não foi substituído por um provedor pago. O endpoint opcional `/api/news` lê `NEWS_API_KEY` das variáveis da Vercel; não é necessário configurá-lo para o RSS atual. Nenhuma chave privada desse provedor foi incluída no pacote.

As imagens remotas, Firebase, fontes, YouTube e o serviço de notificações exigem internet. Os dados JSON de jogadores, jogos, técnicos, artilharia e condecorações estão incluídos.

`functions/` mantém as Cloud Functions originais, para publicação separada no Firebase caso necessário. Publicar este ZIP na Vercel não publica funções Firebase nem altera suas regras. Não é necessário republicá-las apenas para trocar o visual.

## Atualização e cache

O service worker usa cache versionado e busca a versão atual na rede antes de recorrer ao cache. O admin, login, perfil, API e requisições externas não entram nesse cache. Apenas caches antigos com prefixo `spfc-hoje-` são limpos. Em próximas atualizações, altere a versão em `sw.js`.

## Validação desta entrega

Verificados: sintaxe JavaScript, arquivos JSON, caminhos locais referenciados por HTML, catálogo e filtros dos jogadores. Os IDs dos controles e manipuladores existentes foram preservados nas páginas funcionais.

Não houve teste visual de navegador nesta sessão. Login real, gravações do admin, pagamentos (se houver), pontuação e notificações em produção não foram executados. Nenhum registro do Firebase foi criado, apagado ou modificado durante a preparação. Valide esses fluxos com sua conta após publicar antes de anunciar a atualização.

## Correção desta versão

Removido o ciclo index → main → index de visitantes sem login. Restaurada a página principal editorial aprovada. As 11 seções do admin têm atalhos visíveis, inclusive no celular. Nenhuma permissão de banco foi alterada. Testes isolados confirmaram abertura dos 11 painéis, presença dos atalhos e ausência dos redirecionamentos de entrada. A validação visual e as gravações reais continuam pendentes.
