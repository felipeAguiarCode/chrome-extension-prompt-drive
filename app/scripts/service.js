// =========================
// Service - Utilities
// =========================

// Generate UUID v4
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// Validate license key
const validateLicenseKey = (key) => {
  return key === GOD_KEY_TO_PREMIUM_ACTIVATE;
};

// Parse and validate JSON
const parseJSON = (text) => {
  try {
    // Clean BOM and zero-width characters
    const cleanText = text.trim().replace(/^[\uFEFF\u200B-\u200D\u2060]/g, '');
    return JSON.parse(cleanText);
  } catch (error) {
    throw new Error(`Invalid JSON: ${error.message}`);
  }
};

// Validate folder/prompt name
const validateName = (name) => {
  if (!name || typeof name !== 'string') {
    return { valid: false, error: 'Nome é obrigatório' };
  }
  const trimmed = name.trim();
  if (trimmed.length === 0) {
    return { valid: false, error: 'Nome não pode estar vazio' };
  }
  if (trimmed.length > 100) {
    return { valid: false, error: 'Nome muito longo (máximo 100 caracteres)' };
  }
  return { valid: true };
};

// Copy to clipboard
const copyToClipboard = async (text) => {
  try {
    await navigator.clipboard.writeText(text);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Download JSON file
const downloadJSON = (data, filename) => {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Generate unique name with suffix
const generateUniqueName = (baseName, existingNames) => {
  if (!existingNames.includes(baseName)) {
    return baseName;
  }
  let counter = 1;
  let newName = `${baseName} (${counter})`;
  while (existingNames.includes(newName)) {
    counter++;
    newName = `${baseName} (${counter})`;
  }
  return newName;
};
