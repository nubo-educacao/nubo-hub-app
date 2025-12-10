import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, '..'), // Explicitly set root to project root
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '../'),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: [path.resolve(__dirname, 'setup.ts')],
    // Explicitly scope to unit and integration folders to avoid E2E
    include: ['tests/unit/**/*.{test,spec}.{ts,tsx}', 'tests/integration/**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/e2e/**', 'tests/e2e/**'], // Redundant but safe
  },
});
