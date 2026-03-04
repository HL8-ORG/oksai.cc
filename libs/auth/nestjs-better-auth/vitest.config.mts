import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: ["src/**/*.spec.ts", "src/**/*.integration.spec.ts", "src/**/*.e2e.spec.ts"],
    exclude: ["node_modules", "dist"],
    setupFiles: ["./test/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.spec.ts",
        "**/*.integration.spec.ts",
        "**/*.e2e.spec.ts",
        "**/*.d.ts",
        "src/index.ts",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ["verbose"],
  },
});
