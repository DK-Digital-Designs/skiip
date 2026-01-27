import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        // React app entry point
        app: resolve(__dirname, 'app.html'),
        // Static marketing pages
        main: resolve(__dirname, 'index.html'),
        'how-it-works': resolve(__dirname, 'how-it-works.html'),
        'for-vendors': resolve(__dirname, 'for-vendors.html'),
        'for-organisers': resolve(__dirname, 'for-organisers.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        contact: resolve(__dirname, 'contact.html'),
      },
    },
  },
});
