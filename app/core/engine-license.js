// =========================
// Engine License - Activate Premium
// =========================

function handleActivatePremium(licenseKey) {
  if (!licenseKey || licenseKey.trim().length === 0) {
    engine.showToast(TOAST_MESSAGES.invalidKey);
    return { success: false, error: 'Chave não pode estar vazia' };
  }

  if (!validateLicenseKey(licenseKey.trim())) {
    engine.showToast(TOAST_MESSAGES.invalidKey);
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
  engine.showToast(`${TOAST_MESSAGES.premiumActivated} ${expiryDate}`);
  engine.closeDialog('licenseDialog');
  return { success: true };
}

Object.assign(engine, { handleActivatePremium });
