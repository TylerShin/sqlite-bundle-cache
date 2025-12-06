import { defineConfig } from '@rsbuild/core';
import { pluginReact } from '@rsbuild/plugin-react';

// Note: SQLite resolver plugin is tested separately via resolution-bench.ts
// due to jiti loader incompatibility with bun:sqlite

export default defineConfig({
  plugins: [pluginReact()],
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
