function envFlag(name) {
  return String(import.meta.env[name] || '').toLowerCase() === 'true';
}

export const productModifiersUiEnabled = envFlag('VITE_PRODUCT_MODIFIERS_UI_ENABLED');
export const productModifierMockDataEnabled = envFlag('VITE_PRODUCT_MODIFIER_MOCK_DATA_ENABLED');
export const productModifierEditorUiEnabled = envFlag('VITE_PRODUCT_MODIFIER_EDITOR_UI_ENABLED');

export function areProductModifiersEnabled() {
  return productModifiersUiEnabled;
}

export function canUseMockProductModifiers() {
  return productModifiersUiEnabled && productModifierMockDataEnabled;
}

export function canShowProductModifierEditor() {
  return productModifiersUiEnabled && productModifierEditorUiEnabled;
}
