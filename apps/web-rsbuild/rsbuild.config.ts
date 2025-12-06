import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';
import { createRsbuildPlugin } from '@sqlite-bundle/sqlite-resolver/rsbuild';

const useSqliteCache = process.env.USE_SQLITE_CACHE === 'true';

export default defineConfig({
  plugins: [
    pluginReact(),
    // SQLite cache plugin (enabled via env var)
    ...(useSqliteCache ? [createRsbuildPlugin({ verbose: true })] : []),
  ],
  source: {
    entry: {
      index: './src/index.tsx',
    },
  },
  output: {
    distPath: {
      root: 'dist',
    },
  },
  performance: {
    buildCache: true,
  },
});
