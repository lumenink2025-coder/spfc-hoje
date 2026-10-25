# Relatório de verificação — SPFC Hoje R6

Revisão concluída em 25/10/2026. Base: ZIP fornecido pelo usuário.

## Arquivos

- 29 scripts JavaScript externos e blocos inline aprovados na verificação de sintaxe do Node.js; o teste `.cjs` foi executado separadamente.
- Arquivos JSON parseados sem erro.
- Referências locais `src` e `href` dos HTML conferidas; nenhum arquivo local referenciado ausente.
- Nenhum ID duplicado encontrado nas páginas HTML.
- 42 arquivos originais de dados, imagens, ícones, notificações e Cloud Functions comparados byte a byte com o ZIP de origem, sem alteração.
- ZIP final submetido à verificação de integridade e conferência de seus arquivos contra a pasta revisada.

## Cache: 41 verificações aprovadas

O teste `tests/sw.test.cjs` executa o worker em ambiente isolado, nas instalações da raiz e da subpasta `/spfc-hoje/`.

Cobre atualização mediante escolha do usuário, arquivos relativos ao escopo, ativação, preservação dos caches de outros serviços, prioridade da rede, busca offline de arquivos com query de versão, página inicial offline, aviso de página não salva, exclusão de admin/login/perfil/API/OneSignal/Firebase, exclusão de POST e requisições autenticadas ou parciais, resposta 404 sem ocultação, alternativa em erro 5xx e isolamento entre projetos.

## Quiz e admin: 28 verificações aprovadas no navegador

Foram usados os scripts reais em páginas de teste com Firebase simulado. Nenhuma gravação de teste foi enviada ao banco de produção.

As 13 verificações do quiz cobrem resposta dupla, bloqueio das ajudas durante o feedback, avanço único, reinício das alternativas, descarte de clique antigo, cancelamento ao sair, eliminação de duas alternativas, Pular, os mesmos estados do quiz temático e gravação concorrente ou falha das estatísticas.

As 15 verificações do admin cobrem a presença e abertura das 10 seções restantes, a ausência dos controles e comandos do Palpitômetro, a leitura de 542 eventos sem confundir os 6 relatos do arquivo, e a preparação das 230 perguntas e 58 registros de Wordle pelos importadores.

## Revisão visual e interação

A interface da R5 foi inspecionada em navegador desktop e em quadros com larguras de 390 e 320 pixels. Essa revisão cobriu:

- Home, navegação inferior, calendário mensal e seleção de dia, sem transbordamento horizontal nas larguras conferidas.
- Abertura de memória, estatísticas, ação de favorito e créditos do Sobre.
- Carregamento de notícias via RSS.
- Perguntas reais do quiz e reinício das alternativas entre perguntas.
- Cartel Tricolor com 1.534 registros, busca por Rogério Ceni e abertura da ficha resultante.
- Acesso ao perfil e tratamento do visitante sem conta conectada.

## Verificação adicional da R6

- Home com exatamente dois jogos: Quiz e Wondler, em duas colunas no desktop e uma coluna no celular.
- Perfil com três estatísticas restantes, sem o card de palpites e sem transbordamento horizontal na largura de 320 pixels.
- Cadastro e integração de identidade sem promoção, migração ou campos novos específicos do Palpitômetro.
- Navegação para o endereço antigo redirecionando corretamente para `index.html`.
- Removidos os painéis e comandos administrativos do recurso; preservadas as 10 outras seções.
- Reexecutadas as 41 verificações do service worker e as 28 verificações de quiz/admin, todas aprovadas.
- Referências aos arquivos e sintaxe conferidas novamente antes de gerar o ZIP.

## Limites da validação

Os testes isolados verificam a lógica do service worker; não substituem uma atualização PWA real em HTTPS. A prévia local não foi usada para instalar ou atualizar uma instalação de produção.

Não foram executados login com a conta do proprietário, gravações reais do admin, disparo de notificações, publicação de Cloud Functions ou mudanças nas regras do Firebase. Esses fluxos mantêm as integrações existentes e precisam ser conferidos no domínio publicado com uma conta autorizada. A disponibilidade de RSS, imagens, vídeos e demais serviços externos depende dos respectivos provedores.
