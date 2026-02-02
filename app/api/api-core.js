// =========================
// API Core - Storage, Token, Headers
// =========================

function isExtensionContext() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

const api = {
  async _setStorageItem(key, value) {
    if (isExtensionContext()) {
      await chrome.storage.local.set({ [key]: value });
    } else {
      localStorage.setItem(key, value);
    }
  },

  async _getStorageItem(key) {
    if (isExtensionContext()) {
      const result = await chrome.storage.local.get(key);
      return result[key] || null;
    } else {
      return localStorage.getItem(key) || null;
    }
  },

  async _removeStorageItem(key) {
    if (isExtensionContext()) {
      await chrome.storage.local.remove(key);
    } else {
      localStorage.removeItem(key);
    }
  },

  _authHeaders(token) {
    return {
      'apikey': SUPABASE_ANON_KEY,
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  },

  _onUnauthorized: null,
  setOnUnauthorized(fn) {
    this._onUnauthorized = fn;
  },

  async _ensureToken() {
    const token = await this.getStoredToken();
    if (!token) {
      if (typeof this._onUnauthorized === 'function') {
        this._onUnauthorized();
      }
      return null;
    }
    return token;
  },

  async getStoredToken() {
    return await this._getStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  },

  async clearToken() {
    await this._removeStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  }
};
