# Verificação da R8 — configuração atualizada em 27/10/2026

## Resultado

O site e o emissor novo estão preparados para configuração e testes de entrega. **Nenhuma notificação real foi enviada e nenhuma publicação foi realizada nesta revisão.** `push-config.js` contém o App ID público `42e3096a-8a52-4901-8bc0-bafcc7c2e44c` e `enabled:true`, permitindo a inscrição por botão após publicação e configuração da conta. O Worker permanece em `PUSH_MODE=off`. A atualização do App ID não confirma configuração nem acesso à conta OneSignal.

## Atualização da configuração em 27/10/2026

O App ID do link fornecido foi preenchido no cliente e em `wrangler.jsonc`. O cache passou a `20261027-r8-push2`. Foram conferidos o formato do ID, a mesma origem nas duas configurações, a sintaxe do arquivo, o modo de envio desligado e a integridade do ZIP. O comportamento da inscrição e do emissor não foi modificado.

## Verificações da implementação em 26/10/2026

- 27 casos automatizados do cliente de notificações e do emissor: seleção manual e automática, data de Brasília, ausência de destaque, erro de leitura, modo de teste restrito, modo desligado, chaves de idempotência, concorrência, perda de resposta, falha de KV, erro permanente, respeito a `Retry-After`, inscrição, pausa, bloqueio de permissão e timeout. Serviços simulados; sem envio real.
- 49 verificações do service worker/cache: cache por escopo, atualização explícita, uso offline e exclusão do admin, autenticação, `push-config.js` e worker de notificações. Caches do OneSignal e de outros apps são preservados.
- 25 verificações de autenticação administrativa preservadas e aprovadas, sem acessar a conta real.
- 34 scripts do site e scripts inline analisados com `node --check`; arquivos JSON e referências locais HTML verificados. Os módulos do emissor também passaram pela execução dos testes.
- Worker final conferido contra suas fontes e contra a regra de destaque usada pela Home.
- Leitura pública real do Firestore, sem escrita: as duas consultas funcionaram. Para 26/10/2026, a seleção devolveu “7x0 no Juventus”, ID `7uoPE7unhCyKfo1zpWKE`.
- Navegador: nova tela escura em desktop; página e Home em iframe de 375 px (360 px úteis com barra de rolagem), sem overflow horizontal; acesso pelo botão Notificações do menu confirmado.
- Link de evento novo testado em página isolada: o modal abriu após a chegada simulada dos dados, mesmo sem o registro no conjunto inicial. Essa página de QA está fora do ZIP.
- Admin, CSS escuro, autenticação administrativa, controles administrativos, arquivos de dados, imagens e ícones comparados em bytes com a R7. Preservados.
- As alterações do perfil se limitam ao link Notificações na navegação; seus scripts foram preservados.
- Funções Firebase antigas preservadas fora da pasta de publicação, para referência. O site não configura mais seu deploy.

Total: **101 verificações automatizadas aprovadas**, além das inspeções estáticas e visuais.

## Ainda depende da configuração e dos aparelhos

- App ID e chave válidos do aplicativo OneSignal, origem correta, arquivo do worker acessível em HTTPS e inscrição real.
- Implantação e medição do Worker no plano Cloudflare Free, com KV, Secret e cron reais.
- Desativação do agendamento Firebase anterior, se existir na nuvem.
- Recebimento real em iPhone/iPad instalado, Android e computador; abertura pelo aviso; pausa e reativação; comportamento com app fechado, modo Foco e rede indisponível.
- Confirmação do horário desejado. O pacote assume 8h em Brasília.

“Accepted” no emissor significa que a API aceitou o envio, não uma comprovação de que todos os aparelhos exibiram a mensagem. Os testes automatizados não substituem essa validação.

Veja `../COMECE-AQUI.md` para configurar, testar somente um aparelho e então ativar para os inscritos.
