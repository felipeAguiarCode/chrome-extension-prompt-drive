// =========================
// Engine Dialogs - Open, Close, Toggle
// =========================

function openDialog(dialogName) {
  const state = stateManager.getState();
  stateManager.setState({
    ui: {
      ...state.ui,
      dialogs: { ...state.ui.dialogs, [`${dialogName}Open`]: true }
    }
  });
}

function closeDialog(dialogName) {
  const state = stateManager.getState();
  stateManager.setState({
    ui: {
      ...state.ui,
      dialogs: { ...state.ui.dialogs, [`${dialogName}Open`]: false },
      currentEditingFolderId: dialogName === 'editFolderDialog' ? null : state.ui.currentEditingFolderId,
      currentEditingPromptId: dialogName === 'promptEditDialog' ? null : state.ui.currentEditingPromptId,
      currentDeletingPromptId: dialogName === 'confirmDeletePromptDialog' ? null : state.ui.currentDeletingPromptId,
      currentDeletingFolderId: dialogName === 'deleteFolderDialog' ? null : state.ui.currentDeletingFolderId
    }
  });
}

function toggleFolderExpansion(folderId) {
  const state = stateManager.getState();
  const isExpanded = state.ui.expandedFolders[folderId] || false;
  stateManager.setState({
    ui: {
      ...state.ui,
      expandedFolders: { ...state.ui.expandedFolders, [folderId]: !isExpanded }
    }
  });
}

Object.assign(engine, { openDialog, closeDialog, toggleFolderExpansion });
