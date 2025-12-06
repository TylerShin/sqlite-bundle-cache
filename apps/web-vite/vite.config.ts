import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { createVitePlugin } from '@sqlite-bundle/sqlite-resolver/vite';

const useSqliteCache = process.env.USE_SQLITE_CACHE === 'true';

export default defineConfig({
  plugins: [
    react(),
    // SQLite cache plugin (enabled via env var)
    ...(useSqliteCache ? [createVitePlugin({ verbose: true })] : []),
  ],
  build: {
    outDir: 'dist',
  },
  cacheDir: '.vite',
});
