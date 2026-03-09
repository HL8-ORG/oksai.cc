import process from "node:process";
import { defineConfig } from "@mikro-orm/postgresql";
import { TsMorphMetadataProvider } from "@mikro-orm/reflection";
import { TenantFilter } from "./filters/tenant.filter.js";

export default defineConfig({
  entities: [], // 实体由 MikroOrmDatabaseModule.forRoot() 的 entities 参数提供
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
  filters: {
    tenant: TenantFilter,
  },
});
