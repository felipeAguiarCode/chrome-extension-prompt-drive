// =========================
// Engine License - Stripe Checkout
// =========================

function openStripeCheckout() {
  const state = stateManager.getState();
  const userId = state.user?.id;
  if (!userId) {
    engine.showToast(TOAST_MESSAGES.authError);
    return;
  }
  const url = `${STRIPE_CHECKOUT_BASE}?client_reference_id=${encodeURIComponent(userId)}`;
  window.open(url, '_blank');
  engine.closeDialog('licenseDialog');
  engine.showToast(TOAST_MESSAGES.redirectingToCheckout);
}

Object.assign(engine, { openStripeCheckout });
