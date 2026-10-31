(() => {
  const modal = document.getElementById('detail');
  const content = document.getElementById('detailContent');
  let state = 'loading', user = null, data = null, showing = false, fb;
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const number = n => Number.isFinite(Number(n)) ? Math.max(0, Number(n)).toLocaleString('pt-BR') : '0';
  function paint() {
    const name = data?.displayName || data?.name || user?.displayName || user?.email?.split('@')[0] || 'Torcedor';
    const initials = user ? name.slice(0, 1).toUpperCase() : '◎';
    const avatar = data?.avatarUrl || data?.avatar?.url || '';
    const safeAvatar = /^https:\/\//i.test(avatar) ? avatar : '';
    document.getElementById('about').textContent = initials;
    window.SPFCAccount = { user, data, name, state };
    window.dispatchEvent(new Event('spfc-account'));
    if (!showing || !modal.open) return;
    content.innerHTML = `<article class="detail-body account-panel"><div class="eyebrow">SUA CONTA TRICOLOR</div><h2>Meu perfil</h2><div class="account-person"><span class="account-monogram">${safeAvatar?`<img src="${safe(safeAvatar)}" alt="" onerror="this.hidden=true">`:safe(initials)}</span><div><h3>${safe(user ? name : 'Bem-vindo, torcedor')}</h3><p>${safe(user?.email || 'Sua história com o Tricolor começa aqui.')}</p></div></div><div class="account-status" role="status">${state === 'loading' ? '<p>Carregando seu perfil…</p>' : state === 'error' ? '<p>Não foi possível carregar seu perfil. Confira sua conexão.</p><button class="text-btn" id="retry-account">Tentar novamente</button> <a href="cadastro.html" class="text-btn">Entrar</a>' : user ? `<div class="account-actions"><a class="button" href="perfil.html">Perfil e conquistas ↗</a><button class="text-btn" id="signout-account">Sair</button></div>` : '<a class="button" href="cadastro.html">Entrar ou criar conta ↗</a>'}</div><button class="account-about" id="account-about"><span><strong>Sobre o MAGAZINE TRICOLOR</strong><small>O projeto, produção, fontes e créditos</small></span><span>↗</span></button></article>`;
    content.querySelector('#account-about').onclick = () => { showing = false; window.openAbout(); };
    content.querySelector('#retry-account')?.addEventListener('click', () => location.reload());
    content.querySelector('#signout-account')?.addEventListener('click', async () => {
      try { await fb.signOut(fb.auth); } catch { state = 'error'; paint(); }
    });
  }
  function open() { delete modal.dataset.eventId; showing = true; if (!modal.open) modal.showModal(); paint(); modal.scrollTop = 0; }
  window.openAccount = open;
  document.getElementById('about').onclick = open;
  document.addEventListener('click', event => { if (event.target.closest('[data-open-account]')) { event.preventDefault(); open(); } });
  modal.addEventListener('close', () => { showing = false; });
  (async () => {
    try {
      fb = await SPFCData.firebase();
      fb.onAuthStateChanged(fb.auth, current => {
        user = current; data = {}; state = current ? 'ready' : 'guest'; paint();
      }, () => { state = 'error'; paint(); });
    } catch { state = 'error'; paint(); }
  })();
})();
