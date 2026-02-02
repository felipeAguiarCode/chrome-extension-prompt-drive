// =========================
// API Prompts - Create, Update, Delete
// =========================

async function createPrompt(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
    'Prefer': 'return=representation'
  };

  const response = await fetch(`${SUPABASE_URL}/rest/v1/prompts`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      user_id: payload.userId,
      folder_id: payload.folderId,
      name: payload.name,
      content: payload.content
    })
  });

  if (response.status === 401 || response.status === 403) {
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
    }
    return { success: false, code: response.status };
  }

  if (response.status === 409) {
    return { success: false, code: 409, error: 'Nome duplicado no mesmo folder' };
  }

  if (response.status === 400 || response.status === 500) {
    const bodyText = await response.text();
    let errorMessage = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.message) errorMessage = parsed.message;
    } catch (_) {}
    return { success: false, code: response.status, error: errorMessage };
  }

  if (!response.ok) {
    return { success: false, code: response.status, error: await response.text() };
  }

  const data = await response.json();
  const prompt = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return { success: true, prompt };
}

async function updatePrompt(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
    'Prefer': 'return=representation'
  };

  const body = { name: payload.name, content: payload.content };
  if (payload.folderId != null) {
    body.folder_id = payload.folderId;
  }

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/prompts?id=eq.${encodeURIComponent(payload.promptId)}`,
    {
      method: 'PATCH',
      headers,
      body: JSON.stringify(body)
    }
  );

  if (response.status === 401 || response.status === 403) {
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
    }
    return { success: false, code: response.status };
  }

  if (response.status === 409) {
    return { success: false, code: 409 };
  }

  if (response.status === 400 || response.status === 500) {
    const bodyText = await response.text();
    let errorMessage = bodyText;
    try {
      const parsed = JSON.parse(bodyText);
      if (parsed.message) errorMessage = parsed.message;
    } catch (_) {}
    return { success: false, code: response.status, error: errorMessage };
  }

  if (!response.ok) {
    return { success: false, code: response.status };
  }

  const data = await response.json();
  const prompt = Array.isArray(data) && data.length > 0 ? data[0] : null;
  return { success: true, prompt };
}

async function deletePrompt(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
    'Prefer': 'return=representation'
  };

  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/prompts?id=eq.${encodeURIComponent(payload.promptId)}`,
    {
      method: 'DELETE',
      headers
    }
  );

  if (response.status === 401 || response.status === 403) {
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
    }
    return { success: false, code: response.status };
  }

  return { success: true };
}

Object.assign(api, { createPrompt, updatePrompt, deletePrompt });
