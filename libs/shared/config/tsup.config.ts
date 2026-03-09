import type { Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: ["@oksai/domain-core"],
  tsconfig: "./tsconfig.build.json",
};

export default config;
