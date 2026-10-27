/* Consent is local to this browser. No user account, email or REST key is needed. */
(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const config = window.SPFCPushConfig || {};
  const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  let sdk = null, pending = false, subscriptionTimer;
  function show(state, title, description, enable = false) {
    $('push-state').dataset.state = state;
    $('push-status').textContent = title;
    $('push-description').textContent = description;
    $('push-enable').hidden = !enable;
    $('push-enable').disabled = pending || !sdk;
    $('push-disable').hidden = state !== 'active';
    $('push-disable').disabled = pending;
    $('push-diagnostic').hidden = state !== 'active';
    $('push-retry').hidden = !['error', 'blocked'].includes(state);
    $('push-retry').textContent = state === 'blocked' ? 'Verificar a permissão novamente' : 'Recarregar e tentar novamente';
  }
  function render() {
    if (!sdk) return;
    const sub = sdk.User.PushSubscription;
    if (Notification.permission === 'denied') {
      pending = false;
      clearTimeout(subscriptionTimer);
      show('blocked', 'Permissão bloqueada', 'Libere as notificações deste site nos ajustes do navegador ou do sistema e volte aqui. O site não pode alterar essa escolha por você.');
    } else if (sdk.Notifications.permission && sub.optedIn && sub.id && sub.token) {
      pending = false;
      clearTimeout(subscriptionTimer);
      $('push-subscription-id').value = sub.id;
      show('active', 'Notificações ativadas', 'Este aparelho está inscrito para receber o destaque do dia. Você pode pausar abaixo.');
    } else if (pending) {
      show('loading', 'Concluindo a inscrição…', 'Aguardando a permissão e a confirmação deste aparelho.');
    } else {
      const paused = Notification.permission === 'granted';
      show('inactive', paused ? 'Notificações pausadas' : 'Receba a próxima memória', paused ? 'A permissão está liberada. Toque em ativar para inscrever este aparelho.' : 'Ative e confirme a permissão do navegador para receber o destaque do dia.', true);
    }
  }
  function fail() {
    pending = false;
    clearTimeout(subscriptionTimer);
    show('error', 'Não foi possível confirmar', 'Confira a conexão e tente novamente. Se usar um bloqueador, permita o serviço de notificações neste site.');
  }
  $('push-enable').addEventListener('click', async () => {
    if (!sdk || pending) return;
    pending = true;
    render();
    try {
      // Call optIn in the click handler: Safari requires an explicit user gesture.
      await sdk.User.PushSubscription.optIn();
      if (Notification.permission !== 'granted') pending = false;
      render();
      if (pending) subscriptionTimer = setTimeout(() => {
        render();
        if (pending) fail();
      }, 20000);
    } catch { fail(); }
  });
  $('push-disable').addEventListener('click', async () => {
    if (!sdk || pending) return;
    pending = true;
    $('push-disable').disabled = true;
    try {
      await sdk.User.PushSubscription.optOut();
      pending = false;
      render();
    } catch { fail(); }
  });
  $('push-retry').addEventListener('click', () => location.reload());
  $('push-copy').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText($('push-subscription-id').value);
      $('copy-status').textContent = 'ID copiado.';
    } catch {
      $('push-subscription-id').select();
      $('copy-status').textContent = 'Selecione e copie o ID acima.';
    }
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) render(); });
  async function start() {
    if (!config.enabled || !uuid.test(config.appId || '')) {
      show('unavailable', 'Avisos em preparação', 'Estamos preparando as notificações do SPFC Hoje. Volte em breve para ativar neste aparelho.');
      return;
    }
    let canonical;
    try {
      canonical = new URL(config.siteOrigin);
      if (canonical.protocol !== 'https:' || canonical.username || canonical.password || canonical.pathname !== '/' || canonical.search || canonical.hash) throw Error();
    } catch { fail(); return; }
    if (location.origin !== canonical.origin) {
      show('unavailable', 'Ative no endereço principal', 'As notificações pertencem ao endereço em que você se inscreve. Continue no site principal do SPFC Hoje.');
      $('push-canonical').href = new URL('/notificacoes.html', canonical).href;
      $('push-canonical').hidden = false;
      return;
    }
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const standalone = navigator.standalone === true || matchMedia('(display-mode: standalone)').matches || matchMedia('(display-mode: fullscreen)').matches;
    if (ios && !standalone) {
      show('install', 'Adicione à Tela de Início', 'No iPhone e no iPad, as notificações funcionam pelo site instalado. Siga os passos abaixo.');
      $('ios-help').hidden = false;
      return;
    }
    if (!window.isSecureContext || !('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      show('unsupported', 'Este navegador não oferece notificações', 'Use um navegador atualizado em uma janela comum. No iPhone ou iPad, use iOS 16.4 ou mais recente e abra o site instalado pela Tela de Início.');
      return;
    }
    show('loading', 'Conectando…', 'Preparando a inscrição neste dispositivo.');
    const timer = setTimeout(fail, 20000);
    window.OneSignalDeferred = window.OneSignalDeferred || [];
    window.OneSignalDeferred.push(async OneSignal => {
      try {
        await OneSignal.init({
          appId: config.appId,
          serviceWorkerPath: 'push/onesignal/OneSignalSDKWorker.js',
          serviceWorkerParam: { scope: '/push/onesignal/' },
          autoResubscribe: false,
          notifyButton: { enable: false },
          welcomeNotification: { disable: true },
          promptOptions: { slidedown: { prompts: [{ type: 'push', autoPrompt: false }] } },
          notificationClickHandlerMatch: 'exact',
          notificationClickHandlerAction: 'navigate'
        });
        clearTimeout(timer);
        sdk = OneSignal;
        sdk.User.PushSubscription.addEventListener('change', render);
        sdk.Notifications.addEventListener('permissionChange', render);
        render();
      } catch { clearTimeout(timer); fail(); }
    });
    const script = document.createElement('script');
    script.src = 'https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js';
    script.defer = true;
    script.onerror = () => { clearTimeout(timer); fail(); };
    document.head.append(script);
  }
  start().catch(fail);
})();
