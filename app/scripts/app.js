// =========================
// App - Initialization
// =========================

const app = {
  async init() {
    // Initialize renderer subscription
    renderer.initialize();

    // Attach event listeners
    this.attachEventListeners();

    // Initialize application
    await engine.initialize();
  },

  attachEventListeners() {
    // Header buttons
    const btnCreateFolder = document.querySelector(DOM_IDS.btnCreateFolder);
    const btnCreatePrompt = document.querySelector(DOM_IDS.btnCreatePrompt);
    const btnLicenseKey = document.querySelector(DOM_IDS.btnLicenseKey);
    const btnImportFolder = document.querySelector(DOM_IDS.btnImportFolder);

    if (btnCreateFolder) {
      btnCreateFolder.addEventListener('click', () => {
        this.populateFolderSelect();
        engine.openDialog('folderDialog');
      });
    }

    if (btnCreatePrompt) {
      btnCreatePrompt.addEventListener('click', () => {
        if (!stateManager.canCreatePrompt()) {
          engine.showToast(TOAST_MESSAGES.limitReached);
          chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
          return;
        }
        this.populateFolderSelect('#promptFolderId');
        engine.openDialog('promptDialog');
      });
    }

    if (btnLicenseKey) {
      btnLicenseKey.addEventListener('click', () => {
        engine.openDialog('licenseDialog');
      });
    }

    if (btnImportFolder) {
      btnImportFolder.addEventListener('click', () => {
        if (stateManager.isFreePlan()) {
          engine.showToast(TOAST_MESSAGES.premiumFeature);
          chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
          return;
        }
        engine.openDialog('importDialog');
      });
    }

    // Dialog forms
    this.attachFormListeners();

    // Close dialogs on ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        const state = stateManager.getState();
        const openDialogs = Object.entries(state.ui.dialogs).filter(([_, isOpen]) => isOpen);
        if (openDialogs.length > 0) {
          const dialogKey = openDialogs[0][0]; // e.g., 'promptEditDialogOpen'
          const dialogName = dialogKey.replace('Open', ''); // e.g., 'promptEditDialog'
          engine.closeDialog(dialogName);
        }
      }
    });

    // Close dialogs on overlay click
    document.addEventListener('click', (e) => {
      if (e.target.classList.contains('dialog__overlay')) {
        const dialog = e.target.closest('.dialog');
        if (dialog) {
          const dialogId = dialog.id; // e.g., 'promptEditDialog'
          engine.closeDialog(dialogId);
        }
      }
    });

    // Close dialog buttons
    document.querySelectorAll('[data-action="close-dialog"]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const dialog = e.target.closest('.dialog');
        if (dialog) {
          const dialogId = dialog.id; // e.g., 'promptEditDialog'
          engine.closeDialog(dialogId);
        }
      });
    });
  },

  attachFormListeners() {
    // Create folder form
    const folderForm = document.querySelector('#folderForm');
    if (folderForm) {
      folderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        engine.handleCreateFolder(name);
      });
    }

    // Edit folder form
    const editFolderForm = document.querySelector('#editFolderForm');
    if (editFolderForm) {
      editFolderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const state = stateManager.getState();
        const folderId = state.ui.currentEditingFolderId;
        if (!folderId) return;

        const formData = new FormData(e.target);
        const name = formData.get('name');
        engine.handleUpdateFolder(folderId, name);
      });
    }

    // Delete folder form
    const deleteFolderForm = document.querySelector('#deleteFolderForm');
    if (deleteFolderForm) {
      deleteFolderForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const state = stateManager.getState();
        const folderId = state.ui.currentDeletingFolderId;
        if (!folderId) return;

        const formData = new FormData(e.target);
        const confirmName = formData.get('confirmName');
        engine.handleDeleteFolder(folderId, confirmName);
      });
    }

    // Create prompt form
    const promptForm = document.querySelector('#promptForm');
    if (promptForm) {
      promptForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const folderId = formData.get('folderId');
        const nome = formData.get('nome');
        const conteudo = formData.get('conteudo');
        engine.handleCreatePrompt(folderId, nome, conteudo);
      });
    }

    // Edit prompt form
    const promptEditForm = document.querySelector('#promptEditForm');
    if (promptEditForm) {
      promptEditForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const state = stateManager.getState();
        const promptId = state.ui.currentEditingPromptId;
        if (!promptId) return;

        const formData = new FormData(e.target);
        const folderId = formData.get('folderId');
        const nome = formData.get('nome');
        const conteudo = formData.get('conteudo');
        engine.handleUpdatePrompt(promptId, folderId, nome, conteudo);
      });
    }

    // Confirm delete prompt button
    const confirmDeletePromptBtn = document.querySelector('#confirmDeletePromptBtn');
    if (confirmDeletePromptBtn) {
      confirmDeletePromptBtn.addEventListener('click', () => {
        const state = stateManager.getState();
        const promptId = state.ui.currentDeletingPromptId;
        if (promptId) {
          engine.handleDeletePrompt(promptId);
        }
      });
    }

    // License form
    const licenseForm = document.querySelector('#licenseForm');
    if (licenseForm) {
      licenseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const licenseKey = formData.get('licenseKey');
        engine.handleActivatePremium(licenseKey);
      });
    }

    // Import form
    const importForm = document.querySelector('#importForm');
    if (importForm) {
      importForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const jsonText = formData.get('json');
        engine.handleImportFolder(jsonText);
      });
    }
  },

  populateFolderSelect(selector = 'select[name="folderId"]') {
    const state = stateManager.getState();
    const folders = Object.values(state.data.folders);
    
    const selects = document.querySelectorAll(selector);
    selects.forEach(select => {
      // Clear existing options except the first one
      while (select.options.length > 1) {
        select.remove(1);
      }

      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        select.appendChild(option);
      });
    });
  }
};

// Initialize app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => app.init());
} else {
  app.init();
}
