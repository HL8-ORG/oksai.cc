import { type Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  tsconfig: "./tsconfig.build.json",
};

export default config;
