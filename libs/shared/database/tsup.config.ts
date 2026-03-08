import type { Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    "@oksai/kernel",
    "@oksai/iam-infrastructure",
    "@mikro-orm/core",
    "@mikro-orm/nestjs",
    "@mikro-orm/reflection",
    "@nestjs/common",
    "@nestjs/core",
    "@nestjs/microservices",
    "ts-morph",
    "@ts-morph/common",
    "nats",
    "kafkajs",
    "mqtt",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "amqplib",
    "redis",
  ],
  tsconfig: "./tsconfig.build.json",
};

export default config;
