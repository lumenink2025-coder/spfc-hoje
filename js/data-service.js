/* Public content and identity share one Firebase app; bundled JSON is the offline fallback. */
(() => {
  const config = {
    apiKey: 'AIzaSyAsjpwQwio7Y2SREpnrJf0DSb9fySkhlSY',
    authDomain: 'spfc-hoje-da329.firebaseapp.com', projectId: 'spfc-hoje-da329',
    storageBucket: 'spfc-hoje-da329.firebasestorage.app', messagingSenderId: '116174859005',
    appId: '1:116174859005:web:b1e54b040aef23c9c16c94'
  };
  let connection;
  function deadline(promise, ms = 6000) {
    let timer;
    return Promise.race([promise, new Promise((_, reject) => {
      timer = setTimeout(() => reject(new Error('Tempo de conexão esgotado')), ms);
    })]).finally(() => clearTimeout(timer));
  }
  async function firebase() {
    if (!connection) connection = Promise.all([
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js'),
      import('https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js')
    ]).then(([appSDK, dbSDK, authSDK]) => {
      const app = appSDK.getApps().find(a => a.name === '[DEFAULT]') || appSDK.initializeApp(config);
      return { ...dbSDK, ...authSDK, db: dbSDK.getFirestore(app), auth: authSDK.getAuth(app) };
    }).catch(error => { connection = null; throw error; });
    return deadline(connection);
  }
  async function json(path) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    try {
      const response = await fetch(new URL(path, document.baseURI), { cache: 'no-cache', signal: controller.signal });
      if (!response.ok) throw new Error('Conteúdo indisponível');
      return await response.json();
    } finally { clearTimeout(timer); }
  }
  async function liveList(name) {
    const fb = await firebase();
    const snapshot = await deadline(fb.getDocsFromServer(fb.collection(fb.db, name)));
    return snapshot.docs.map(d => ({ ...d.data(), id: d.id }));
  }
  async function list(name, fallback) {
    try { return await liveList(name); }
    catch { const data = await json(fallback); if (!Array.isArray(data)) throw new Error('Dados inválidos'); return data; }
  }
  async function record(name, id, fallback) {
    try {
      const fb = await firebase();
      const snapshot = await deadline(fb.getDocFromServer(fb.doc(fb.db, name, id)));
      return snapshot.exists() ? snapshot.data() : null;
    } catch {
      const data = await json(fallback);
      return data?.[id] || (data?.weekKey === id ? data : null);
    }
  }
  window.SPFCData = { firebase, json, list, liveList, record, deadline };
})();
