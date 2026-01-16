// =========================
// Constants
// =========================

const GOD_KEY_TO_PREMIUM_ACTIVATE = 'Kjajhist#@123';
const FREE_MAX_PROMPTS = 5;
const PREMIUM_LICENSE_DURATION_DAYS = 30;

const SALES_LANDING_PAGE_URL = 'https://www.sample.com';

const DOM_IDS = {
  btnCreateFolder: '#btnCreateFolder',
  btnCreatePrompt: '#btnCreatePrompt',
  btnLicenseKey: '#btnLicenseKey',
  btnImportFolder: '#btnImportFolder',
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

const TOAST_MESSAGES = {
  folderCreated: 'Pasta criada com sucesso',
  folderUpdated: 'Pasta atualizada com sucesso',
  folderError: 'Erro ao criar pasta',
  promptCreated: 'Prompt criado com sucesso',
  promptUpdated: 'Prompt atualizado com sucesso',
  promptDeleted: 'Prompt removido com sucesso',
  promptError: 'Erro ao processar prompt',
  folderDeleted: 'Pasta removida com sucesso',
  folderDeleteError: 'Erro ao remover pasta',
  folderNameMismatch: 'O nome digitado não confere com o nome da pasta',
  limitReached: 'Limite do plano Free atingido (5 prompts)',
  premiumActivated: 'Premium ativado até',
  invalidKey: 'Chave inválida',
  premiumFeature: 'Recurso Premium - Ative o Premium para usar esta funcionalidade',
  shareSuccess: 'Prompt copiado para a área de transferência!',
  shareError: 'Falha ao compartilhar prompt',
  exportSuccess: 'Pasta exportada com sucesso!',
  exportError: 'Erro ao exportar pasta',
  importSuccess: 'Importação concluída com sucesso',
  importError: 'Erro ao importar pasta - verifique o formato do JSON'
};
