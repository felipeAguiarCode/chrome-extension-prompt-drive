// =========================
// Render - DOM Rendering
// =========================

const renderer = {
  initialize() {
    // Subscribe to state changes
    stateManager.subscribe((state) => {
      this.render(state);
    });
  },

  render(state) {
    this.renderHeader(state);
    this.renderMainContent(state);
    this.renderFooter(state);
    this.renderDialogs(state);
  },

  renderHeader(state) {
    const counterEl = document.querySelector(DOM_IDS.promptCounter);
    if (counterEl) {
      const total = stateManager.getPromptCountTotal();
      if (state.user.plan === 'premium') {
        counterEl.textContent = `${total} / ∞`;
      } else {
        counterEl.textContent = `${total} / ${FREE_MAX_PROMPTS}`;
      }
    }

    // Show/hide import button for premium
    const importBtn = document.querySelector(DOM_IDS.btnImportFolder);
    if (importBtn) {
      importBtn.style.display = state.user.plan === 'premium' ? 'block' : 'none';
    }

    // Update license key button icon based on premium status
    const licenseBtn = document.querySelector(DOM_IDS.btnLicenseKey);
    if (licenseBtn) {
      if (state.user.plan === 'premium') {
        licenseBtn.innerHTML = this.iconPremiumStatus();
        licenseBtn.classList.remove('btn--key');
        licenseBtn.classList.add('btn--premium-status');
        licenseBtn.title = 'Premium Ativo';
      } else {
        licenseBtn.innerHTML = `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
        </svg>`;
        licenseBtn.classList.add('btn--key');
        licenseBtn.classList.remove('btn--premium-status');
        licenseBtn.title = 'Serial Key';
      }
    }
  },

  renderMainContent(state) {
    const container = document.querySelector(DOM_IDS.foldersContainer);
    if (!container) return;

    if (state.ui.loading) {
      container.innerHTML = '<div class="empty-state"><div class="spinner"></div><p>Carregando...</p></div>';
      return;
    }

    if (state.ui.error) {
      container.innerHTML = `
        <div class="empty-state">
          <p>Erro: ${state.ui.error.message}</p>
          <button data-action="retry" class="btn btn--primary">Tentar novamente</button>
        </div>
      `;
      const retryBtn = container.querySelector('[data-action="retry"]');
      if (retryBtn) {
        retryBtn.addEventListener('click', () => engine.initialize());
      }
      return;
    }

    const folders = Object.values(state.data.folders);
    
    if (folders.length === 0) {
      container.innerHTML = '<div class="empty-state"><p>Nenhuma pasta encontrada. Crie sua primeira pasta!</p></div>';
      return;
    }

    container.innerHTML = folders.map(folder => this.renderFolder(folder, state)).join('');
    
    // Attach event listeners
    folders.forEach(folder => {
      this.attachFolderListeners(folder.id, state);
    });
  },

  renderFolder(folder, state) {
    const prompts = stateManager.getPromptsByFolder(folder.id);
    const isExpanded = state.ui.expandedFolders[folder.id] || false;
    const promptCount = prompts.length;
    
    return `
      <div class="folder-item" data-folder-id="${folder.id}" data-expanded="${isExpanded}">
        <div class="folder-item__header" data-action="toggle-folder">
          <div class="folder-item__info">
            <span class="folder-item__chevron">${this.iconChevronDown()}</span>
            <span class="folder-item__icon">${this.iconFolder()}</span>
            <span class="folder-item__name">${this.escapeHtml(folder.name)}</span>
            <span class="folder-item__count">${promptCount}</span>
          </div>
          <div class="folder-item__actions">
            ${state.user.plan === 'premium' ? `
              <button class="folder-item__action" data-action="export-folder" data-folder-id="${folder.id}" title="Exportar pasta" aria-label="Exportar pasta">
                ${this.iconExport()}
              </button>
            ` : ''}
            <button class="folder-item__action" data-action="edit-folder" data-folder-id="${folder.id}" title="Editar pasta" aria-label="Editar pasta">
              ${this.iconEdit()}
            </button>
            <button class="folder-item__action" data-action="delete-folder" data-folder-id="${folder.id}" title="Deletar pasta" aria-label="Deletar pasta">
              ${this.iconDelete()}
            </button>
          </div>
        </div>
        <div class="folder-item__content ${isExpanded ? 'folder-item__content--expanded' : ''}">
          ${prompts.length === 0 ? '<div class="empty-state"><p>Esta pasta está vazia. Crie seu primeiro prompt!</p></div>' : ''}
          ${prompts.map(prompt => this.renderPrompt(prompt, state)).join('')}
        </div>
      </div>
    `;
  },

  renderPrompt(prompt, state) {
    const preview = prompt.conteudo.length > 100 
      ? prompt.conteudo.substring(0, 100) + '...'
      : prompt.conteudo;
    
    // Limit preview to 2 lines
    const previewLines = preview.split('\n').slice(0, 2).join('\n');
    
    return `
      <div class="prompt-item" data-prompt-id="${prompt.id}">
        <div class="prompt-item__info">
          <h4 class="prompt-item__name">${this.escapeHtml(prompt.nome)}</h4>
          <p class="prompt-item__preview">${this.escapeHtml(previewLines)}</p>
        </div>
        <div class="prompt-item__actions">
          <button class="prompt-item__action" data-action="copy-prompt" data-prompt-id="${prompt.id}" title="Copiar para clipboard" aria-label="Copiar prompt">
            ${this.iconCopy()}
          </button>
          <button class="prompt-item__action" data-action="edit-prompt" data-prompt-id="${prompt.id}" title="Editar prompt" aria-label="Editar prompt">
            ${this.iconEdit()}
          </button>
          <button class="prompt-item__action" data-action="delete-prompt" data-prompt-id="${prompt.id}" title="Excluir prompt" aria-label="Excluir prompt">
            ${this.iconDelete()}
          </button>
        </div>
      </div>
    `;
  },

  attachFolderListeners(folderId, state) {
    const folderEl = document.querySelector(`[data-folder-id="${folderId}"]`);
    if (!folderEl) return;

    // Toggle expansion
    const toggleBtn = folderEl.querySelector('[data-action="toggle-folder"]');
    if (toggleBtn) {
      toggleBtn.addEventListener('click', (e) => {
        if (!e.target.closest('.folder-item__action')) {
          engine.toggleFolderExpansion(folderId);
        }
      });
    }

    // Export folder (premium only)
    const exportBtn = folderEl.querySelector('[data-action="export-folder"]');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        engine.handleExportFolder(folderId);
      });
    }

    // Edit folder
    const editBtn = folderEl.querySelector('[data-action="edit-folder"]');
    if (editBtn) {
      editBtn.addEventListener('click', () => {
        const folder = stateManager.getFolderById(folderId);
        if (folder) {
          const state = stateManager.getState();
          stateManager.setState({
            ui: { ...state.ui, currentEditingFolderId: folderId }
          });
          engine.openDialog('editFolderDialog');
        }
      });
    }

    // Delete folder
    const deleteBtn = folderEl.querySelector('[data-action="delete-folder"]');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', () => {
        const state = stateManager.getState();
        stateManager.setState({
          ui: { ...state.ui, currentDeletingFolderId: folderId }
        });
        engine.openDialog('deleteFolderDialog');
      });
    }

    // Prompt actions
    const promptItems = folderEl.querySelectorAll('[data-prompt-id]');
    promptItems.forEach(item => {
      const promptId = item.getAttribute('data-prompt-id');
      
      const copyBtn = item.querySelector('[data-action="copy-prompt"]');
      if (copyBtn) {
        copyBtn.addEventListener('click', () => engine.handleCopyPrompt(promptId));
      }

      const editBtn = item.querySelector('[data-action="edit-prompt"]');
      if (editBtn) {
        editBtn.addEventListener('click', () => {
          const state = stateManager.getState();
          stateManager.setState({
            ui: { ...state.ui, currentEditingPromptId: promptId }
          });
          engine.openDialog('promptEditDialog');
        });
      }

      const deleteBtn = item.querySelector('[data-action="delete-prompt"]');
      if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
          const state = stateManager.getState();
          stateManager.setState({
            ui: { ...state.ui, currentDeletingPromptId: promptId }
          });
          engine.openDialog('confirmDeletePromptDialog');
        });
      }
    });
  },

  renderFooter(state) {
    const badgeEl = document.querySelector(DOM_IDS.userPlanBadge);
    if (badgeEl) {
      badgeEl.textContent = state.user.plan === 'premium' ? 'Premium' : 'Plano Gratuito';
      badgeEl.className = `plan-badge plan-badge--${state.user.plan}`;
    }
  },

  renderDialogs(state) {
    this.renderDialogVisibility(state);
    
    if (state.ui.dialogs.editFolderDialogOpen) {
      this.populateEditFolderDialog(state);
    }
    
    if (state.ui.dialogs.promptEditDialogOpen) {
      this.populateEditPromptDialog(state);
    }
    
    if (state.ui.dialogs.deleteFolderDialogOpen) {
      this.populateDeleteFolderDialog(state);
    }
  },

  renderDialogVisibility(state) {
    const dialogs = [
      'folderDialog',
      'editFolderDialog',
      'promptDialog',
      'promptEditDialog',
      'confirmDeletePromptDialog',
      'deleteFolderDialog',
      'licenseDialog',
      'importDialog'
    ];

    dialogs.forEach(dialogName => {
      const dialog = document.querySelector(`#${dialogName}`);
      if (dialog) {
        const isOpen = state.ui.dialogs[`${dialogName}Open`] || false;
        if (isOpen) {
          dialog.classList.add('dialog--open');
          dialog.setAttribute('aria-hidden', 'false');
        } else {
          dialog.classList.remove('dialog--open');
          dialog.setAttribute('aria-hidden', 'true');
        }
      }
    });
  },

  populateEditFolderDialog(state) {
    const folderId = state.ui.currentEditingFolderId;
    if (!folderId) return;

    const folder = stateManager.getFolderById(folderId);
    if (!folder) return;

    const input = document.querySelector('#editFolderDialog input[type="text"]');
    if (input) {
      input.value = folder.name;
    }
  },

  populateEditPromptDialog(state) {
    const promptId = state.ui.currentEditingPromptId;
    if (!promptId) return;

    const prompt = stateManager.getPromptById(promptId);
    if (!prompt) return;

    // Populate folder select
    const folderSelect = document.querySelector('#promptEditDialog select[name="folderId"]');
    if (folderSelect) {
      // Clear and repopulate options
      while (folderSelect.options.length > 1) {
        folderSelect.remove(1);
      }
      const folders = Object.values(state.data.folders);
      folders.forEach(folder => {
        const option = document.createElement('option');
        option.value = folder.id;
        option.textContent = folder.name;
        folderSelect.appendChild(option);
      });
      folderSelect.value = prompt.folderId;
    }

    const nomeInput = document.querySelector('#promptEditDialog input[name="nome"]');
    const conteudoTextarea = document.querySelector('#promptEditDialog textarea[name="conteudo"]');

    if (nomeInput) {
      nomeInput.value = prompt.nome;
    }
    if (conteudoTextarea) {
      conteudoTextarea.value = prompt.conteudo;
    }
  },

  populateDeleteFolderDialog(state) {
    const folderId = state.ui.currentDeletingFolderId;
    if (!folderId) return;

    const folder = stateManager.getFolderById(folderId);
    if (!folder) return;

    const nameEl = document.querySelector('#deleteFolderDialog .folder-name-display');
    if (nameEl) {
      nameEl.textContent = folder.name;
    }
  },

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  },

  // Icon helpers
  iconChevronDown() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="6 9 12 15 18 9"></polyline>
    </svg>`;
  },

  iconFolder() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path>
    </svg>`;
  },

  iconEdit() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
    </svg>`;
  },

  iconDelete() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
      <line x1="10" y1="11" x2="10" y2="17"></line>
      <line x1="14" y1="11" x2="14" y2="17"></line>
    </svg>`;
  },

  iconCopy() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
    </svg>`;
  },

  iconExport() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
      <polyline points="7 10 12 15 17 10"></polyline>
      <line x1="12" y1="15" x2="12" y2="3"></line>
    </svg>`;
  },

  iconPremiumStatus() {
    return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <circle cx="12" cy="12" r="10" fill="#28A745"></circle>
      <polyline points="9 12 11 14 15 10"></polyline>
    </svg>`;
  }
};
