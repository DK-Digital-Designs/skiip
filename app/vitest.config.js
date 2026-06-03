import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.js',
    include: ['src/**/*.test.{js,jsx}'],
    // Pin modifier flags off so tests stay deterministic regardless of a
    // developer's local .env (these are read dynamically at runtime).
    env: {
      VITE_PRODUCT_MODIFIERS_UI_ENABLED: 'false',
      VITE_PRODUCT_MODIFIER_EDITOR_UI_ENABLED: 'false',
      VITE_PRODUCT_MODIFIER_BACKEND_ENABLED: 'false',
      VITE_PRODUCT_MODIFIER_MOCK_DATA_ENABLED: 'false',
    },
  },
});
