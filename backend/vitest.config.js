import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    root: '.',
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
