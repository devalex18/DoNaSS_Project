import { defineConfig } from 'vitest/config';
import dotenv from 'dotenv';

dotenv.config();

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      provider: 'v8',
      clean: false,
      reporter: ['text', 'html', 'json'],
      reportsDirectory: './coverage',
      reportOnFailure: true,
      include: ['src/**/*.ts'],
      exclude: ['src/server.ts', 'src/config/**', 'src/types/**'],
    },
  },
});