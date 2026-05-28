// ============================================
// unified-identity.js
// Sistema Unico de Identidade — Firebase v10 Modular
// Unifica: cadastro.html + quiz.html + palpitometro.html + index.html
//
// Substitui colecoes legadas:
//   - usuarios  (cadastro)
//   - ranking   (palpitometro)  
//   - users     (quiz)
//   - nicknames (quiz)
//
// Por uma unica colecao: 'users'
// ============================================

// Requer: Firebase v10+ modular (initializeApp, getFirestore, etc.)
// Usa as mesmas funcoes que seus arquivos ja importam do CDN

class UnifiedIdentity {
  constructor(db) {
    if (!db) throw new Error('UnifiedIdentity: Firestore db instance obrigatorio');
    this.db = db;
    this.COLLECTION = 'users';
    this.cache = new Map();
    this._listeners = new Map();
  }

  // ============================================
  // HELPERS (usam API modular)
  // ============================================
  _doc(path, id) {
    const { doc } = window.FB || {};
    if (!doc) throw new Error('window.FB.doc nao disponivel');
    return doc(this.db, path, id);
  }

  _setDoc(ref, data, opts) {
    const { setDoc } = window.FB || {};
    return setDoc(ref, data, opts);
  }

  _getDoc(ref) {
    const { getDoc } = window.FB || {};
    return getDoc(ref);
  }

  _updateDoc(ref, data) {
    const { updateDoc } = window.FB || {};
    return updateDoc(ref, data);
  }

  _collection(path) {
    const { collection } = window.FB || {};
    return collection(this.db, path);
  }

  _query(...args) {
    const { query } = window.FB || {};
    return query(...args);
  }

  _orderBy(field, dir) {
    const { orderBy } = window.FB || {};
    return orderBy(field, dir);
  }

  _limit(n) {
    const { limit } = window.FB || {};
    return limit(n);
  }

  _where(field, op, val) {
    const { where } = window.FB || {};
    return where(field, op, val);
  }

  _serverTimestamp() {
    const { serverTimestamp } = window.FB || {};
    return serverTimestamp();
  }

  _increment(n) {
    const { increment } = window.FB || {};
    return increment(n);
  }

  _writeBatch() {
    const { writeBatch } = window.FB || {};
    return writeBatch(this.db);
  }

  // ============================================
  // SCHEMA
  // ============================================
  static get SCHEMA() {
    return {
      uid: '', email: '', displayName: '', name: '',
      avatar: '', avatarDataUrl: '',
      createdAt: null, updatedAt: null, lastLoginAt: null, isActive: true,
      nicknameLocked: false, lives: 3,
      xp: 0, level: 1, streak: 0, totalQuizPlayed: 0,
      totalPontos: 0, totalAcertos: 0, pontosMes: 0,
      totalErros: 0, totalPalpites: 0, placareExatos: 0,
      apostas: [],
      migratedFrom: [], legacyCollections: []
    };
  }

