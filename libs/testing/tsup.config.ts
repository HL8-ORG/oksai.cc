import type { Options } from "tsup";

const config: Options = {
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  clean: true,
  sourcemap: true,
  external: [
    // Workspace packages
    "@oksai/database",
    "@oksai/event-store",
    // NestJS microservices optional dependencies
    "@nestjs/microservices",
    "@nestjs/websockets",
    "@nestjs/platform-socket.io",
    "@grpc/grpc-js",
    "@grpc/proto-loader",
    "kafkajs",
    "mqtt",
    "nats",
    "amqplib",
    "amqp-connection-manager",
  ],
  tsconfig: "./tsconfig.build.json",
};

export default config;
