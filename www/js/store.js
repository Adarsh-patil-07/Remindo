/* ============================================
   REMINDO — Data Store
   100% Firebase Native Implementation
   Uses Firestore Offline Persistence caching
   ============================================ */

class Store {
    constructor() {
        this.userId = null;
    }

    setUser(userId) {
        this.userId = userId;
    }

    _userCollection(section) {
        if (!this.userId) throw new Error("User not authenticated.");
        return firebaseDB.collection('users').doc(this.userId).collection(section);
    }

    /* ===== UNIFIED API ===== */

    async getAll(section) {
        if (!this.userId) return [];
        try {
            // Force fetch from local cache for instant 0ms latency UI rendering
            let snapshot;
            try {
                snapshot = await this._userCollection(section).orderBy('createdAt', 'desc').get({ source: 'cache' });
                // Silently sync from server in background to keep cache fresh
                this._userCollection(section).orderBy('createdAt', 'desc').get({ source: 'server' }).catch(() => {});
            } catch (cacheErr) {
                // Cache miss (first load), fetch from server
                snapshot = await this._userCollection(section).orderBy('createdAt', 'desc').get({ source: 'server' });
            }
            return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        } catch (e) {
            console.error(`Firebase getAll(${section}) failed:`, e);
            return [];
        }
    }

    async getCount(section) {
        if (!this.userId) return 0;
        const items = await this.getAll(section);
        return Array.isArray(items) ? items.length : 0;
    }

    async clearAll() {
        if (!this.userId) return;
        const sections = ['birthdays', 'bills', 'student', 'jobs', 'medicines', 'wishlist', 'reminders'];
        try {
            for (const section of sections) {
                const snapshot = await this._userCollection(section).get();
                const batch = firebaseDB.batch();
                snapshot.docs.forEach(doc => {
                    batch.delete(doc.ref);
                });
                await batch.commit();
            }
            // also delete sizes
            await firebaseDB.collection('users').doc(this.userId).collection('sizes').doc('personal').delete().catch(() => {});
        } catch (e) {
            console.error('Firebase clearAll failed:', e);
        }
    }

    async add(section, item) {
        if (!this.userId) throw new Error("User not authenticated.");
        item.id = item.id || Utils.generateId();
        item.createdAt = item.createdAt || new Date().toISOString();

        try {
            await this._userCollection(section).doc(item.id).set(item);
        } catch (e) {
            console.error('Firebase add failed:', e);
            throw e;
        }
        return item;
    }

    async update(section, id, updates) {
        if (!this.userId) throw new Error("User not authenticated.");
        updates.updatedAt = new Date().toISOString();

        try {
            await this._userCollection(section).doc(id).update(updates);
            return updates;
        } catch (e) {
            console.error('Firebase update failed:', e);
            throw e;
        }
    }

    async delete(section, id) {
        if (!this.userId) return;
        try {
            await this._userCollection(section).doc(id).delete();
        } catch (e) {
            console.error('Firebase delete failed:', e);
            throw e;
        }
    }

    async get(section, id) {
        if (!this.userId) return null;
        try {
            const doc = await this._userCollection(section).doc(id).get();
            return doc.exists ? { id: doc.id, ...doc.data() } : null;
        } catch (e) {
            console.error('Firebase get failed:', e);
            return null;
        }
    }

    /* ===== SIZES (Special: single object, not array) ===== */

    async getSizes() {
        if (!this.userId) return {};
        try {
            let doc;
            try {
                doc = await this._userCollection('sizes').doc('personal').get({ source: 'cache' });
                this._userCollection('sizes').doc('personal').get({ source: 'server' }).catch(() => {});
            } catch (cacheErr) {
                doc = await this._userCollection('sizes').doc('personal').get({ source: 'server' });
            }
            return doc.exists ? doc.data() : {};
        } catch (e) {
            console.error('Firebase getSizes failed:', e);
            return {};
        }
    }

    async saveSizes(sizes) {
        if (!this.userId) throw new Error("User not authenticated.");
        sizes.updatedAt = new Date().toISOString();
        try {
            await this._userCollection('sizes').doc('personal').set(sizes, { merge: true });
        } catch (e) {
            console.error('Firebase saveSizes failed:', e);
            throw e;
        }
    }

    /* ===== EXPORT / IMPORT (for data backup) ===== */

    async exportAll() {
        const sections = ['birthdays', 'bills', 'student', 'jobs', 'medicines', 'wishlist', 'reminders'];
        const data = {};
        for (const s of sections) {
            data[s] = await this.getAll(s);
        }
        data.sizes = await this.getSizes();
        return data;
    }

    async importAll(data) {
        if (!this.userId) throw new Error("User not authenticated.");
        const sections = ['birthdays', 'bills', 'student', 'jobs', 'medicines', 'wishlist', 'reminders'];
        for (const s of sections) {
            if (data[s] && Array.isArray(data[s])) {
                for (const item of data[s]) {
                    await this._userCollection(s).doc(item.id).set(item);
                }
            }
        }
        if (data.sizes) {
            await this.saveSizes(data.sizes);
        }
    }
}

// Global store instance
const store = new Store();