  // ============================================
  // 1. LOGIN / CADASTRO
  // ============================================
  async loginOrCreate(firebaseUser) {
    const uid = firebaseUser.uid;
    const userRef = this._doc(this.COLLECTION, uid);
    try {
      const snap = await this._getDoc(userRef);
      if (snap.exists()) {
        const data = snap.data();
        const updates = { lastLoginAt: this._serverTimestamp(), updatedAt: this._serverTimestamp() };
        if (data.displayName && !data.name) updates.name = data.displayName;
        if (data.name && !data.displayName) updates.displayName = data.name;
        if (data.avatar && !data.avatarDataUrl) updates.avatarDataUrl = data.avatar;
        if (data.avatarDataUrl && !data.avatar) updates.avatar = data.avatarDataUrl;
        await this._updateDoc(userRef, updates);
        const merged = { ...data, ...updates };
        this.cache.set(uid, merged);
        return { success: true, data: merged, isNew: false };
      } else {
        const newUser = {
          ...UnifiedIdentity.SCHEMA,
          uid, email: firebaseUser.email || '',
          displayName: firebaseUser.displayName || '',
          name: firebaseUser.displayName || '',
          avatar: firebaseUser.photoURL || '',
          avatarDataUrl: firebaseUser.photoURL || '',
          createdAt: this._serverTimestamp(),
          updatedAt: this._serverTimestamp(),
          lastLoginAt: this._serverTimestamp(),
          migratedFrom: []
        };
        await this._setDoc(userRef, newUser);
        this.cache.set(uid, newUser);
        return { success: true, data: newUser, isNew: true };
      }
    } catch (error) {
      console.error('loginOrCreate erro:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 2. GET USER
  // ============================================
  async getUser(uid, opts = {}) {
    if (!uid) throw new Error('getUser: uid obrigatorio');
    if (!opts.noCache && this.cache.has(uid)) return this.cache.get(uid);
    try {
      const snap = await this._getDoc(this._doc(this.COLLECTION, uid));
      if (snap.exists()) {
        const data = snap.data();
        this.cache.set(uid, data);
        return data;
      }
      const migrated = await this.migrateFromLegacy(uid);
      return migrated || null;
    } catch (error) {
      console.error('getUser erro:', error);
      throw error;
    }
  }

  // ============================================
  // 3. UPDATE USER
  // ============================================
  async updateUser(uid, updates) {
    if (!uid) throw new Error('updateUser: uid obrigatorio');
    const normalized = { ...updates };
    if (normalized.displayName !== undefined && normalized.name === undefined) normalized.name = normalized.displayName;
    if (normalized.name !== undefined && normalized.displayName === undefined) normalized.displayName = normalized.name;
    if (normalized.avatar !== undefined && normalized.avatarDataUrl === undefined) normalized.avatarDataUrl = normalized.avatar;
    if (normalized.avatarDataUrl !== undefined && normalized.avatar === undefined) normalized.avatar = normalized.avatarDataUrl;
    normalized.updatedAt = this._serverTimestamp();
    try {
      await this._updateDoc(this._doc(this.COLLECTION, uid), normalized);
      const current = this.cache.get(uid) || {};
      const merged = { ...current, ...normalized };
      this.cache.set(uid, merged);
      return { success: true, data: merged };
    } catch (error) {
      console.error('updateUser erro:', error);
      return { success: false, error: error.message };
    }
  }

  // ============================================
  // 4. MIGRACAO DE DADOS LEGADOS
  // ============================================
  async migrateFromLegacy(uid) {
    const sources = [
      { collection: 'usuarios', system: 'cadastro' },
      { collection: 'ranking', system: 'palpitometro' },
      { collection: 'users', system: 'quiz' },
      { collection: 'nicknames', system: 'quiz' }
    ];
    let merged = { ...UnifiedIdentity.SCHEMA, uid, migratedFrom: [], legacyCollections: [] };
    let found = false;
    for (const src of sources) {
      try {
        const snap = await this._getDoc(this._doc(src.collection, uid));
        if (snap.exists()) {
          found = true;
          const data = snap.data();
          if (!merged.migratedFrom.includes(src.system)) merged.migratedFrom.push(src.system);
          if (!merged.legacyCollections.includes(src.collection)) merged.legacyCollections.push(src.collection);
          merged = this._mapLegacy(merged, data, src.system);
        }
      } catch (e) {}
    }
    if (found) {
      const now = this._serverTimestamp();
      merged.createdAt = now; merged.updatedAt = now; merged.lastLoginAt = now;
      if (merged.displayName && !merged.name) merged.name = merged.displayName;
      if (merged.name && !merged.displayName) merged.displayName = merged.name;
      await this._setDoc(this._doc(this.COLLECTION, uid), merged);
      this.cache.set(uid, merged);
      console.log('Migrado:', uid, merged.migratedFrom);
      return merged;
    }
    return null;
  }

  _mapLegacy(target, source, system) {
    const r = { ...target };
    switch (system) {
      case 'cadastro':
        if (source.displayName) { r.displayName = source.displayName; r.name = source.displayName; }
        if (source.avatar) r.avatar = source.avatar;
        if (source.avatarUrl) { r.avatar = source.avatarUrl; r.avatarDataUrl = source.avatarUrl; }
        if (source.nicknameLocked !== undefined) r.nicknameLocked = source.nicknameLocked;
        if (source.lives !== undefined) r.lives = source.lives;
        if (source.email) r.email = source.email;
        break;
      case 'quiz':
        if (source.name) { r.name = source.name; r.displayName = source.name; }
        if (source.avatar && typeof source.avatar === 'object' && source.avatar.dataUrl) {
          r.avatar = source.avatar.dataUrl; r.avatarDataUrl = source.avatar.dataUrl;
        }
        if (source.avatar && typeof source.avatar === 'string') {
          r.avatar = source.avatar; r.avatarDataUrl = source.avatar;
        }
        if (source.xp !== undefined) r.xp = source.xp;
        if (source.level !== undefined) r.level = source.level;
        if (source.streak !== undefined) r.streak = source.streak;
        if (source.totalScore !== undefined) r.totalPontos = source.totalScore;
        if (source.bestStreak !== undefined) r.bestStreak = source.bestStreak;
        break;
      case 'palpitometro':
        if (source.displayName) { r.displayName = source.displayName; r.name = source.displayName; }
        if (source.totalPontos !== undefined) r.totalPontos = source.totalPontos;
        if (source.totalAcertos !== undefined) r.totalAcertos = source.totalAcertos;
        if (source.totalErros !== undefined) r.totalErros = source.totalErros;
        if (source.totalPalpites !== undefined) r.totalPalpites = source.totalPalpites;
        if (source.placareExatos !== undefined) r.placareExatos = source.placareExatos;
        if (source.pontosMes !== undefined) r.pontosMes = source.pontosMes;
        break;
    }
    return r;
  }

  // ============================================
  // 5. RANKING
  // ============================================
  async getRanking(opts = {}) {
    const { limit: lim = 50, orderByField = 'totalPontos', descending = true } = opts;
    try {
      const q = this._query(
        this._collection(this.COLLECTION),
        this._where('isActive', '==', true),
        this._orderBy(orderByField, descending ? 'desc' : 'asc'),
        this._limit(lim)
      );
      const snap = await this._getDocs(q);
      return snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }));
    } catch (e) { console.error('getRanking erro:', e); return []; }
  }

