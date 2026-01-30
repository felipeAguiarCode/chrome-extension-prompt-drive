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

  async loadCurrentUserData() {
    const supabase = window.supabaseClient;

    // 1) Usuario autenticado
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr) throw userErr;
    if (!user) return null;

    const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Sem nome';

    // 2) Profile
    const { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('user_id, stripe_customer_id, plan')
      .eq('user_id', user.id)
      .single();

    // Ignorar erro PGRST116 (registro nao encontrado)
    if (profileErr && profileErr.code !== 'PGRST116') throw profileErr;

    // 3) Subscription
    const { data: subscription, error: subErr } = await supabase
      .from('subscriptions')
      .select('id, status, current_period_start, current_period_end, cancel_at_period_end')
      .eq('user_id', user.id)
      .in('status', ['active', 'trialing'])
      .order('current_period_end', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr) throw subErr;

    // 4) Folders + Prompts
    const { data: folders, error: foldersErr } = await supabase
      .from('folders')
      .select('id, name, created_at, updated_at, prompts(id, name, content, created_at, updated_at)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });

    if (foldersErr) throw foldersErr;

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

  async getStoredToken() {
    return await this._getStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  },

  async clearToken() {
    await this._removeStorageItem(STORAGE_KEY_ACCESS_TOKEN);
  },

  // =========================
  // Folder Methods
  // =========================

  createFolder: (payload) => {
    console.log('[API] createFolder', payload);
    // Future: fetch POST /api/folders
  },

  updateFolder: (payload) => {
    console.log('[API] updateFolder', payload);
    // Future: fetch PUT /api/folders/:folderId
  },

  deleteFolder: (payload) => {
    console.log('[API] deleteFolder', payload);
    // Future: fetch DELETE /api/folders/:folderId
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
