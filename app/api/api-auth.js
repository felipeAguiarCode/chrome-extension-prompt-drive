// =========================
// API Auth - Login, Signup, User Data, Logout
// =========================

async function doLogin(email, password) {
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
    await api._setStorageItem(STORAGE_KEY_ACCESS_TOKEN, data.access_token);
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

async function createUser(email, password, name) {
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
}

async function loadCurrentUserData() {
  const token = await api.getStoredToken();
  if (!token) return null;

  const headers = api._authHeaders(token);

  const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers });
  if (!userRes.ok) {
    if (userRes.status === 401) throw new Error('Token invalido ou expirado');
    throw new Error(await userRes.text());
  }
  const user = await userRes.json();
  if (!user) return null;

  const userName = user.user_metadata?.full_name ?? user.user_metadata?.name ?? user.email ?? 'Sem nome';

  const profileRes = await fetch(
    `${SUPABASE_URL}/rest/v1/profiles?user_id=eq.${encodeURIComponent(user.id)}&limit=1`,
    { headers }
  );
  if (!profileRes.ok) throw new Error(await profileRes.text());
  const profiles = await profileRes.json();
  const profile = Array.isArray(profiles) && profiles.length > 0 ? profiles[0] : null;

  const subRes = await fetch(
    `${SUPABASE_URL}/rest/v1/subscriptions?user_id=eq.${encodeURIComponent(user.id)}&status=in.(active,trialing)&order=current_period_end.desc&limit=1`,
    { headers }
  );
  if (!subRes.ok) throw new Error(await subRes.text());
  const subs = await subRes.json();
  const subscription = Array.isArray(subs) && subs.length > 0 ? subs[0] : null;

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
}

async function logout() {
  const token = await api.getStoredToken();
  if (token) {
    try {
      await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
        method: 'POST',
        headers: api._authHeaders(token)
      });
    } catch (e) {
      console.warn('Logout request failed:', e);
    }
  }
  await api.clearToken();
}

Object.assign(api, { doLogin, createUser, loadCurrentUserData, logout });
