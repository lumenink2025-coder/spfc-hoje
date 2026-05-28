// ============================================
// unified-identity.js
// Sistema Unico de Identidade
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

(function(global) {
  'use strict';

  const UNIFIED_SCHEMA = {
    uid: '',
    email: '',
    displayName: '',
    name: '',
    avatar: '',
    avatarDataUrl: '',
    createdAt: null,
    updatedAt: null,
    lastLoginAt: null,
    isActive: true,
    nicknameLocked: false,
    lives: 3,
    xp: 0,
    level: 1,
    streak: 0,
    totalQuizPlayed: 0,
    totalPontos: 0,
    totalAcertos: 0,
    pontosMes: 0,
    apostas: [],
    migratedFrom: [],
    legacyCollections: []
  };

  class UnifiedIdentity {
    constructor(db) {
      if (!db) throw new Error('UnifiedIdentity: Firestore db obrigatorio');
      this.db = db;
      this.COLLECTION = 'users';
      this.cache = new Map();
      this._listeners = new Map();
    }

    async loginOrCreate(firebaseUser) {
      const uid = firebaseUser.uid;
      const userRef = this.db.collection(this.COLLECTION).doc(uid);
      try {
        const doc = await userRef.get();
        if (doc.exists) {
          const data = doc.data();
          const updates = {
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
          };
          if (data.displayName && !data.name) updates.name = data.displayName;
          if (data.name && !data.displayName) updates.displayName = data.name;
          if (data.avatar && !data.avatarDataUrl) updates.avatarDataUrl = data.avatar;
          if (data.avatarDataUrl && !data.avatar) updates.avatar = data.avatarDataUrl;
          await userRef.update(updates);
          const merged = { ...data, ...updates };
          this.cache.set(uid, merged);
          return { success: true, data: merged, isNew: false };
        } else {
          const newUser = {
            ...UNIFIED_SCHEMA,
            uid: uid,
            email: firebaseUser.email || '',
            displayName: firebaseUser.displayName || '',
            name: firebaseUser.displayName || '',
            avatar: firebaseUser.photoURL || '',
            avatarDataUrl: firebaseUser.photoURL || '',
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
            lastLoginAt: firebase.firestore.FieldValue.serverTimestamp(),
            migratedFrom: []
          };
          await userRef.set(newUser);
          this.cache.set(uid, newUser);
          return { success: true, data: newUser, isNew: true };
        }
      } catch (error) {
        console.error('loginOrCreate erro:', error);
        return { success: false, error: error.message };
      }
    }

    async getUser(uid, options = {}) {
      if (!uid) throw new Error('getUser: uid obrigatorio');
      if (!options.noCache && this.cache.has(uid)) return this.cache.get(uid);
      try {
        const doc = await this.db.collection(this.COLLECTION).doc(uid).get();
        if (doc.exists) {
          const data = doc.data();
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

    async updateUser(uid, updates) {
      if (!uid) throw new Error('updateUser: uid obrigatorio');
      const normalized = { ...updates };
      if (normalized.displayName !== undefined && normalized.name === undefined) normalized.name = normalized.displayName;
      if (normalized.name !== undefined && normalized.displayName === undefined) normalized.displayName = normalized.name;
      if (normalized.avatar !== undefined && normalized.avatarDataUrl === undefined) normalized.avatarDataUrl = normalized.avatar;
      if (normalized.avatarDataUrl !== undefined && normalized.avatar === undefined) normalized.avatar = normalized.avatarDataUrl;
      normalized.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
      try {
        await this.db.collection(this.COLLECTION).doc(uid).update(normalized);
        const current = this.cache.get(uid) || {};
        const merged = { ...current, ...normalized };
        this.cache.set(uid, merged);
        return { success: true, data: merged };
      } catch (error) {
        console.error('updateUser erro:', error);
        return { success: false, error: error.message };
      }
    }

    async migrateFromLegacy(uid) {
      const sources = [
        { collection: 'usuarios', system: 'cadastro' },
        { collection: 'ranking', system: 'palpitometro' },
        { collection: 'users', system: 'quiz' },
        { collection: 'nicknames', system: 'quiz' }
      ];
      let merged = { ...UNIFIED_SCHEMA, uid, migratedFrom: [], legacyCollections: [] };
      let found = false;
      for (const src of sources) {
        try {
          const doc = await this.db.collection(src.collection).doc(uid).get();
          if (doc.exists) {
            found = true;
            const data = doc.data();
            if (!merged.migratedFrom.includes(src.system)) merged.migratedFrom.push(src.system);
            if (!merged.legacyCollections.includes(src.collection)) merged.legacyCollections.push(src.collection);
            merged = this._mapLegacy(merged, data, src.system);
          }
        } catch (e) {}
      }
      if (found) {
        const now = firebase.firestore.FieldValue.serverTimestamp();
        merged.createdAt = now;
        merged.updatedAt = now;
        merged.lastLoginAt = now;
        if (merged.displayName && !merged.name) merged.name = merged.displayName;
        if (merged.name && !merged.displayName) merged.displayName = merged.name;
        await this.db.collection(this.COLLECTION).doc(uid).set(merged);
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
          if (source.avatarDataUrl) r.avatarDataUrl = source.avatarDataUrl;
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
          break;
        case 'palpitometro':
          if (source.displayName) { r.displayName = source.displayName; r.name = source.displayName; }
          if (source.totalPontos !== undefined) r.totalPontos = source.totalPontos;
          if (source.totalAcertos !== undefined) r.totalAcertos = source.totalAcertos;
          if (source.pontosMes !== undefined) r.pontosMes = source.pontosMes;
          break;
      }
      return r;
    }

    async getRanking(opts = {}) {
      const { limit = 50, orderByField = 'totalPontos', descending = true } = opts;
      try {
        const snap = await this.db.collection(this.COLLECTION)
          .where('isActive', '==', true)
          .orderBy(orderByField, descending ? 'desc' : 'asc')
          .limit(limit).get();
        return snap.docs.map((d, i) => ({ rank: i + 1, uid: d.id, ...d.data() }));
      } catch (e) { console.error('getRanking erro:', e); return []; }
    }

    async saveAvatar(uid, nickname, avatarDataUrl) {
      return this.updateUser(uid, { displayName: nickname, name: nickname, avatar: avatarDataUrl, avatarDataUrl });
    }

    async ensureUserDoc(uid, defaults = {}) {
      let user = await this.getUser(uid);
      if (!user) {
        const nu = { ...UNIFIED_SCHEMA, uid, ...defaults,
          createdAt: firebase.firestore.FieldValue.serverTimestamp(),
          updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
          lastLoginAt: firebase.firestore.FieldValue.serverTimestamp() };
        await this.db.collection(this.COLLECTION).doc(uid).set(nu);
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
      if (profile.nicknameLocked !== undefined) u.nicknameLocked = profile.nicknameLocked;
      if (profile.lives !== undefined) u.lives = profile.lives;
      if (profile.email) u.email = profile.email;
      return this.updateUser(uid, u);
    }

    clearCache(uid) { uid ? this.cache.delete(uid) : this.cache.clear(); }

    async getStats() {
      try {
        const snap = await this.db.collection(this.COLLECTION).get();
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
      const unsub = this.db.collection(this.COLLECTION).doc(uid)
        .onSnapshot(d => { if (d.exists) { this.cache.set(uid, d.data()); cb(d.data()); } });
      this._listeners.set(uid, unsub);
      return unsub;
    }

    offUserChange(uid) {
      if (this._listeners.has(uid)) { this._listeners.get(uid)(); this._listeners.delete(uid); }
    }
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { UnifiedIdentity, UNIFIED_SCHEMA };
  global.UnifiedIdentity = UnifiedIdentity;
  global.UNIFIED_SCHEMA = UNIFIED_SCHEMA;

})(typeof window !== 'undefined' ? window : global);
