/* Dados públicos vêm exclusivamente dos JSONs publicados em /data. Firebase é reservado à autenticação e ranking. */
(() => {
  'use strict';
  const cache = new Map();
  let authConnection;
  const firebaseConfig = { apiKey:'AIzaSyAsjpwQwio7Y2SREpnrJf0DSb9fySkhlSY', authDomain:'spfc-hoje-da329.firebaseapp.com', projectId:'spfc-hoje-da329', appId:'1:116174859005:web:b1e54b040aef23c9c16c94' };
  async function firebase() {
    if (!authConnection) authConnection = Promise.all([import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'), import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js'), import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js')]).then(([appSDK, authSDK, firestoreSDK]) => {
      const app = appSDK.getApps().find(a => a.name === '[DEFAULT]') || appSDK.initializeApp(firebaseConfig);
      return { ...authSDK, auth:authSDK.getAuth(app), db:firestoreSDK.getFirestore(app), doc:firestoreSDK.doc, getDoc:firestoreSDK.getDoc };
    }).catch(error => { authConnection=null; throw error; });
    return authConnection;
  }
  async function json(path) {
    const url = new URL(path, document.baseURI);
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) throw new Error('Conteúdo indisponível: ' + path);
    return response.json();
  }
  async function list(_collectionName, path) {
    if (!path) throw new Error('Caminho do JSON não informado');
    if (!cache.has(path)) cache.set(path, json(path).then(data => {
      if (!Array.isArray(data)) throw new Error('JSON inválido: ' + path);
      return data;
    }).catch(error => { cache.delete(path); throw error; }));
    return cache.get(path);
  }
  async function liveList(_collectionName, path) {
    if (!path) throw new Error('Leitura remota desativada. Informe o JSON local.');
    return list(_collectionName, path);
  }
  async function record(_collectionName, id, path) {
    const data = await json(path);
    if (Array.isArray(data)) return data.find(item => String(item.id) === String(id)) || null;
    return data?.[id] || (data?.weekKey === id ? data : null);
  }
  window.SPFCData = { firebase, json, list, liveList, record };
})();
