// Builds the iframe SPA (dist/iframe/)
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: resolve(__dirname, 'src/iframe-app'),
  build: {
    outDir: resolve(__dirname, 'dist/iframe'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@forma/types': resolve(__dirname, '../../packages/types/src/index.ts'),
      '@forma/configurator-engine': resolve(__dirname, '../../packages/configurator-engine/src/index.ts'),
    },
  },
  server: {
    port: 4501,
  },
});