  async _getDocs(q) {
    const { getDocs } = window.FB || {};
    return getDocs(q);
  }

  // ============================================
  // 6. WRAPPERS DE COMPATIBILIDADE
  // ============================================
  async saveAvatar(uid, nickname, avatarDataUrl) {
    return this.updateUser(uid, { displayName: nickname, name: nickname, avatar: avatarDataUrl, avatarDataUrl });
  }

  async ensureUserDoc(uid, defaults = {}) {
    let user = await this.getUser(uid);
    if (!user) {
      const nu = { ...UnifiedIdentity.SCHEMA, uid, ...defaults,
        createdAt: this._serverTimestamp(),
        updatedAt: this._serverTimestamp(),
        lastLoginAt: this._serverTimestamp() };
      await this._setDoc(this._doc(this.COLLECTION, uid), nu);
      this.cache.set(uid, nu);
      user = nu;
    }
    return user;
  }

  async saveProfile(uid, profile) {
    const u = {};
    if (profile.displayName || profile.name) {
      u.displayName = profile.displayName || profile.name;
      u.name = profile.name || profile.displayName;
    }
    if (profile.avatar || profile.avatarDataUrl) {
      u.avatar = profile.avatar || profile.avatarDataUrl;
      u.avatarDataUrl = profile.avatarDataUrl || profile.avatar;
    }
    if (profile.avatarUrl) { u.avatar = profile.avatarUrl; u.avatarDataUrl = profile.avatarUrl; }
    if (profile.nicknameLocked !== undefined) u.nicknameLocked = profile.nicknameLocked;
    if (profile.lives !== undefined) u.lives = profile.lives;
    if (profile.email) u.email = profile.email;
    return this.updateUser(uid, u);
  }

  // ============================================
  // 7. UTILITARIOS
  // ============================================
  clearCache(uid) { uid ? this.cache.delete(uid) : this.cache.clear(); }

  async getStats() {
    try {
      const snap = await this._getDocs(this._query(this._collection(this.COLLECTION)));
      const users = snap.docs.map(d => d.data());
      return {
        totalUsers: users.length,
        migratedUsers: users.filter(u => u.migratedFrom?.length > 0).length,
        newUsers: users.filter(u => !u.migratedFrom?.length).length,
        avgPontos: users.reduce((s, u) => s + (u.totalPontos || 0), 0) / (users.length || 1),
        avgXp: users.reduce((s, u) => s + (u.xp || 0), 0) / (users.length || 1)
      };
    } catch (e) { return { error: e.message }; }
  }

  onUserChange(uid, cb) {
    if (this._listeners.has(uid)) this._listeners.get(uid)();
    const { onSnapshot } = window.FB || {};
    const unsub = onSnapshot(this._doc(this.COLLECTION, uid), d => {
      if (d.exists()) { this.cache.set(uid, d.data()); cb(d.data()); }
    });
    this._listeners.set(uid, unsub);
    return unsub;
  }

  offUserChange(uid) {
    if (this._listeners.has(uid)) { this._listeners.get(uid)(); this._listeners.delete(uid); }
  }
}

// Exporta globalmente
window.UnifiedIdentity = UnifiedIdentity;
