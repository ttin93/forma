// Builds the host-page snippet (dist/embed.js) as a self-contained IIFE
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    outDir: resolve(__dirname, 'dist'),
    emptyOutDir: false,
    lib: {
      entry: resolve(__dirname, 'src/index.ts'),
      name: 'FormaEmbed',
      fileName: () => 'embed.js',
      formats: ['iife'],
    },
    minify: 'esbuild',
    rollupOptions: {
      output: {
        inlineDynamicImports: true,
      },
    },
  },
  server: {
    port: 4500,
    root: resolve(__dirname, 'playground'),
  },
});
