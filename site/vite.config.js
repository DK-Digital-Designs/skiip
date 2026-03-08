import { defineConfig } from 'vite';
import { resolve } from 'path';

// Config for building ONLY the marketing site → skiip.co.uk
export default defineConfig({
    plugins: [],
    base: '/',
    build: {
        outDir: resolve(__dirname, 'dist-site'),
        emptyOutDir: true,
        rollupOptions: {
            input: {
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
