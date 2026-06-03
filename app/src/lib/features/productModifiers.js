function envFlag(name) {
  return String(import.meta.env[name] || '').toLowerCase() === 'true';
}

export const productModifiersUiEnabled = envFlag('VITE_PRODUCT_MODIFIERS_UI_ENABLED');
export const productModifierMockDataEnabled = envFlag('VITE_PRODUCT_MODIFIER_MOCK_DATA_ENABLED');
export const productModifierEditorUiEnabled = envFlag('VITE_PRODUCT_MODIFIER_EDITOR_UI_ENABLED');
export const productModifierBackendEnabled = envFlag('VITE_PRODUCT_MODIFIER_BACKEND_ENABLED');

export function areProductModifiersEnabled() {
  return productModifiersUiEnabled;
}

export function canUseMockProductModifiers() {
    return productModifiersUiEnabled && productModifierMockDataEnabled;
}

export function canUseRealProductModifiers() {
    return productModifiersUiEnabled && productModifierBackendEnabled;
}

export function canCheckoutConfiguredProductModifiers() {
    return canUseRealProductModifiers();
}

export function canShowProductModifierEditor() {
    return productModifiersUiEnabled && productModifierEditorUiEnabled;
}

export function canPersistProductModifierEditor() {
    return canShowProductModifierEditor() && productModifierBackendEnabled;
}
