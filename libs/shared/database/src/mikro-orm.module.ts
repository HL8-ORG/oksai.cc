import process from "node:process";
import { DefaultLogger, type LoggerOptions } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { DynamicModule, Module } from "@nestjs/common";
import { pino } from "pino";
import * as databaseEntities from "./entities/index.js";

const isProduction = process.env.NODE_ENV === "production";
const shouldPrettyLog = process.env.LOG_PRETTY ? process.env.LOG_PRETTY === "true" : !isProduction;

const mikroOrmPino = pino({
  name: "oksai",
  level: process.env.LOG_LEVEL || "info",
  timestamp: pino.stdTimeFunctions.isoTime,
  transport: shouldPrettyLog
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
 * MikroORM 数据库模块配置选项
 */
export interface MikroOrmDatabaseModuleOptions {
  /**
   * 额外的实体类
   *
   * @description
   * 用于注册额外的 MikroORM 实体，例如 IAM、OAuth 等领域的实体。
   * 基础实体（OAuth + Webhook）已自动加载。
   *
   * @example
   * ```typescript
   * import { Tenant, User } from '@oksai/iam-infrastructure';
   *
   * MikroOrmDatabaseModule.forRoot({
   *   extraEntities: [Tenant, User]
   * })
   * ```
   */
  extraEntities?: Function[];
}

/**
 * MikroORM 数据库模块
 *
 * @description
 * 配置 MikroORM 数据库连接：
 * - 自动加载 database 包的实体（OAuth + Webhook）
 * - 支持通过 extraEntities 注册额外实体（如 IAM 实体）
 * - registerRequestContext: 为每个请求创建独立的 EntityManager
 * - 从环境变量读取数据库连接配置
 *
 * @example
 * ```typescript
 * // 基础用法（只使用 OAuth + Webhook 实体）
 * @Module({
 *   imports: [MikroOrmDatabaseModule.forRoot()]
 * })
 * export class AppModule {}
 *
 * // 高级用法（添加 IAM 实体）
 * import { Tenant, User, Session } from '@oksai/iam-infrastructure';
 *
 * @Module({
 *   imports: [
 *     MikroOrmDatabaseModule.forRoot({
 *       extraEntities: [Tenant, User, Session, Account, ApiKey]
 *     })
 *   ]
 * })
 * export class AppModule {}
 * ```
 *
 * 注意：此模块应在根模块（AppModule）中导入，且只导入一次
 */
@Module({})
export class MikroOrmDatabaseModule {
  /**
   * 注册 MikroORM 数据库模块
   *
   * @param options - 配置选项
   * @param options.extraEntities - 额外的实体类数组
   * @returns DynamicModule
   */
  static forRoot(options: MikroOrmDatabaseModuleOptions = {}): DynamicModule {
    return {
      module: MikroOrmDatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          useFactory: () => ({
            driver: PostgreSqlDriver,
            entities: [...Object.values(databaseEntities), ...(options.extraEntities || [])],
            registerRequestContext: true,
            dbName: process.env.DB_NAME || "oksai",
            host: process.env.DB_HOST || "localhost",
            port: Number(process.env.DB_PORT) || 5432,
            user: process.env.DB_USER || "oksai",
            password: process.env.DB_PASSWORD || "oksai_dev_password",
            debug: !isProduction,
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
    };
  }
}
