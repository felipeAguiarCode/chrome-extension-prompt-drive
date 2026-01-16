// =========================
// API - Backend Integration (Stub)
// =========================

const api = {
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

  activateLicenseKey: (payload) => {
    console.log('[API] activateLicenseKey', payload);
    // Future: fetch POST /api/licenses/activate
  }
};
