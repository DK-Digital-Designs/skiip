import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// Custom plugin to handle SPA routing for /app/* and /
const spaFallbackPlugin = () => ({
  name: 'spa-fallback',
  configureServer(server) {
    server.middlewares.use((req, res, next) => {
      // Ignore Vite internal requests
      if (req.url.startsWith('/@') || req.url.startsWith('/node_modules/')) {
        return next();
      }

      // Root redirects to site/index.html
      if (req.url === '/' || req.url === '/index.html') {
        req.url = '/site/index.html';
      }
      // App redirects to app/index.html
      else if (req.url.startsWith('/app') && !req.url.includes('.')) {
        req.url = '/app/index.html';
      }
      // Known site pages
      else {
        const sitePages = ['/how-it-works', '/for-vendors', '/for-organisers', '/pricing', '/contact'];
        // Remove trailing slash if any
        const cleanUrl = req.url.replace(/\/$/, '');
        if (sitePages.includes(cleanUrl)) {
          req.url = `/site${cleanUrl}.html`;
        }
      }
      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), spaFallbackPlugin()],
  base: './',
  build: {
    rollupOptions: {
      input: {
        app: resolve(__dirname, 'app/index.html'),
        main: resolve(__dirname, 'site/index.html'),
        'how-it-works': resolve(__dirname, 'site/how-it-works.html'),
        'for-vendors': resolve(__dirname, 'site/for-vendors.html'),
        'for-organisers': resolve(__dirname, 'site/for-organisers.html'),
        pricing: resolve(__dirname, 'site/pricing.html'),
        contact: resolve(__dirname, 'site/contact.html'),
      },
    },
  },
});
