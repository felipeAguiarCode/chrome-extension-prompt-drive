// =========================
// API License - Activate License Key
// =========================

async function activateLicenseKey(payload) {
  // Future: fetch POST /api/licenses/activate
  // Until backend exists, no key is valid
  return { success: false };
}

Object.assign(api, { activateLicenseKey });
