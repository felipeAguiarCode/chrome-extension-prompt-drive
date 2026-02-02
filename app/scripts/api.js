// =========================
// API - Backend Integration
// =========================

// Helper para verificar se está no contexto de extensão Chrome
function isExtensionContext() {
  return typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local;
}

const api = {
  // =========================
  // Storage Helpers (Chrome Extension / Browser Fallback)
  // =========================

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

  // =========================
  // Auth Methods
  // =========================

  async doLogin(email, password) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || error.message || 'Login falhou');
      }

      const data = await response.json();
      // Salvar token no storage (Chrome Extension ou localStorage)
      await this._setStorageItem(STORAGE_KEY_ACCESS_TOKEN, data.access_token);
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  async createUser(email, password, name) {
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/signup`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          password,
          data: { full_name: name }
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error_description || error.message || 'Signup falhou');
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
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

  async loadCurrentUserData() {
    const token = await this.getStoredToken();
    if (!token) return null;

    const headers = this._authHeaders(token);

    // 1) Usuario autenticado - GET /auth/v1/user
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
    if (!userRes.ok) {
      if (userRes.status === 401) throw new Error('Token invalido ou expirado');
      throw new Error(await userRes.text());
    }
    const user = await userRes.json();
    if (!user) return null;

    const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Sem nome';

    // 2) Profile - GET /rest/v1/profiles
    const profileRes = await fetch(
      `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
      { headers }
    );
    if (!profileRes.ok) throw new Error(await profileRes.text());
    const profiles = await profileRes.json();
    const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;

    // 3) Subscription - GET /rest/v1/subscriptions
    const subRes = await fetch(
      `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&status=in.(active,trialing)&order=current_period_end.desc&limit=1`,
      { headers }
    );
    if (!subRes.ok) throw new Error(await subRes.text());
    const subs = await subRes.json();
    const subscription = Array.isArray(subs) && subs.length > 0 ? subs[0] : null;

    // 4) Folders + Prompts - GET /rest/v1/folders com embed de prompts
    const foldersRes = await fetch(
      `${SUPABASE_URL}/rest/v1/folders?user_id=eq.${encodeURIComponent(user.id)}&select=id,name,created_at,updated_at,prompts(id,name,content,created_at,updated_at)&order=created_at.asc`,
      { headers }
    );
    if (!foldersRes.ok) throw new Error(await foldersRes.text());
    const folders = await foldersRes.json();

    return {
      user: { id: user.id, name: userName },
      profile: { stripe_customer_id: profile?.stripe_customer_id ?? null, plan: profile?.plan ?? 'free' },
      subscription: subscription ? {
        id: subscription.id,
        status: subscription.status,
        period_start: subscription.current_period_start,
        period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end
      } : null,
      folders: (folders ?? []).map(f => ({ ...f, prompts: f.prompts ?? [] }))
    };
  },

  async logout() {
    const token = await this.getStoredToken();
    if (token) {
      try {
        await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
          method: 'POST',
          headers: this._authHeaders(token)
        });
      } catch (e) {
        console.warn('Logout request failed:', e);
      }
    }
    await this.clearToken();
  },

  async getStoredToken() {
    return await this._getStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  },

  async clearToken() {
    await this._removeStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  },

  // =========================
  // Folder Methods
  // =========================

  async createFolder(payload) {
    const token = await this._ensureToken();
    if (!token) return { success: false, code: 401 };

    const headers = {
      ...this._authHeaders(token),
      'Prefer': 'return=representation'
    };

    const response = await fetch(`${SUPABASE_URL}/rest/v1/folders`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        user_id: payload.userId,
        name: payload.name
      })
    });

    if (response.status === 401 || response.status === 403) {
      if (typeof this._onUnauthorized === 'function') {
        this._onUnauthorized();
      }
      return { success: false, code: response.status };
    }

    if (response.status === 409) {
      return { success: false, code: 409, error: 'Pasta com mesmo nome já existe' };
    }

    if (!response.ok) {
      return { success: false, code: response.status, error: await response.text() };
    }

    const data = await response.json();
    const folder = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return { success: true, folder };
  },

  async updateFolder(payload) {
    const token = await this._ensureToken();
    if (!token) return { success: false, code: 401 };

    const headers = {
      ...this._authHeaders(token),
      'Prefer': 'return=representation'
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/folders?id=eq.${encodeURIComponent(payload.folderId)}`,
      {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ name: payload.name })
      }
    );

    if (response.status === 401 || response.status === 403) {
      if (typeof this._onUnauthorized === 'function') {
        this._onUnauthorized();
      }
      return { success: false, code: response.status };
    }

    if (response.status === 409) {
      return { success: false, code: 409 };
    }

    if (!response.ok) {
      return { success: false, code: response.status };
    }

    const data = await response.json();
    const folder = Array.isArray(data) && data.length > 0 ? data[0] : null;
    return { success: true, folder };
  },

  async deleteFolder(payload) {
    const token = await this._ensureToken();
    if (!token) return { success: false, code: 401 };

    const headers = {
      ...this._authHeaders(token),
      'Prefer': 'return=representation'
    };

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/folders?id=eq.${encodeURIComponent(payload.folderId)}`,
      {
        method: 'DELETE',
        headers
      }
    );

    if (response.status === 401 || response.status === 403) {
      if (typeof this._onUnauthorized === 'function') {
        this._onUnauthorized();
      }
      return { success: false, code: response.status };
    }

    return { success: true };
  },

  // =========================
  // Prompt Methods
  // =========================

  createPrompt: (payload) => {
    console.log('[API] createPrompt', payload);
    // Future: fetch POST /api/prompts
  },

  updatePrompt: (payload) => {
    console.log('[API] updatePrompt', payload);
    // Future: fetch PUT /api/prompts/:promptId
  },

  deletePrompt: (payload) => {
    console.log('[API] deletePrompt', payload);
    // Future: fetch DELETE /api/prompts/:promptId
  },

  // =========================
  // License Methods
  // =========================

  activateLicenseKey: (payload) => {
    console.log('[API] activateLicenseKey', payload);
    // Future: fetch POST /api/licenses/activate
  }
};
