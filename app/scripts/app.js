// =========================
// App - Initialization
// =========================

const app = {
  async init() {
    api.setOnUnauthorized(async () => {
      await api.clearToken();
      engine.showToast(TOAST_MESSAGES.sessionExpired);
      this.showAuthScreen();
      this.attachAuthListeners();
    });

    // Verificar token existente
    const token = await api.getStoredToken();

    if (!token) {
      this.showAuthScreen();
      this.attachAuthListeners();
      return;
    }

    // Tentar inicializar aplicacao (carrega dados via fetch com o token)
    try {
      renderer.initialize();
      this.attachEventListeners();
      await engine.initialize();
      this.showAppScreen();
    } catch (error) {
      console.error('Error initializing app:', error);
      await api.clearToken();
      this.showAuthScreen();
      this.attachAuthListeners();
      engine.showToast(TOAST_MESSAGES.sessionExpired);
    }
  },

  // =========================
  // Screen Control Methods
  // =========================

  showAuthScreen() {
    document.querySelector(DOM_IDS.authScreen).style.display = 'flex';
    document.querySelector(DOM_IDS.appScreen).style.display = 'none';
    document.querySelector(DOM_IDS.loginView).style.display = 'block';
    document.querySelector(DOM_IDS.signupView).style.display = 'none';
    document.querySelector(DOM_IDS.redirectingView).style.display = 'none';
  },

  showAppScreen() {
    document.querySelector(DOM_IDS.authScreen).style.display = 'none';
    document.querySelector(DOM_IDS.appScreen).style.display = 'flex';
  },

  showSignupView() {
    document.querySelector(DOM_IDS.loginView).style.display = 'none';
    document.querySelector(DOM_IDS.signupView).style.display = 'block';
    document.querySelector(DOM_IDS.redirectingView).style.display = 'none';
  },

  showLoginView() {
    document.querySelector(DOM_IDS.loginView).style.display = 'block';
    document.querySelector(DOM_IDS.signupView).style.display = 'none';
    document.querySelector(DOM_IDS.redirectingView).style.display = 'none';
  },

  showRedirecting() {
    document.querySelector(DOM_IDS.loginView).style.display = 'none';
    document.querySelector(DOM_IDS.signupView).style.display = 'none';
    document.querySelector(DOM_IDS.redirectingView).style.display = 'flex';
  },

  async handleLogout() {
    await api.logout();
    this.showAuthScreen();
    this.attachAuthListeners();
  },

  // =========================
  // Auth Event Listeners
  // =========================

  attachAuthListeners() {
    const loginForm = document.querySelector(DOM_IDS.loginForm);
    const signupForm = document.querySelector(DOM_IDS.signupForm);
    const btnShowSignup = document.querySelector(DOM_IDS.btnShowSignup);
    const btnShowLogin = document.querySelector(DOM_IDS.btnShowLogin);

    // Login form submission
    if (loginForm) {
      loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const email = e.target.email.value;
        const password = e.target.password.value;
        const submitBtn = loginForm.querySelector('button[type="submit"]');

        submitBtn.classList.add('btn--loading');
        submitBtn.disabled = true;

        const result = await api.doLogin(email, password);

        if (result.success) {
          engine.showToast(TOAST_MESSAGES.loginSuccess);
          this.showRedirecting();

          try {
            renderer.initialize();
            this.attachEventListeners();
            await engine.initialize();
            this.showAppScreen();
          } catch (error) {
            console.error('Error after login:', error);
            engine.showToast(TOAST_MESSAGES.authError);
            this.showLoginView();
          }
        } else {
          engine.showToast(result.error || TOAST_MESSAGES.loginError);
        }

        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
      });
    }

    // Signup form submission
    if (signupForm) {
      signupForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const name = e.target.name.value;
        const email = e.target.email.value;
        const password = e.target.password.value;
        const submitBtn = signupForm.querySelector('button[type="submit"]');

        submitBtn.classList.add('btn--loading');
        submitBtn.disabled = true;

        const result = await api.createUser(email, password, name);

        if (result.success) {
          engine.showToast(TOAST_MESSAGES.signupSuccess);
          this.showRedirecting();
          // Aguardar um pouco e voltar ao login
          setTimeout(() => {
            this.showLoginView();
            signupForm.reset();
          }, 2000);
        } else {
          engine.showToast(result.error || TOAST_MESSAGES.signupError);
        }

        submitBtn.classList.remove('btn--loading');
        submitBtn.disabled = false;
      });
    }

    // Toggle entre login e signup
    if (btnShowSignup) {
      btnShowSignup.addEventListener('click', () => this.showSignupView());
    }

    if (btnShowLogin) {
      btnShowLogin.addEventListener('click', () => this.showLoginView());
    }
  },

  // =========================
  // App Event Listeners
  // =========================


  attachEventListeners() {
    if (this._appEventListenersAttached) return;

    // Header buttons
    const btnCreateFolder = document.querySelector(DOM_IDS.btnCreateFolder);
    const btnCreatePrompt = document.querySelector(DOM_IDS.btnCreatePrompt);
    const btnLicenseKey = document.querySelector(DOM_IDS.btnLicenseKey);
    const btnImportFolder = document.querySelector(DOM_IDS.btnImportFolder);
    const btnLogout = document.querySelector(DOM_IDS.btnLogout);

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

    if (btnLogout) {
      btnLogout.addEventListener('click', () => this.handleLogout());
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

    this._appEventListenersAttached = true;
  },

  attachFormListeners() {
    // Create folder form
    const folderForm = document.querySelector('#folderForm');
    if (folderForm) {
      folderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const name = formData.get('name');
        await engine.handleCreateFolder(name);
      });
    }

    // Edit folder form
    const editFolderForm = document.querySelector('#editFolderForm');
    if (editFolderForm) {
      editFolderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const state = stateManager.getState();
        const folderId = state.ui.currentEditingFolderId;
        if (!folderId) return;

        const formData = new FormData(e.target);
        const name = formData.get('name');
        await engine.handleUpdateFolder(folderId, name);
      });
    }

    // Delete folder form
    const deleteFolderForm = document.querySelector('#deleteFolderForm');
    if (deleteFolderForm) {
      deleteFolderForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const state = stateManager.getState();
        const folderId = state.ui.currentDeletingFolderId;
        if (!folderId) return;

        const formData = new FormData(e.target);
        const confirmName = formData.get('confirmName');
        await engine.handleDeleteFolder(folderId, confirmName);
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
