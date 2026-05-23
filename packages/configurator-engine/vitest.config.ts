import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['test/**/*.test.ts'],
    environment: 'node',
    resolveSnapshotPath: (testPath, snapExtension) =>
      testPath.replace('/test/', '/test/__snapshots__/') + snapExtension,
  },
  resolve: {
    alias: {
      '@forma/types': new URL('../../packages/types/src/index.ts', import.meta.url).pathname,
    },
  },
});
