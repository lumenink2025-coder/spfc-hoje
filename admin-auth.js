/* Login UI is independent from the Firebase module so startup failures remain visible. */
(() => {
  'use strict';
  let ready=false,busy=false,lastCode='inicializando',mounted=false;
  const $=id=>document.getElementById(id);
  const account=()=>String(window.SPFCAdminConfig?.email||'admin@spfchoje.com').trim().toLowerCase();
  function errorText(error){
    const messages={
      'auth/invalid-credential':'E-mail ou senha não conferem. Use a senha da conta administrativa do Firebase indicada acima.',
      'auth/wrong-password':'E-mail ou senha não conferem. Use a senha da conta administrativa do Firebase indicada acima.',
      'auth/user-not-found':'A conta administrativa não está disponível. Confira a conta em Firebase → Authentication → Users.',
      'auth/invalid-email':'Confira o formato do e-mail administrativo.',
      'auth/user-disabled':'Esta conta foi desativada no Firebase. O responsável pelo projeto precisa reativá-la.',
      'auth/operation-not-allowed':'O acesso por e-mail e senha está desativado no Firebase. Ative o provedor Email/Password em Authentication.',
      'auth/too-many-requests':'O Firebase bloqueou temporariamente novas tentativas. Aguarde antes de tentar novamente.',
      'auth/network-request-failed':'Não foi possível conectar ao Firebase. Confira a conexão e se o navegador está bloqueando os serviços do Google.',
      'auth/unauthorized-domain':'Este domínio não foi autorizado no Firebase. Confira Authentication → Settings → Authorized domains.',
      'auth/invalid-api-key':'A chave pública do projeto Firebase não foi aceita. Confira a configuração do projeto.',
      'auth/app-not-authorized':'O Firebase não autorizou este site. Confira as restrições da chave e a configuração do aplicativo.',
      'auth/unauthorized-email':'Este painel está configurado para outra conta. Confira o e-mail em admin-config.js.',
      'admin/sdk-unavailable':'Os componentes de login não carregaram. Confira a conexão e clique em Recarregar conexão.',
      'admin/setup-failed':'Não foi possível preparar a sessão de login. Recarregue a conexão e tente novamente.'
    };
    return messages[error?.code]||'Não foi possível entrar. Copie o diagnóstico abaixo para identificar a causa.';
  }
  function diagnostic(){return 'SPFC Hoje · Admin R7\nPágina: '+location.origin+location.pathname+'\nConexão do navegador: '+(navigator.onLine?'online':'offline')+'\nLogin carregado: '+(ready?'sim':'não')+'\nConta configurada: '+account()+'\nCódigo: '+lastCode;}
  function updateDiagnostic(){if($('adminDiagnostic'))$('adminDiagnostic').textContent=diagnostic();}
  function fail(error){lastCode=error?.code||'admin/unknown';$('loginErr').textContent=errorText(error);$('loginErr').dataset.code=lastCode;updateDiagnostic();}
  function showScreen(user){
    const allowed=!!user&&String(user.email||'').toLowerCase()===account();
    $('loginScreen').style.display=allowed?'none':'flex';$('adminScreen').style.display=allowed?'flex':'none';$('adminScreen').classList.toggle('visible',allowed);
    if(allowed){$('loginPass').value='';lastCode='autenticado';$('loginErr').textContent='';}
    updateDiagnostic();return allowed;
  }
  const slowBoot=setTimeout(()=>{if(!ready){fail({code:'admin/sdk-unavailable'});$('adminConnection').textContent='Conexão não concluída';}},15000);
  window._doLogin=window.doLogin=()=>{if(!ready)fail({code:'admin/sdk-unavailable'});};
  window.SPFCAdminAuth={errorText,diagnostic,async mount(api){
    if(mounted)return;mounted=true;
    const btn=$('adminLoginButton');$('loginEmail').value=account();
    try{await api.setPersistence(api.auth,api.inMemoryPersistence);}catch(error){clearTimeout(slowBoot);fail({code:error.code||'admin/setup-failed'});$('adminConnection').textContent='Sessão indisponível';return;}
    ready=true;clearTimeout(slowBoot);lastCode='pronto';btn.disabled=false;btn.textContent='ENTRAR';$('loginErr').textContent='';$('loginErr').dataset.code='';$('adminConnection').textContent='Conexão pronta';updateDiagnostic();
    api.onAuthStateChanged(api.auth,user=>showScreen(user),error=>fail(error));
    window._doLogin=window.doLogin=async function(){
      if(busy)return;
      const email=$('loginEmail').value.trim().toLowerCase(),pass=$('loginPass').value;
      if(!email||!pass){$('loginErr').textContent='Preencha o e-mail e a senha.';return;}
      if(email!==account()){fail({code:'auth/unauthorized-email'});return;}
      busy=true;btn.disabled=true;btn.textContent='ENTRANDO…';$('loginErr').textContent='';$('adminConnection').textContent='Autenticando no Firebase…';
      const slow=setTimeout(()=>{if(busy)$('loginErr').textContent='A conexão está demorando. Aguardando a resposta do Firebase…';},12000);
      try{
        const result=await api.signInWithEmailAndPassword(api.auth,email,pass);
        if(!showScreen(result.user)){await api.signOut(api.auth);fail({code:'auth/unauthorized-email'});}
      }catch(error){fail(error);}
      finally{clearTimeout(slow);busy=false;btn.disabled=false;btn.textContent='ENTRAR';$('adminConnection').textContent=api.auth.currentUser&&String(api.auth.currentUser.email).toLowerCase()===account()?'Autenticado':'Conexão pronta';}
    };
    window.doLogout=async function(){
      try{await api.signOut(api.auth);showScreen(null);$('loginPass').value='';$('loginErr').textContent='';$('adminConnection').textContent='Conexão pronta';lastCode='sessao-encerrada';updateDiagnostic();}
      catch(error){fail(error);if(typeof window.toast==='function')window.toast('Não foi possível encerrar a sessão. Tente novamente.','err');}
    };
  }};
  function bind(){
    $('loginEmail').value=account();
    $('adminLoginForm').addEventListener('submit',event=>{event.preventDefault();window._doLogin();});
    $('retryAdminConnection').addEventListener('click',()=>location.reload());
    $('copyAdminDiagnostic').addEventListener('click',async()=>{try{await navigator.clipboard.writeText(diagnostic());$('copyAdminDiagnostic').textContent='Diagnóstico copiado';}catch{$('diagnosticDetails').open=true;$('adminDiagnostic').focus();}});
    window.addEventListener('online',updateDiagnostic);window.addEventListener('offline',updateDiagnostic);updateDiagnostic();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',bind,{once:true});else bind();
})();
