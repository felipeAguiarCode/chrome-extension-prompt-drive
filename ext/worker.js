// =========================
// Background Worker
// =========================

// Background worker for Chrome Extension
// Currently empty - can be extended for background tasks if needed

chrome.runtime.onInstalled.addListener(() => {
  console.log('Prompt DRIVE installed');
});
