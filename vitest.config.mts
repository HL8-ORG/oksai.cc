import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "libs/auth/**/*.spec.ts",
      "libs/auth/**/*.integration.spec.ts",
      "libs/database/**/*.spec.ts",
      "libs/shared/**/*.spec.ts",
      "apps/gateway/**/*.spec.ts",
    ],
    exclude: ["node_modules", "dist", "apps/web-admin/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      exclude: [
        "node_modules/**",
        "dist/**",
        "**/*.spec.ts",
        "**/*.integration.spec.ts",
        "**/*.d.ts",
        "apps/**",
      ],
    },
    testTimeout: 10000,
    hookTimeout: 10000,
    reporters: ["verbose"],
  },
});
