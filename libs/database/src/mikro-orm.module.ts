import process from "node:process";
import { DefaultLogger, type LoggerOptions } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { Module } from "@nestjs/common";
import { pino } from "pino";
import * as entities from "./entities/index.js";

const mikroOrmPino = pino({
  name: "oksai",
  level: process.env.LOG_LEVEL || "info",
  transport:
    process.env.NODE_ENV !== "production"
      ? {
          target: "pino-pretty",
          options: {
            colorize: true,
            translateTime: "SYS:standard",
            singleLine: false,
            errorLikeObjectKeys: ["err", "error"],
            ignore: "pid,hostname",
          },
        }
      : undefined,
});

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
        loggerFactory: (options: LoggerOptions) =>
          new DefaultLogger({
            ...options,
            writer: (message: string) => {
              mikroOrmPino.info({ service: "oksai", module: "MikroORM" }, message);
            },
          }),
      }),
    }),
  ],
})
export class MikroOrmDatabaseModule {}
