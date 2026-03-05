import { type Options } from "tsup";

const config: Options = {
	entry: ["src/index.ts"],
	format: ["esm"],
	dts: true,
	clean: true,
	sourcemap: true,
	external: ["@oksai/kernel"],
	// 使用专门的构建配置
	tsconfig: "./tsconfig.build.json",
};

export default config;
