# Relatório de verificação — SPFC Hoje R7

Revisão de 26/10/2026. Base: SPFC-Hoje-final-R6.zip. Cache: `20261026-r7-dark1`.

## Atualização visual do admin

- Tema cinza-escuro conferido em navegador desktop e em quadro mobile de 375 pixels, sem transbordamento horizontal na tela inicial do painel.
- Formulário de evento, tabela de partidas, janela de edição de goleador e navegação mobile conferidos usando uma cópia isolada com dados locais e gravações desabilitadas. Essa cópia não integra o ZIP.
- Fundos de página, cartões e campos verificados no navegador: `#17181b`, `#202226` e `#191b1f`. Textos principais: `#eceef2`. Controles nativos com `color-scheme: dark`.
- Nenhuma alteração nos scripts de autenticação nem nos comandos de edição. Esta atualização não substitui a validação de login real descrita abaixo.

## Arquivos e preservação

- 31 scripts JavaScript externos e blocos inline aprovados na verificação de sintaxe do Node.js.
- Arquivos JSON válidos e referências locais `src`/`href` dos HTML conferidas, sem arquivos ausentes.
- 41 arquivos de dados, imagens, ícones, notificações, integrações e funções comparados byte a byte com a R6, sem alteração.
- As 10 seções administrativas continuam presentes. O bloco funcional do admin, a partir de `// Page titles for each tab`, foi comparado com a R6 e permanece idêntico.
- Calendário, quiz, Wondler, RSS, Cartel Tricolor, perfil, Sobre e créditos mantidos. O Palpitômetro continua removido.
- Arquivo ZIP conferido quanto à integridade e correspondência dos bytes com os arquivos revisados. Páginas temporárias de inspeção visual excluídas do pacote.

## Login: 25 verificações aprovadas

Executadas com o arquivo real `admin-auth.js` em ambiente isolado, com DOM e Firebase simulados. Os testes não enviam tentativas de login nem gravações ao projeto de produção.

Cobertura: disponibilidade do SDK, conta configurada, campos vazios, rejeição de e-mail diferente da conta configurada, envio duplicado, resposta lenta sem cancelamento artificial, painel oculto durante espera, sucesso tardio, limpeza do campo de senha, saída da conta, erros persistentes, nova tentativa, diagnóstico sem senha, falhas de rede/configuração e recuperação após carregamento lento do SDK.

Para repetir: `node tests/admin-auth.test.cjs`.

## Cache: 45 verificações aprovadas

Executadas com `sw.js` em ambiente isolado, nas instalações da raiz e da subpasta `/spfc-hoje/`.

Cobertura: atualização por escolha do usuário, recursos relativos ao escopo, limpeza dos caches da versão anterior, preservação dos caches de outros serviços e do OneSignal, prioridade da rede, uso offline, erros 404/5xx, isolamento entre projetos, exclusão de admin e seus novos scripts, login/perfil/API/Firebase, POST e requisições autenticadas ou parciais.

Para repetir: `node tests/sw.test.cjs`.

## Conferência no navegador

- Home sem imagem de logo no cabeçalho do computador e do celular.
- Quadro mobile de 375 pixels: largura do conteúdo e largura de rolagem iguais a 375 pixels, sem transbordamento horizontal.
- Admin local carregando o SDK real do Firebase, mostrando **Conexão pronta**, botão **ENTRAR** habilitado e diagnóstico disponível.
- Página administrativa publicada na Vercel acessível em leitura; seu HTML correspondia à base R6 antes desta entrega.

## Limites

Não foi realizado login com a conta do proprietário. O erro exato informado pelo Firebase na tentativa do usuário ainda precisa ser coletado. A conexão pronta confirma o carregamento dos componentes, não valida a senha nem as permissões do banco.

Não foram feitas gravações reais do admin, alterações de contas, senhas ou regras, disparos de notificações, publicação de Cloud Functions ou deploy do site. A atualização de uma instalação PWA de produção ainda deve ser conferida após publicar o pacote completo.

Os testes de quiz e das seções de conteúdo registrados na R6 não foram repetidos integralmente nesta revisão. O código dessas funções foi preservado. Serviços externos como RSS, imagens e vídeos dependem dos respectivos provedores.
