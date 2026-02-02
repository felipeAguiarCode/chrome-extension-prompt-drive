// =========================
// Engine Prompts - Create, Update, Delete, Copy
// =========================

async function handleCreatePrompt(folderId, nome, conteudo) {
  if (!stateManager.canCreatePrompt()) {
    engine.showToast(TOAST_MESSAGES.limitReached);
    if (typeof chrome !== 'undefined' && chrome.tabs && chrome.tabs.create) {
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
    }
    return { success: false, error: TOAST_MESSAGES.limitReached };
  }

  const validationNome = validateName(nome);
  if (!validationNome.valid) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: validationNome.error };
  }

  if (!conteudo || conteudo.trim().length === 0) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: 'Conteúdo é obrigatório' };
  }

  const state = stateManager.getState();
  const result = await api.createPrompt({
    userId: state.user.id,
    folderId,
    name: nome.trim(),
    content: conteudo.trim()
  });

  if (!result.success) {
    if (result.code === 409) {
      engine.showToast(TOAST_MESSAGES.promptDuplicateName);
    } else if (result.error && (result.error.includes('Free plan limit') || result.error.includes('limit reached'))) {
      engine.showToast(TOAST_MESSAGES.limitReached);
    } else if (result.error && result.error.includes('Folder does not belong')) {
      engine.showToast(TOAST_MESSAGES.promptFolderError);
    } else {
      engine.showToast(TOAST_MESSAGES.promptError);
    }
    return { success: false };
  }

  const prompt = result.prompt;
  if (!prompt) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false };
  }

  const promptFolderId = prompt.folder_id || folderId;
  const normalizedPrompt = {
    id: prompt.id,
    folderId: promptFolderId,
    name: prompt.name,
    content: prompt.content,
    created_at: prompt.created_at,
    updated_at: prompt.updated_at
  };

  const newPrompts = { ...state.data.prompts, [prompt.id]: normalizedPrompt };
  const newFolderPrompts = { ...state.data.folderPrompts };
  if (!newFolderPrompts[promptFolderId]) {
    newFolderPrompts[promptFolderId] = [];
  }
  newFolderPrompts[promptFolderId] = [...newFolderPrompts[promptFolderId], prompt.id];

  stateManager.setState({
    data: {
      ...state.data,
      prompts: newPrompts,
      folderPrompts: newFolderPrompts
    }
  });

  engine.showToast(TOAST_MESSAGES.promptCreated);
  engine.closeDialog('promptDialog');
  return { success: true };
}

async function handleUpdatePrompt(promptId, folderId, nome, conteudo) {
  const validationNome = validateName(nome);
  if (!validationNome.valid) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: validationNome.error };
  }

  if (!conteudo || conteudo.trim().length === 0) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: 'Conteúdo é obrigatório' };
  }

  const state = stateManager.getState();
  const prompt = state.data.prompts[promptId];
  if (!prompt) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: 'Prompt não encontrado' };
  }

  const result = await api.updatePrompt({
    promptId,
    folderId,
    name: nome.trim(),
    content: conteudo.trim()
  });

  if (!result.success) {
    if (result.code === 409) {
      engine.showToast(TOAST_MESSAGES.promptDuplicateName);
    } else if (result.error && result.error.includes('Folder does not belong')) {
      engine.showToast(TOAST_MESSAGES.promptFolderError);
    } else {
      engine.showToast(TOAST_MESSAGES.promptError);
    }
    return { success: false };
  }

  const updatedPrompt = result.prompt;
  if (!updatedPrompt) {
    engine.showToast(TOAST_MESSAGES.promptUpdated);
    engine.closeDialog('promptEditDialog');
    return { success: true };
  }

  const newFolderId = updatedPrompt.folder_id != null ? updatedPrompt.folder_id : folderId;
  const oldFolderId = prompt.folderId;
  const normalizedPrompt = {
    id: updatedPrompt.id,
    folderId: newFolderId,
    name: updatedPrompt.name,
    content: updatedPrompt.content,
    created_at: updatedPrompt.created_at,
    updated_at: updatedPrompt.updated_at
  };

  const newPrompts = { ...state.data.prompts, [promptId]: normalizedPrompt };
  const newFolderPrompts = { ...state.data.folderPrompts };

  if (oldFolderId !== newFolderId) {
    newFolderPrompts[oldFolderId] = (newFolderPrompts[oldFolderId] || []).filter(id => id !== promptId);
    if (!newFolderPrompts[newFolderId]) {
      newFolderPrompts[newFolderId] = [];
    }
    newFolderPrompts[newFolderId] = [...newFolderPrompts[newFolderId], promptId];
  }

  stateManager.setState({
    data: {
      ...state.data,
      prompts: newPrompts,
      folderPrompts: newFolderPrompts
    }
  });

  engine.showToast(TOAST_MESSAGES.promptUpdated);
  engine.closeDialog('promptEditDialog');
  return { success: true };
}

async function handleDeletePrompt(promptId) {
  const state = stateManager.getState();
  const prompt = state.data.prompts[promptId];
  if (!prompt) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false, error: 'Prompt não encontrado' };
  }

  const result = await api.deletePrompt({ promptId });

  if (!result.success) {
    engine.showToast(TOAST_MESSAGES.promptError);
    return { success: false };
  }

  const newPrompts = { ...state.data.prompts };
  delete newPrompts[promptId];

  const newFolderPrompts = { ...state.data.folderPrompts };
  newFolderPrompts[prompt.folderId] = (newFolderPrompts[prompt.folderId] || []).filter(id => id !== promptId);

  stateManager.setState({
    data: {
      ...state.data,
      prompts: newPrompts,
      folderPrompts: newFolderPrompts
    }
  });

  engine.showToast(TOAST_MESSAGES.promptDeleted);
  engine.closeDialog('confirmDeletePromptDialog');
  return { success: true };
}

async function handleCopyPrompt(promptId) {
  const prompt = stateManager.getPromptById(promptId);
  if (!prompt) {
    engine.showToast(TOAST_MESSAGES.shareError);
    return;
  }

  const result = await copyToClipboard(prompt.content ?? prompt.conteudo);
  if (result.success) {
    engine.showToast(TOAST_MESSAGES.shareSuccess);
  } else {
    engine.showToast(TOAST_MESSAGES.shareError);
  }
}

Object.assign(engine, {
  handleCreatePrompt,
  handleUpdatePrompt,
  handleDeletePrompt,
  handleCopyPrompt
});
