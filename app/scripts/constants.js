// =========================
// Constants
// =========================

// Constants Application
// ====================================================
const FREE_MAX_PROMPTS = 5;
const PREMIUM_LICENSE_DURATION_DAYS = 30;

// Constants Supabase
// ====================================================
const SUPABASE_URL = 'https://etzlgzpyshwdijyucsog.supabase.co';
const SUPABASE_ANON_KEY = 'sb_publishable_j4obQ3BcN9ZF9DvwmBMCtg_UT4i6ZLu';

// Constants Sales Landing Page URL
// ====================================================
const SALES_LANDING_PAGE_URL = 'https://www.sample.com';

// Stripe Checkout (Payment Link)
// ====================================================
const STRIPE_CHECKOUT_BASE = 'https://buy.stripe.com/test_3cI8wR9h0c2haF9cWM4sE00';

// Plans (Free vs Pro) - used in modal
// ====================================================
const PLANS = {
  free: {
    name: 'Free',
    features: [
      { text: 'Limite de até 5 prompts', included: true },
      { text: 'Importar Pastas', included: false },
      { text: 'Exportar pastas', included: false }
    ]
  },
  pro: {
    name: 'Pro',
    features: [
      { text: 'Prompts ilimitados', included: true },
      { text: 'Importar Pastas', included: true },
      { text: 'Exportar pastas', included: true }
    ],
    ctaLabel: 'Garantir Premium Agora!'
  }
};

// Constants Storage Keys
// ====================================================
const STORAGE_KEY_ACCESS_TOKEN = 'USER_ACCESS_TOKEN';


// Constants Documents IDS
// ====================================================
const DOM_IDS = {
  // Auth
  authScreen: '#authScreen',
  appScreen: '#appScreen',
  loginView: '#loginView',
  signupView: '#signupView',
  redirectingView: '#redirectingView',
  loginForm: '#loginForm',
  signupForm: '#signupForm',
  btnShowSignup: '#btnShowSignup',
  btnShowLogin: '#btnShowLogin',
  // App
  btnCreateFolder: '#btnCreateFolder',
  btnCreatePrompt: '#btnCreatePrompt',
  btnLicenseKey: '#btnLicenseKey',
  btnImportFolder: '#btnImportFolder',
  btnLogout: '#btnLogout',
  promptCounter: '#promptCounter',
  userPlanBadge: '#userPlanBadge',
  folderDialog: '#folderDialog',
  promptDialog: '#promptDialog',
  promptEditDialog: '#promptEditDialog',
  confirmDeletePromptDialog: '#confirmDeletePromptDialog',
  deleteFolderDialog: '#deleteFolderDialog',
  editFolderDialog: '#editFolderDialog',
  licenseDialog: '#licenseDialog',
  importDialog: '#importDialog',
  foldersContainer: '#foldersContainer',
  mainContent: '#mainContent'
};

// Constants Toasts
// ====================================================
const TOAST_MESSAGES = {
  // Auth
  loginSuccess: 'Login realizado com sucesso',
  loginError: 'E-mail ou senha inválidos',
  signupSuccess: 'Conta criada com sucesso! Faça login para continuar',
  signupError: 'Erro ao criar conta',
  authError: 'Erro de autenticação',
  sessionExpired: 'Sessão expirada. Faça login novamente',
  // Folders
  folderCreated: 'Pasta criada com sucesso',
  folderUpdated: 'Pasta atualizada com sucesso',
  folderError: 'Erro ao criar pasta',
  folderDeleted: 'Pasta removida com sucesso',
  folderDeleteError: 'Erro ao remover pasta',
  folderNameMismatch: 'O nome digitado não confere com o nome da pasta',
  folderDuplicateName: 'Já existe uma pasta com esse nome',
  // Prompts
  promptCreated: 'Prompt criado com sucesso',
  promptUpdated: 'Prompt atualizado com sucesso',
  promptDeleted: 'Prompt removido com sucesso',
  promptError: 'Erro ao processar prompt',
  promptDuplicateName: 'Já existe um prompt com esse nome nesta pasta',
  promptFolderError: 'A pasta selecionada não pertence ao seu usuário',
  // Limits
  limitReached: 'Limite do plano Free atingido (5 prompts)',
  premiumActivated: 'Premium ativado até',
  invalidKey: 'Chave inválida',
  alreadyPremium: 'Você já é premium',
  premiumFeature: 'Recurso Premium - Ative o Premium para usar esta funcionalidade',
  redirectingToCheckout: 'Redirecionando ao checkout...',
  // Share/Export/Import
  shareSuccess: 'Prompt copiado para a área de transferência!',
  shareError: 'Falha ao compartilhar prompt',
  exportSuccess: 'Pasta exportada com sucesso!',
  exportError: 'Erro ao exportar pasta',
  importSuccess: 'Importação concluída com sucesso',
  importError: 'Erro ao importar pasta - verifique o formato do JSON'
};
