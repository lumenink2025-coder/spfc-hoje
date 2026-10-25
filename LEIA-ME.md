# SPFC Hoje — Premium R6

Projeto completo para substituir os arquivos do site. Revisado em 25/10/2026.
Identificador do código e do cache: `20261025-r6`.

## Publicação

1. Guarde uma cópia da versão atualmente publicada.
2. Extraia o ZIP e envie **todo o conteúdo** da pasta `spfc-hoje-premium/` para a raiz do projeto de hospedagem. Mantenha a estrutura de pastas.
3. Na Vercel, use o preset **Other**, sem comando de build e sem diretório de saída adicional. `index.html` e `vercel.json` ficam na raiz.
4. No GitHub Pages, publique a pasta que contém `index.html`. Os caminhos relativos funcionam também em uma subpasta como `/spfc-hoje/`. O endpoint opcional `api/news.js` exige uma hospedagem com funções; o RSS atual usa o intermediário já configurado no projeto.
5. No Firebase Hosting, use a configuração `firebase.json` incluída e publique somente o Hosting para atualizar o site. Não é necessário republicar as Cloud Functions para trocar a interface.
6. Se usar um domínio novo, inclua-o nos domínios autorizados do Firebase Authentication.

Abra o site por HTTP/HTTPS, não por duplo clique no arquivo HTML. O funcionamento do service worker exige HTTPS, ou localhost durante desenvolvimento. Não há etapa de compilação.

## Interface e recursos

A página inicial tem identidade tricolor, destaque editorial, navegação lateral no desktop e barra inferior no celular. O calendário tem endereço próprio, `calendario.html`, e pode ser acessado pelo menu. Foram mantidos pesquisa, acervo, favoritos, compartilhamento e detalhes das memórias, incluindo estatísticas, créditos das imagens e vídeos.

Também foram mantidos:

- Quiz tradicional, quiz temático, ranking, ajudas e modos existentes.
- Wondler, RSS e respectivos acessos.
- Cartel Tricolor com 1.534 jogadores, busca, filtros e fichas.
- Arquivo de 6.079 partidas, técnicos, goleadores e Galeria dos Imortais.
- Cadastro, perfil, progresso e conquistas. O perfil mostra os dados da conta; visitantes recebem um convite para entrar.
- Sobre, com os créditos do Magazine Tricolor, de Michael Serra, do Calendário Histórico SPFC 2025 e do spfcpedia.
- As 10 seções do admin: novo evento, eventos, migração, perguntas, Wordle, relatos, destaque, sexta temática, jogos e goleadores.

## Versão final R6

O Palpitômetro foi retirado da home, do perfil, do cadastro, do admin e da integração de identidade. Os cards restantes foram reorganizados para desktop e celular. O cache passou para `20261025-r6`.

O arquivo `palpitometro.html` contém somente um redirecionamento para a página inicial, para que favoritos e links antigos continuem funcionando. Ele não contém o jogo nem acessa o Firebase. Os dados históricos já existentes no banco não foram apagados.

## Correções principais

- Um ponto de registro do service worker por página, cache separado por pasta de publicação e versão, e busca na rede antes de usar uma cópia salva.
- Atualização oferecida ao usuário, com ativação explícita e uma única recarga da aba que aceitou a atualização.
- Admin, autenticação, perfil, chamadas externas e requisições autenticadas fora do cache de conteúdo. O arquivo do OneSignal original foi preservado.
- Caminhos locais corrigidos para publicação em subpastas.
- Quiz com bloqueio de resposta repetida, limpeza das alternativas ao avançar, cancelamento de transições ao sair, correção da ajuda Pular e proteção contra gravações simultâneas das estatísticas.
- Eventos, perguntas, Wordle e tema consultam os dados atuais do Firestore, com os JSON incluídos como alternativa quando a leitura remota falha. Uma coleção remota vazia é respeitada.
- Os importadores do admin leem os arquivos JSON reais. Os 6 relatos que acompanham o arquivo de eventos não são importados como eventos.
- Alterações e remoções de imagem feitas pelo admin são respeitadas. Favoritos de eventos novos são mantidos entre visitas.

## Contas e dados

A configuração pública do Firebase original permanece. A senha de uma conta é gerida pelo Firebase Authentication, não por uma constante no HTML. Não foram alterados usuários, senhas, regras, permissões ou registros em produção.

Os arquivos de dados, imagens, ícones, notificações e Cloud Functions originais foram preservados. O admin continua dependendo das permissões existentes no Firestore. Não execute migrações sobre uma base já preenchida sem verificar o destino e guardar seu backup.

## Cache e próximas versões

Publique o pacote completo para manter HTML, scripts, estilos e cache na mesma versão. Quando uma atualização estiver pronta, o visitante verá o aviso **Uma nova versão está pronta**. Pode concluir a atividade antes de tocar em **Atualizar**.

Em uma próxima entrega, altere `RELEASE` em `sw.js` e as versões nas URLs dos arquivos modificados. Preserve a mesma pasta de publicação. A limpeza é limitada ao cache do aplicativo nesse escopo; o prefixo legado `spfc-hoje-premium-` é removido apenas na instalação da raiz.

O cache offline cobre os recursos locais preparados e visitados. Firebase, RSS, fontes, fotos externas e vídeos exigem internet. `OneSignalSDKWorker.js` mantém a integração original; qualquer configuração adicional do painel do provedor continua externa a este pacote.

## Verificação

Consulte `VERIFICACAO.md` para resultados e limites da revisão. Para repetir os testes isolados do service worker, execute, na pasta do projeto:

```bash
node tests/sw.test.cjs
```

O projeto não foi publicado automaticamente. Login, gravações reais, notificações e atualização de uma instalação PWA existente devem ser conferidos no domínio de produção após a publicação.
