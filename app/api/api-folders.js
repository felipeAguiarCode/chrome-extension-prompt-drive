// =========================
// API Folders - Create, Update, Delete
// =========================

async function createFolder(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
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
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
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
}

async function updateFolder(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
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
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
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
}

async function deleteFolder(payload) {
  const token = await api._ensureToken();
  if (!token) return { success: false, code: 401 };

  const headers = {
    ...api._authHeaders(token),
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
    if (typeof api._onUnauthorized === 'function') {
      api._onUnauthorized();
    }
    return { success: false, code: response.status };
  }

  return { success: true };
}

Object.assign(api, { createFolder, updateFolder, deleteFolder });
