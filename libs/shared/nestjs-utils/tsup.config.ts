import { defineConfig, type Options } from "tsup";

const config: Options = {
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
  external: ["@nestjs/common", "@nestjs/core", "@nestjs/swagger"],
};

export default defineConfig(config);
