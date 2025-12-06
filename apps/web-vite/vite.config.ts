import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Note: SQLite resolver plugin is tested separately via resolution-bench.ts
// due to jiti loader incompatibility with bun:sqlite

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
  },
  cacheDir: '.vite',
});
