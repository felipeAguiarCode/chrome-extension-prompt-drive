// =========================
// State Container - Fonte da Verdade
// =========================

const createStateManager = () => {
  let state = {
    user: {
      id: 'user-1',
      name: null,
      plan: 'free',
      licenseKey: null,
      licenseExpiry: null,
      createdAt: Date.now(),
      updatedAt: Date.now()
    },
    ui: {
      loading: false,
      error: null,
      dialogs: {
        folderDialogOpen: false,
        editFolderDialogOpen: false,
        promptDialogOpen: false,
        promptEditDialogOpen: false,
        confirmDeletePromptDialogOpen: false,
        deleteFolderDialogOpen: false,
        licenseDialogOpen: false,
        importDialogOpen: false
      },
      expandedFolders: {},
      currentEditingFolderId: null,
      currentEditingPromptId: null,
      currentDeletingPromptId: null,
      currentDeletingFolderId: null
    },
    data: {
      folders: {},
      prompts: {},
      folderPrompts: {}
    }
  };

  const listeners = [];

  const getState = () => ({ ...state });

  const setState = (update) => {
    if (typeof update === 'function') {
      state = update(state);
    } else {
      state = { ...state, ...update };
    }
    notifyListeners();
  };

  const subscribe = (listener) => {
    listeners.push(listener);
    return () => {
      const index = listeners.indexOf(listener);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  };

  const notifyListeners = () => {
    listeners.forEach(listener => listener(state));
  };

  // Selectors / Derived State
  const getPromptCountTotal = () => {
    return Object.keys(state.data.prompts).length;
  };

  const getPromptsByFolder = (folderId) => {
    const promptIds = state.data.folderPrompts[folderId] || [];
    return promptIds
      .map(id => state.data.prompts[id])
      .filter(Boolean)
      .sort((a, b) => (a.name ?? a.nome).localeCompare(b.name ?? b.nome));
  };

  const getFolderById = (folderId) => {
    return state.data.folders[folderId] || null;
  };

  const getPromptById = (promptId) => {
    return state.data.prompts[promptId] || null;
  };

  const isFreePlan = () => {
    return state.user.plan === 'free';
  };

  const canCreatePrompt = () => {
    if (!isFreePlan()) return true;
    return getPromptCountTotal() < FREE_MAX_PROMPTS;
  };

  return {
    getState,
    setState,
    subscribe,
    getPromptCountTotal,
    getPromptsByFolder,
    getFolderById,
    getPromptById,
    isFreePlan,
    canCreatePrompt
  };
};

const stateManager = createStateManager();
