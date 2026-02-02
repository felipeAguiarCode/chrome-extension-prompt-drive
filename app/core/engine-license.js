// =========================
// Engine License - Activate Premium
// =========================

async function handleActivatePremium(licenseKey) {
  if (!licenseKey || licenseKey.trim().length === 0) {
    engine.showToast(TOAST_MESSAGES.invalidKey);
    return { success: false, error: 'Chave não pode estar vazia' };
  }

  const result = await api.activateLicenseKey({
    userId: stateManager.getState().user.id,
    licenseKey: licenseKey.trim()
  });

  if (!result.success) {
    engine.showToast(TOAST_MESSAGES.invalidKey);
    return { success: false, error: TOAST_MESSAGES.invalidKey };
  }

  const state = stateManager.getState();
  const expiry = result.expiry != null
    ? result.expiry
    : Date.now() + (PREMIUM_LICENSE_DURATION_DAYS * 24 * 60 * 60 * 1000);

  stateManager.setState({
    user: {
      ...state.user,
      plan: 'premium',
      licenseKey: licenseKey.trim(),
      licenseExpiry: expiry,
      updatedAt: Date.now()
    }
  });

  const expiryDate = new Date(expiry).toLocaleDateString('pt-BR');
  engine.showToast(`${TOAST_MESSAGES.premiumActivated} ${expiryDate}`);
  engine.closeDialog('licenseDialog');
  return { success: true };
}

Object.assign(engine, { handleActivatePremium });
