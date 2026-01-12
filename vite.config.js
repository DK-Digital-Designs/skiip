import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        'how-it-works': resolve(__dirname, 'how-it-works.html'),
        'for-vendors': resolve(__dirname, 'for-vendors.html'),
        'for-organisers': resolve(__dirname, 'for-organisers.html'),
        pricing: resolve(__dirname, 'pricing.html'),
        contact: resolve(__dirname, 'contact.html'),
        'app-home': resolve(__dirname, 'app/index.html'),
        'app-menu': resolve(__dirname, 'app/menu.html'),
        'app-queue': resolve(__dirname, 'app/queue.html'),
        'app-orders': resolve(__dirname, 'app/orders.html'),
        vendor: resolve(__dirname, 'vendor/index.html'),
        admin: resolve(__dirname, 'admin/index.html'),
      },
    },
  },
});
