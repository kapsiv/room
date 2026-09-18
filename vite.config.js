import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        notFound: resolve(__dirname, '404.html'),
        blog: resolve(__dirname, 'blog.html'),
        hide: resolve(__dirname, 'hide.html'),
      },
    },
  },
});
