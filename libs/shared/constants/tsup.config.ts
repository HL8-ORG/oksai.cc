import { defineConfig } from "tsup";

export default defineConfig({
  clean: true,
  dts: false,
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  minify: false,
  shims: true,
  sourcemap: true,
  splitting: false,
  target: "es2022",
  treeshake: false,
});
