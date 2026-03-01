import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/iframe'),
  base: '/checkout/embed/',
  build: {
    outDir: resolve(__dirname, '../checkout-backend/src/main/resources/static/checkout/embed'),
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/iframe/index.html'),
      output: {
        entryFileNames: 'checkout-form.js',
        chunkFileNames: 'checkout-form-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});
