/* One registration per scope. A new release never interrupts a match or admin form. */
(() => {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  let requested = false;
  let reloaded = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (requested && !reloaded) { reloaded = true; location.reload(); }
  });
  function offerUpdate(registration) {
    if (!registration.waiting || document.getElementById('appUpdate')) return;
    const notice = document.createElement('aside');
    notice.id = 'appUpdate'; notice.className = 'app-update'; notice.setAttribute('role', 'status');
    notice.innerHTML = '<div><strong>Uma nova versão está pronta.</strong><span>Atualize quando terminar o que está fazendo.</span></div><button type="button" data-update>Atualizar</button><button type="button" data-dismiss aria-label="Lembrar depois">×</button>';
    notice.querySelector('[data-update]').onclick = () => {
      if (!registration.waiting) { location.reload(); return; }
      requested = true; registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    };
    notice.querySelector('[data-dismiss]').onclick = () => notice.remove();
    document.body.append(notice);
  }
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js', { scope: './', updateViaCache: 'none' });
      offerUpdate(registration);
      registration.addEventListener('updatefound', () => {
        const worker = registration.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed' && navigator.serviceWorker.controller) offerUpdate(registration);
        });
      });
      registration.update().catch(() => {});
      document.addEventListener('visibilitychange', () => {
        if (!document.hidden) { registration.update().catch(() => {}); offerUpdate(registration); }
      });
    } catch { /* The site remains usable without offline support. */ }
  });
})();
