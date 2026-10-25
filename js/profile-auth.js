(async () => {
  const notice = document.createElement('div');
  notice.className = 'profile-auth-status'; notice.setAttribute('role', 'status');
  notice.style.cssText = 'padding:16px 22px;background:#252029;color:#ddd;font:13px/1.6 Arial,sans-serif;border-bottom:1px solid #ffffff15';
  notice.textContent = 'Carregando seu perfil…'; document.body.prepend(notice);
  try {
    const fb = await SPFCData.firebase();
    fb.onAuthStateChanged(fb.auth, async user => {
      if (!user) {
        notice.innerHTML = 'Entre para ver seu progresso e suas conquistas. <a href="cadastro.html" style="color:#ff8ba3;text-decoration:underline">Entrar ou criar conta</a>';
        return;
      }
      try {
        const snap = await SPFCData.deadline(fb.getDoc(fb.doc(fb.db, 'users', user.uid)));
        await window.fillPerfilFromCache(snap.exists() ? snap.data() : {}, user);
        notice.remove();
      } catch { notice.textContent = 'Não foi possível carregar os dados do perfil. Confira sua conexão e recarregue a página.'; }
    });
  } catch { notice.textContent = 'O perfil precisa de conexão para carregar seus dados. Tente novamente quando estiver online.'; }
})();
