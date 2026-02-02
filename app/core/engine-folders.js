// =========================
// Engine Folders - Create, Update, Delete, Export, Import
// =========================

async function handleCreateFolder(folderName) {
  const validation = validateName(folderName);
  if (!validation.valid) {
    engine.showToast(TOAST_MESSAGES.folderError);
    return { success: false, error: validation.error };
  }

  const state = stateManager.getState();
  const result = await api.createFolder({
    userId: state.user.id,
    name: folderName.trim()
  });

  if (!result.success) {
    if (result.code === 409) {
      engine.showToast(TOAST_MESSAGES.folderDuplicateName);
    }
    return { success: false };
  }

  const folder = result.folder;
  if (!folder) {
    engine.showToast(TOAST_MESSAGES.folderError);
    return { success: false };
  }

  stateManager.setState({
    data: {
      ...state.data,
      folders: { ...state.data.folders, [folder.id]: { id: folder.id, name: folder.name, created_at: folder.created_at, updated_at: folder.updated_at } },
      folderPrompts: { ...state.data.folderPrompts, [folder.id]: [] }
    }
  });

  engine.showToast(TOAST_MESSAGES.folderCreated);
  engine.closeDialog('folderDialog');
  return { success: true };
}

async function handleUpdateFolder(folderId, newName) {
  const validation = validateName(newName);
  if (!validation.valid) {
    engine.showToast(TOAST_MESSAGES.folderError);
    return { success: false, error: validation.error };
  }

  const state = stateManager.getState();
  const folder = state.data.folders[folderId];
  if (!folder) {
    engine.showToast(TOAST_MESSAGES.folderError);
    return { success: false, error: 'Pasta não encontrada' };
  }

  const result = await api.updateFolder({
    folderId,
    name: newName.trim()
  });

  if (!result.success) {
    if (result.code === 409) {
      engine.showToast(TOAST_MESSAGES.folderDuplicateName);
    }
    return { success: false };
  }

  const updatedFolder = result.folder;
  if (updatedFolder) {
    stateManager.setState({
      data: {
        ...state.data,
        folders: { ...state.data.folders, [folderId]: { id: updatedFolder.id, name: updatedFolder.name, created_at: updatedFolder.created_at, updated_at: updatedFolder.updated_at } }
      }
    });
  }

  engine.showToast(TOAST_MESSAGES.folderUpdated);
  engine.closeDialog('editFolderDialog');
  return { success: true };
}

async function handleDeleteFolder(folderId, confirmName) {
  const state = stateManager.getState();
  const folder = state.data.folders[folderId];
  if (!folder) {
    engine.showToast(TOAST_MESSAGES.folderDeleteError);
    return { success: false, error: 'Pasta não encontrada' };
  }

  if (confirmName !== folder.name) {
    engine.showToast(TOAST_MESSAGES.folderNameMismatch);
    return { success: false, error: TOAST_MESSAGES.folderNameMismatch };
  }

  const result = await api.deleteFolder({ folderId });

  if (!result.success) {
    return { success: false };
  }

  const newFolders = { ...state.data.folders };
  delete newFolders[folderId];

  const newPrompts = { ...state.data.prompts };
  const promptIds = state.data.folderPrompts[folderId] || [];
  promptIds.forEach(promptId => {
    delete newPrompts[promptId];
  });

  const newFolderPrompts = { ...state.data.folderPrompts };
  delete newFolderPrompts[folderId];

  stateManager.setState({
    data: {
      folders: newFolders,
      prompts: newPrompts,
      folderPrompts: newFolderPrompts
    }
  });

  engine.showToast(TOAST_MESSAGES.folderDeleted);
  engine.closeDialog('deleteFolderDialog');
  return { success: true };
}

function handleExportFolder(folderId) {
  if (stateManager.isFreePlan()) {
    engine.showToast(TOAST_MESSAGES.premiumFeature);
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
    }
    return { success: false };
  }

  const state = stateManager.getState();
  const folder = state.data.folders[folderId];
  if (!folder) {
    engine.showToast(TOAST_MESSAGES.exportError);
    return { success: false };
  }

  const prompts = stateManager.getPromptsByFolder(folderId);
  const exportData = {
    folder: {
      id: folder.id,
      name: folder.name,
      created_at: folder.created_at,
      updated_at: folder.updated_at
    },
    prompts: prompts.map(p => ({
      id: p.id,
      folderId: p.folderId,
      name: p.name ?? p.nome,
      content: p.content ?? p.conteudo,
      created_at: p.created_at,
      updated_at: p.updated_at
    }))
  };

  const filename = `${folder.name.replace(/[^a-z0-9]/gi, '_')}_${Date.now()}.json`;
  const result = downloadJSON(exportData, filename);

  if (result.success) {
    engine.showToast(TOAST_MESSAGES.exportSuccess);
  } else {
    engine.showToast(TOAST_MESSAGES.exportError);
  }

  return result;
}

function handleImportFolder(jsonText) {
  if (stateManager.isFreePlan()) {
    engine.showToast(TOAST_MESSAGES.premiumFeature);
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
    }
    return { success: false };
  }

  try {
    const importData = parseJSON(jsonText);

    if (!importData.folder || !importData.prompts || !Array.isArray(importData.prompts)) {
      throw new Error('Formato inválido: esperado { folder: {...}, prompts: [...] }');
    }

    const state = stateManager.getState();
    const existingFolderIds = new Set(Object.keys(state.data.folders));
    const existingPromptIds = new Set(Object.keys(state.data.prompts));
    const existingFolderNames = Object.values(state.data.folders).map(f => f.name);
    const existingPromptNames = Object.values(state.data.prompts).map(p => p.name ?? p.nome);

    let newFolderId = importData.folder.id;
    if (existingFolderIds.has(newFolderId)) {
      newFolderId = generateUUID();
    }

    let newFolderName = generateUniqueName(importData.folder.name, existingFolderNames);

    const newFolder = {
      id: newFolderId,
      name: newFolderName,
      created_at: importData.folder.created_at ?? importData.folder.createdAt ?? new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const newPrompts = { ...state.data.prompts };
    const newFolderPrompts = { ...state.data.folderPrompts };
    newFolderPrompts[newFolderId] = [];

    importData.prompts.forEach(prompt => {
      let newPromptId = prompt.id;
      if (existingPromptIds.has(newPromptId)) {
        newPromptId = generateUUID();
      }

      const promptName = prompt.name ?? prompt.nome;
      let newPromptName = generateUniqueName(promptName, existingPromptNames);
      existingPromptNames.push(newPromptName);

      const newPrompt = {
        id: newPromptId,
        folderId: newFolderId,
        name: newPromptName,
        content: prompt.content ?? prompt.conteudo,
        created_at: prompt.created_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      newPrompts[newPromptId] = newPrompt;
      newFolderPrompts[newFolderId].push(newPromptId);
    });

    stateManager.setState({
      data: {
        ...state.data,
        folders: { ...state.data.folders, [newFolderId]: newFolder },
        prompts: newPrompts,
        folderPrompts: newFolderPrompts
      }
    });

    engine.showToast(TOAST_MESSAGES.importSuccess);
    engine.closeDialog('importDialog');
    return { success: true };
  } catch (error) {
    console.error('Import error:', error);
    engine.showToast(TOAST_MESSAGES.importError);
    return { success: false, error: error.message };
  }
}

Object.assign(engine, {
  handleCreateFolder,
  handleUpdateFolder,
  handleDeleteFolder,
  handleExportFolder,
  handleImportFolder
});
