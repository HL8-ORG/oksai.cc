import process from "node:process";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Module } from "@nestjs/common";
import * as entities from "./entities/index.js";

/**
 * MikroORM 数据库模块
 *
 * @description
 * 配置 MikroORM 数据库连接：
 * - 自动加载所有实体
 * - registerRequestContext: 为每个请求创建独立的 EntityManager
 * - 从环境变量读取数据库连接配置
 *
 * 注意：此模块应在根模块（AppModule）中导入，且只导入一次
 */
@Module({
  imports: [
    MikroOrmModule.forRootAsync({
      useFactory: () => ({
        driver: PostgreSqlDriver,
        entities: Object.values(entities),
        registerRequestContext: true,
        dbName: process.env.DB_NAME || "oksai",
        host: process.env.DB_HOST || "localhost",
        port: Number(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || "oksai",
        password: process.env.DB_PASSWORD || "oksai_dev_password",
        debug: process.env.NODE_ENV === "development",
      }),
    }),
  ],
})
export class MikroOrmDatabaseModule {}
