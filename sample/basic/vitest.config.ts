import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    timeout: 60000,
    hookTimeout: 60000,
    testTimeout: 60000,
  },
});