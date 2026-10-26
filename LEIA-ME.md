# SPFC Hoje — Premium R7

Projeto completo para substituir os arquivos do site. Revisado em 26/10/2026.
Identificador do cache desta atualização: `20261026-r7-dark1`.

## Admin em cinza-escuro

Esta atualização da R7 aplica o tema escuro ao login e a todo o painel: cabeçalho, navegação, cartões, campos, listas, tabelas e janelas de edição. Os textos usam cinza-claro, com bordas visíveis e foco de teclado destacado. O tema escuro também é aplicado aos controles nativos e ao preenchimento automático do navegador.

As funções e a autenticação da R7 foram preservadas. Para instalar, publique o conteúdo completo deste ZIP atualizado; a referência do CSS do admin e a versão do cache já foram alteradas.

## O que mudou nesta entrega

- Logo em imagem retirada dos cabeçalhos, incluindo a Home no computador e no celular. O nome SPFC Hoje permanece em texto; os ícones de instalação e da aba do navegador continuam disponíveis.
- Login administrativo com e-mail visível, tratamento de falha no carregamento do Firebase e mensagens de erro persistentes.
- Removido o limite artificial de cinco segundos que interrompia a interface enquanto o Firebase ainda autenticava. Respostas lentas agora continuam sendo aguardadas.
- Botão para recarregar a conexão e diagnóstico copiável, sem senha ou token.
- Cache atualizado para R7. O admin e seus scripts ficam fora do cache; a Vercel recebe o cabeçalho `Cache-Control: no-store` para os recursos do admin.

O teste com a conta administrativa real ainda está pendente. Esta entrega corrige problemas encontrados no fluxo da página; não confirma se a senha, o provedor de autenticação ou as restrições do projeto Firebase estão corretos em produção.

## Publicação

1. Guarde uma cópia da versão atualmente publicada.
2. Extraia o ZIP e copie **todo o conteúdo** da pasta `spfc-hoje-premium/` para a raiz do projeto de hospedagem. Mantenha a estrutura de pastas. Se a Vercel usa um repositório Git, envie os arquivos atualizados para esse repositório e aguarde o novo deploy.
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

## Palpitômetro

O Palpitômetro foi retirado da home, do perfil, do cadastro, do admin e da integração de identidade. Os cards restantes foram reorganizados para desktop e celular. A remoção feita na R6 foi mantida.

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

## Testar o acesso administrativo

O painel usa a conta administrativa original `admin@spfchoje.com`, agora configurada em `admin-config.js`. Use a senha dessa conta no Firebase. Alterar esse arquivo não cria uma conta nem concede permissões no banco. Se o e-mail correto do administrador for outro, ele precisa corresponder à conta autorizada no projeto Firebase.

Após publicar, abra `admin.html`, aguarde **Conexão pronta** e tente entrar. Se falhar, abra **Diagnóstico de acesso**, copie o diagnóstico e informe o código exibido. Não compartilhe a senha. O diagnóstico distingue falha de credenciais, provedor desativado, conexão, carregamento do SDK e autorização. A sessão continua em memória, como na versão anterior; recarregar a página pede novo login.

## Cache e próximas versões

Publique o pacote completo para manter HTML, scripts, estilos e cache na mesma versão. Quando uma atualização estiver pronta, o visitante verá o aviso **Uma nova versão está pronta**. Pode concluir a atividade antes de tocar em **Atualizar**.

Em uma próxima entrega, altere `RELEASE` em `sw.js` e as versões nas URLs dos arquivos modificados. Preserve a mesma pasta de publicação. A limpeza é limitada ao cache do aplicativo nesse escopo; o prefixo legado `spfc-hoje-premium-` é removido apenas na instalação da raiz.

O cache offline cobre os recursos locais preparados e visitados. Firebase, RSS, fontes, fotos externas e vídeos exigem internet. `OneSignalSDKWorker.js` mantém a integração original; qualquer configuração adicional do painel do provedor continua externa a este pacote.

## Verificação

Consulte `VERIFICACAO.md` para resultados e limites da revisão. Para repetir os testes isolados, execute, na pasta do projeto:

```bash
node tests/sw.test.cjs
node tests/admin-auth.test.cjs
```

O projeto não foi publicado automaticamente. Login, gravações reais, notificações e atualização de uma instalação PWA existente devem ser conferidos no domínio de produção após a publicação.
