import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["e2e/scenarios/**/*.{test,spec}.{js,ts}"],
    testTimeout: 60000, // Longer timeout for integration tests with containers
    hookTimeout: 60000, // Longer timeout for setup/teardown
    setupFiles: [],
    teardownTimeout: 30000,
  },
});
