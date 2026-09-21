import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  base: './',
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        journal: resolve(__dirname, 'journal/index.html'),
      },
    },
  },
});
