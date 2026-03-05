import process from "node:process";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema/index.js";

const connectionString =
  process.env.DATABASE_URL || "postgresql://oksai:oksai_dev_password@localhost:5432/oksai";

const client = postgres(connectionString);

export const db = drizzle(client, { schema });

export * from "./entities/index.js";
export * from "./events/index.js";
export { default as mikroOrmConfig } from "./mikro-orm.config.js";
export { MikroOrmDatabaseModule } from "./mikro-orm.module.js";
export * from "./schema/index.js";
