// =========================
// Engine Core - Initialize & Toast
// =========================

const engine = {
  async initialize() {
    stateManager.setState({ ui: { ...stateManager.getState().ui, loading: true } });

    try {
      const userData = await api.loadCurrentUserData();
      if (!userData) {
        throw new Error('Usuário não autenticado');
      }

      const folders = {};
      const prompts = {};
      const folderPrompts = {};

      userData.folders.forEach(folder => {
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

      const currentState = stateManager.getState();
      stateManager.setState({
        user: {
          id: userData.user.id,
          name: userData.user.name,
          plan: userData.profile.plan,
          createdAt: currentState.user.createdAt,
          updatedAt: currentState.user.updatedAt
        },
        profile: userData.profile,
        subscription: userData.subscription,
        data: { folders, prompts, folderPrompts },
        ui: { ...currentState.ui, loading: false, error: null }
      });
    } catch (error) {
      console.error('Error initializing:', error);
      stateManager.setState({
        ui: { ...stateManager.getState().ui, loading: false, error: { message: error.message } }
      });
      throw error;
    }
  },

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
