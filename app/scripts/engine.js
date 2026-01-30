// =========================
// Engine - Business Logic & Orchestration
// =========================

const engine = {
  // Initialize application - load seed data
  async initialize() {
    stateManager.setState({ ui: { ...stateManager.getState().ui, loading: true } });

    try {
      const seedData = await this.loadSeedData();
      const folders = {};
      const prompts = {};
      const folderPrompts = {};
      const isNewFormat = seedData.user && seedData.profile && Array.isArray(seedData.folders) &&
        seedData.folders.length > 0 && seedData.folders[0].prompts !== undefined;

      if (isNewFormat) {
        seedData.folders.forEach(folder => {
          folders[folder.id] = {
            id: folder.id,
            name: folder.name,
            created_at: folder.created_at,
            updated_at: folder.updated_at
          };
          folderPrompts[folder.id] = [];
          (folder.prompts || []).forEach(p => {
            prompts[p.id] = {
              id: p.id,
              folderId: folder.id,
              name: p.name,
              content: p.content,
              created_at: p.created_at,
              updated_at: p.updated_at
            };
            folderPrompts[folder.id].push(p.id);
          });
        });
        const userFromSeed = {
          id: seedData.user.id,
          name: seedData.user.name,
          plan: seedData.profile.plan,
          licenseKey: stateManager.getState().user.licenseKey,
          licenseExpiry: stateManager.getState().user.licenseExpiry,
          createdAt: stateManager.getState().user.createdAt,
          updatedAt: stateManager.getState().user.updatedAt
        };
        stateManager.setState({
          user: userFromSeed,
          data: { folders, prompts, folderPrompts },
          profile: seedData.profile,
          subscription: seedData.subscription,
          ui: { ...stateManager.getState().ui, loading: false, error: null }
        });
      } else {
        seedData.folders.forEach(folder => {
          folders[folder.id] = {
            id: folder.id,
            name: folder.name,
            created_at: folder.created_at ?? new Date(folder.createdAt || Date.now()).toISOString(),
            updated_at: folder.updated_at ?? new Date(folder.updatedAt || Date.now()).toISOString()
          };
          folderPrompts[folder.id] = [];
        });
        seedData.prompts.forEach(prompt => {
          const folderId = prompt.folderId;
          prompts[prompt.id] = {
            id: prompt.id,
            folderId,
            name: prompt.name ?? prompt.nome,
            content: prompt.content ?? prompt.conteudo,
            created_at: prompt.created_at ?? new Date(prompt.createdAt || Date.now()).toISOString(),
            updated_at: prompt.updated_at ?? new Date(prompt.updatedAt || Date.now()).toISOString()
          };
          if (!folderPrompts[folderId]) folderPrompts[folderId] = [];
          folderPrompts[folderId].push(prompt.id);
        });
        stateManager.setState({
          data: { folders, prompts, folderPrompts },
          ui: { ...stateManager.getState().ui, loading: false, error: null }
        });
      }
    } catch (error) {
      console.error('Error initializing:', error);
      stateManager.setState({
        ui: { ...stateManager.getState().ui, loading: false, error: { message: error.message } }
      });
    }
  },

  // Load seed data with robust encoding handling
  async loadSeedData() {
    const paths = ['./data/seed.json', '/data/seed.json', 'data/seed.json'];
    
    for (const path of paths) {
      try {
        const response = await fetch(path);
        if (!response.ok) continue;
        
        // Read as text first
        const text = await response.text();
        
        // Clean BOM and zero-width characters
        const cleanText = text.trim().replace(/^[\uFEFF\u200B-\u200D\u2060]/g, '');
        
        const data = JSON.parse(cleanText);
        return data;
      } catch (error) {
        console.warn(`Failed to load from ${path}:`, error.message);
        continue;
      }
    }

    // Fallback inline data (new format)
    console.warn('Using fallback seed data');
    return {
      user: { id: 'user-1', name: 'Usuário' },
      profile: { stripe_customer_id: null, plan: 'free' },
      subscription: null,
      folders: [
        {
          id: 'folder-1',
          name: 'Marketing',
          created_at: new Date(1704067200000).toISOString(),
          updated_at: new Date(1704067200000).toISOString(),
          prompts: [
            {
              id: 'prompt-1',
              name: 'Post para Redes Sociais',
              content: 'Crie um post engajador para [plataforma] sobre [tema]. Inclua uma chamada para ação clara e use uma linguagem [tom].',
              created_at: new Date(1704067200000).toISOString(),
              updated_at: new Date(1704067200000).toISOString()
            },
            {
              id: 'prompt-2',
              name: 'Email Marketing',
              content: 'Escreva um email de marketing para promover [produto/serviço]. O email deve ser persuasivo, mas não agressivo, e destacar os principais benefícios.',
              created_at: new Date(1704070800000).toISOString(),
              updated_at: new Date(1704070800000).toISOString()
            }
          ]
        },
        {
          id: 'folder-2',
          name: 'Desenvolvimento',
          created_at: new Date(1704153600000).toISOString(),
          updated_at: new Date(1704153600000).toISOString(),
          prompts: [
            {
              id: 'prompt-3',
              name: 'Revisão de Código',
              content: 'Revise o seguinte código [código] e forneça feedback sobre: performance, segurança, legibilidade e boas práticas.',
              created_at: new Date(1704153600000).toISOString(),
              updated_at: new Date(1704153600000).toISOString()
            }
          ]
        }
      ]
    };
  },

  // Create folder
  handleCreateFolder(folderName) {
    const validation = validateName(folderName);
    if (!validation.valid) {
      this.showToast(TOAST_MESSAGES.folderError);
      return { success: false, error: validation.error };
    }

    const state = stateManager.getState();
    const folderId = generateUUID();
    const now = new Date().toISOString();

    const newFolder = {
      id: folderId,
      name: folderName.trim(),
      created_at: now,
      updated_at: now
    };

    stateManager.setState({
      data: {
        ...state.data,
        folders: { ...state.data.folders, [folderId]: newFolder },
        folderPrompts: { ...state.data.folderPrompts, [folderId]: [] }
      }
    });

    api.createFolder({
      userId: state.user.id,
      folderId,
      folderName: newFolder.name
    });

    this.showToast(TOAST_MESSAGES.folderCreated);
    this.closeDialog('folderDialog');
    return { success: true };
  },

  // Update folder
  handleUpdateFolder(folderId, newName) {
    const validation = validateName(newName);
    if (!validation.valid) {
      this.showToast(TOAST_MESSAGES.folderError);
      return { success: false, error: validation.error };
    }

    const state = stateManager.getState();
    const folder = state.data.folders[folderId];
    if (!folder) {
      this.showToast(TOAST_MESSAGES.folderError);
      return { success: false, error: 'Pasta não encontrada' };
    }

    const updatedFolder = {
      ...folder,
      name: newName.trim(),
      updated_at: new Date().toISOString()
    };

    stateManager.setState({
      data: {
        ...state.data,
        folders: { ...state.data.folders, [folderId]: updatedFolder }
      }
    });

    api.updateFolder({
      userId: state.user.id,
      folderId,
      folderName: updatedFolder.name
    });

    this.showToast(TOAST_MESSAGES.folderUpdated);
    this.closeDialog('editFolderDialog');
    return { success: true };
  },

  // Delete folder
  handleDeleteFolder(folderId, confirmName) {
    const state = stateManager.getState();
    const folder = state.data.folders[folderId];
    if (!folder) {
      this.showToast(TOAST_MESSAGES.folderDeleteError);
      return { success: false, error: 'Pasta não encontrada' };
    }

    if (confirmName !== folder.name) {
      this.showToast(TOAST_MESSAGES.folderNameMismatch);
      return { success: false, error: TOAST_MESSAGES.folderNameMismatch };
    }

    // Remove folder and all its prompts
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

    api.deleteFolder({
      userId: state.user.id,
      folderId
    });

    this.showToast(TOAST_MESSAGES.folderDeleted);
    this.closeDialog('deleteFolderDialog');
    return { success: true };
  },

  // Create prompt
  handleCreatePrompt(folderId, nome, conteudo) {
    if (!stateManager.canCreatePrompt()) {
      this.showToast(TOAST_MESSAGES.limitReached);
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
      return { success: false, error: TOAST_MESSAGES.limitReached };
    }

    const validationNome = validateName(nome);
    if (!validationNome.valid) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: validationNome.error };
    }

    if (!conteudo || conteudo.trim().length === 0) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: 'Conteúdo é obrigatório' };
    }

    const state = stateManager.getState();
    const promptId = generateUUID();
    const now = new Date().toISOString();

    const newPrompt = {
      id: promptId,
      folderId,
      name: nome.trim(),
      content: conteudo.trim(),
      created_at: now,
      updated_at: now
    };

    const newPrompts = { ...state.data.prompts, [promptId]: newPrompt };
    const newFolderPrompts = { ...state.data.folderPrompts };
    if (!newFolderPrompts[folderId]) {
      newFolderPrompts[folderId] = [];
    }
    newFolderPrompts[folderId] = [...newFolderPrompts[folderId], promptId];

    stateManager.setState({
      data: {
        ...state.data,
        prompts: newPrompts,
        folderPrompts: newFolderPrompts
      }
    });

    api.createPrompt({
      userId: state.user.id,
      prompt: newPrompt
    });

    this.showToast(TOAST_MESSAGES.promptCreated);
    this.closeDialog('promptDialog');
    return { success: true };
  },

  // Update prompt
  handleUpdatePrompt(promptId, folderId, nome, conteudo) {
    const validationNome = validateName(nome);
    if (!validationNome.valid) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: validationNome.error };
    }

    if (!conteudo || conteudo.trim().length === 0) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: 'Conteúdo é obrigatório' };
    }

    const state = stateManager.getState();
    const prompt = state.data.prompts[promptId];
    if (!prompt) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: 'Prompt não encontrado' };
    }

    const oldFolderId = prompt.folderId;
    const updatedPrompt = {
      ...prompt,
      folderId,
      name: nome.trim(),
      content: conteudo.trim(),
      updated_at: new Date().toISOString()
    };

    const newPrompts = { ...state.data.prompts, [promptId]: updatedPrompt };
    const newFolderPrompts = { ...state.data.folderPrompts };

    // If folder changed, move prompt
    if (oldFolderId !== folderId) {
      newFolderPrompts[oldFolderId] = newFolderPrompts[oldFolderId].filter(id => id !== promptId);
      if (!newFolderPrompts[folderId]) {
        newFolderPrompts[folderId] = [];
      }
      newFolderPrompts[folderId].push(promptId);
    }

    stateManager.setState({
      data: {
        ...state.data,
        prompts: newPrompts,
        folderPrompts: newFolderPrompts
      }
    });

    api.updatePrompt({
      userId: state.user.id,
      promptId,
      patch: {
        folderId: updatedPrompt.folderId,
        name: updatedPrompt.name,
        content: updatedPrompt.content
      }
    });

    this.showToast(TOAST_MESSAGES.promptUpdated);
    this.closeDialog('promptEditDialog');
    return { success: true };
  },

  // Delete prompt
  handleDeletePrompt(promptId) {
    const state = stateManager.getState();
    const prompt = state.data.prompts[promptId];
    if (!prompt) {
      this.showToast(TOAST_MESSAGES.promptError);
      return { success: false, error: 'Prompt não encontrado' };
    }

    const newPrompts = { ...state.data.prompts };
    delete newPrompts[promptId];

    const newFolderPrompts = { ...state.data.folderPrompts };
    newFolderPrompts[prompt.folderId] = newFolderPrompts[prompt.folderId].filter(id => id !== promptId);

    stateManager.setState({
      data: {
        ...state.data,
        prompts: newPrompts,
        folderPrompts: newFolderPrompts
      }
    });

    api.deletePrompt({
      userId: state.user.id,
      promptId
    });

    this.showToast(TOAST_MESSAGES.promptDeleted);
    this.closeDialog('confirmDeletePromptDialog');
    return { success: true };
  },

  // Copy prompt to clipboard
  async handleCopyPrompt(promptId) {
    const prompt = stateManager.getPromptById(promptId);
    if (!prompt) {
      this.showToast(TOAST_MESSAGES.shareError);
      return;
    }

    const result = await copyToClipboard(prompt.content ?? prompt.conteudo);
    if (result.success) {
      this.showToast(TOAST_MESSAGES.shareSuccess);
    } else {
      this.showToast(TOAST_MESSAGES.shareError);
    }
  },

  // Activate premium
  handleActivatePremium(licenseKey) {
    if (!licenseKey || licenseKey.trim().length === 0) {
      this.showToast(TOAST_MESSAGES.invalidKey);
      return { success: false, error: 'Chave não pode estar vazia' };
    }

    if (!validateLicenseKey(licenseKey.trim())) {
      this.showToast(TOAST_MESSAGES.invalidKey);
      return { success: false, error: TOAST_MESSAGES.invalidKey };
    }

    const state = stateManager.getState();
    const expiry = Date.now() + (PREMIUM_LICENSE_DURATION_DAYS * 24 * 60 * 60 * 1000);

    stateManager.setState({
      user: {
        ...state.user,
        plan: 'premium',
        licenseKey: licenseKey.trim(),
        licenseExpiry: expiry,
        updatedAt: Date.now()
      }
    });

    api.activateLicenseKey({
      userId: state.user.id,
      licenseKey: licenseKey.trim()
    });

    const expiryDate = new Date(expiry).toLocaleDateString('pt-BR');
    this.showToast(`${TOAST_MESSAGES.premiumActivated} ${expiryDate}`);
    this.closeDialog('licenseDialog');
    return { success: true };
  },

  // Export folder (Premium only)
  handleExportFolder(folderId) {
    if (stateManager.isFreePlan()) {
      this.showToast(TOAST_MESSAGES.premiumFeature);
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
      return { success: false };
    }

    const state = stateManager.getState();
    const folder = state.data.folders[folderId];
    if (!folder) {
      this.showToast(TOAST_MESSAGES.exportError);
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
      this.showToast(TOAST_MESSAGES.exportSuccess);
    } else {
      this.showToast(TOAST_MESSAGES.exportError);
    }

    return result;
  },

  // Import folder (Premium only)
  handleImportFolder(jsonText) {
    if (stateManager.isFreePlan()) {
      this.showToast(TOAST_MESSAGES.premiumFeature);
      chrome.tabs.create({ url: SALES_LANDING_PAGE_URL });
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

      // Generate new folder ID if duplicate
      let newFolderId = importData.folder.id;
      if (existingFolderIds.has(newFolderId)) {
        newFolderId = generateUUID();
      }

      // Generate unique folder name
      let newFolderName = generateUniqueName(importData.folder.name, existingFolderNames);

      const newFolder = {
        id: newFolderId,
        name: newFolderName,
        created_at: importData.folder.created_at ?? importData.folder.createdAt ?? new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Process prompts
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

      this.showToast(TOAST_MESSAGES.importSuccess);
      this.closeDialog('importDialog');
      return { success: true };
    } catch (error) {
      console.error('Import error:', error);
      this.showToast(TOAST_MESSAGES.importError);
      return { success: false, error: error.message };
    }
  },

  // Dialog management
  openDialog(dialogName) {
    const state = stateManager.getState();
    stateManager.setState({
      ui: {
        ...state.ui,
        dialogs: { ...state.ui.dialogs, [`${dialogName}Open`]: true }
      }
    });
  },

  closeDialog(dialogName) {
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
  },

  toggleFolderExpansion(folderId) {
    const state = stateManager.getState();
    const isExpanded = state.ui.expandedFolders[folderId] || false;
    stateManager.setState({
      ui: {
        ...state.ui,
        expandedFolders: { ...state.ui.expandedFolders, [folderId]: !isExpanded }
      }
    });
  },

  // Toast notification
  showToast(message) {
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = message;
    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('toast--show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('toast--show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 3000);
  }
};
