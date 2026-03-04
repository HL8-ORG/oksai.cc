import process from "node:process";
import { defineConfig } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";

export default defineConfig({
  entities: ["./dist/entities/**/*.js"],
  entitiesTs: ["./src/entities/**/*.ts"],
  dbName: process.env.DB_NAME || "oksai",
  host: process.env.DB_HOST || "localhost",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "oksai",
  password: process.env.DB_PASSWORD || "oksai_dev_password",
  debug: process.env.NODE_ENV === "development",
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: "./dist/migrations",
    pathTs: "./src/migrations",
    glob: "!(*.d).{js,ts}",
  },
});
