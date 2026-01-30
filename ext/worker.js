// =========================
// Background Worker
// =========================

// Background worker for Chrome Extension

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt DRIVE installed');
});

// Abrir sidepanel quando clicar no ícone da extensão
chrome.action.onClicked.addListener((tab) => {
  chrome.sidePanel.open({ windowId: tab.windowId });
});
