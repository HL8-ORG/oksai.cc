import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "libs/auth/**/*.spec.ts",
      "libs/auth/**/*.integration.spec.ts",
      "libs/shared/cache/**/*.spec.ts",
      "libs/database/**/*.spec.ts",
      "libs/shared/**/*.spec.ts",
      "apps/gateway/**/*.spec.ts",
    ],
    // 严格排除 node_modules，避免扫描模板文件和编译产物
    exclude: [
      "**/node_modules/**",
      "**/dist/**",
      "**/.output/**",
      "apps/web-admin/**",
      "**/*.d.ts",
    ],
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
