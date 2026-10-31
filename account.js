(() => {
const modal=document.querySelector('#detail'), content=document.querySelector('#detailContent');
let state='loading', user=null, data=null, showing=false;
const safe=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const number=n=>Number.isFinite(Number(n))?Math.max(0,Number(n)).toLocaleString('pt-BR'):'0';
function paint(){
 const name=data?.displayName||data?.name||user?.displayName||user?.email?.split('@')[0]||'Torcedor';
 const initials=user?name.slice(0,1).toUpperCase():'◎';
 document.querySelector('#about').textContent=initials;
 if(!showing||!modal.open)return;
 content.innerHTML=`<article class="detail-body account-panel"><div class="eyebrow">SUA CONTA TRICOLOR</div><h2>Meu perfil</h2><div class="account-person"><span class="account-monogram">${safe(initials)}</span><div><h3>${safe(user?name:'Bem-vindo, torcedor')}</h3><p>${safe(user?.email||'Sua história com o Tricolor começa aqui.')}</p></div></div><div role="status">${state==='loading'?'<p>Carregando seu perfil…</p>':state==='error'?'<p>Não foi possível carregar seu perfil agora.</p><button class="text-btn" id="retry-account">Tentar novamente</button>':user?`<div class="account-stats"><div><strong>${number(data?.xp??data?.totalXP??0)}</strong><span>XP acumulado</span></div><div><strong>${number(data?.quizAcertos??data?.totalAcertos??0)}</strong><span>Acertos no quiz</span></div></div><button class="button" id="full-profile">Ver perfil e conquistas ↗</button>`:'<a class="button" href="cadastro.html">Entrar ou criar conta ↗</a>'}</div><button class="account-about" id="account-about"><span><strong>Sobre o SPFC Hoje</strong><small>O projeto, produção, fontes e créditos</small></span><span>↗</span></button></article>`;
 content.querySelector('#account-about').onclick=()=>{showing=false;window.openAbout()};
 content.querySelector('#retry-account')?.addEventListener('click',()=>location.reload());
 content.querySelector('#full-profile')?.addEventListener('click',fullProfile);
}
function open(){showing=true;if(!modal.open)modal.showModal();paint();modal.scrollTop=0}
function fullProfile(){
 showing=false;
 content.innerHTML='<section class="profile-view"><button class="text-btn" id="back-account">← Minha conta</button><iframe title="Meu perfil e conquistas" id="profile-frame"></iframe></section>';
 content.querySelector('#back-account').onclick=open;
 const frame=content.querySelector('iframe');
 frame.onload=()=>frame.contentWindow.fillPerfilFromCache?.(data||{},{uid:user.uid,email:user.email||''});
 frame.src='perfil.html';modal.scrollTop=0;
}
window.openAccount=open;
document.querySelector('#about').onclick=open;
document.addEventListener('click',e=>{if(e.target.closest('[data-open-account]')){e.preventDefault();open()}});
modal.addEventListener('close',()=>{showing=false;content.querySelector('iframe')?.remove()});
(async()=>{try{
 const [{initializeApp,getApps},{getAuth,onAuthStateChanged},{getFirestore,doc,getDoc}]=await Promise.all([
 import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
 import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'),
 import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')]);
 const cfg={
      apiKey:'AIzaSyAsjpwQwio7Y2SREpnrJf0DSb9fySkhlSY',
      authDomain:'spfc-hoje-da329.firebaseapp.com',
      projectId:'spfc-hoje-da329',
      storageBucket:'spfc-hoje-da329.firebasestorage.app',
      messagingSenderId:'116174859005',
      appId:'1:116174859005:web:b1e54b040aef23c9c16c94'
    };
 const app=getApps().find(a=>a.name==='[DEFAULT]')||initializeApp(cfg), db=getFirestore(app);
 onAuthStateChanged(getAuth(app),async current=>{
 user=current;data=null;state=current?'loading':'guest';paint();
 if(!current)return;
 try{const result=await getDoc(doc(db,'users',current.uid));if(user!==current)return;data=result.exists()?result.data():{};state='ready'}catch{if(user!==current)return;state='error'}paint();
 },()=>{state='error';paint()});
 }catch{state='error';paint()}})();
})();
