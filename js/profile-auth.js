/* Perfil identifica a sessão pelo Firebase Authentication; não consulta documentos de usuário no Firestore. */
(async () => {
  const notice = document.createElement('div');
  notice.className = 'profile-auth-status'; notice.setAttribute('role', 'status');
  notice.style.cssText = 'padding:16px 22px;background:#252029;color:#ddd;font:13px/1.6 Arial,sans-serif;border-bottom:1px solid #ffffff15';
  notice.textContent = 'Carregando seu perfil…'; document.body.prepend(notice);
  try {
    const fb = await SPFCData.firebase();
    fb.onAuthStateChanged(fb.auth, async user => {
      if (!user) { notice.innerHTML = 'Entre para ver seu progresso e suas conquistas. <a href="cadastro.html" style="color:#ff8ba3;text-decoration:underline">Entrar ou criar conta</a>'; return; }
      await window.fillPerfilFromCache({}, user); notice.remove();
    });
  } catch { notice.textContent = 'Não foi possível verificar sua sessão. Tente novamente quando estiver online.'; }
})();
