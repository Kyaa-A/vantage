import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts'],
    globals: true,
    include: ['src/**/*.test.{ts,tsx}', 'src/**/__tests__/**/*.{ts,tsx}', 'src/components/**/*.test.{ts,tsx}', 'src/components/**/__tests__/**/*.{ts,tsx}', 'src/hooks/**/*.test.{ts,tsx}', 'src/hooks/**/__tests__/**/*.{ts,tsx}', 'src/**/validation/**/*.test.{ts,tsx}', '**/__tests__/**/*.{ts,tsx}'],
  },
});


