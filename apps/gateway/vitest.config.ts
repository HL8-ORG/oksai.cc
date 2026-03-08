import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    environment: "node",
    include: [
      "src/**/*.{spec,test}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
      "test/**/*.{spec,test,e2e-spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}",
    ],
    exclude: ["node_modules", "dist"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: ["node_modules", "dist", "**/*.spec.ts", "**/*.integration.spec.ts", "**/*.e2e-spec.ts"],
    },
    testTimeout: 30000,
    hookTimeout: 30000,
  },
});
