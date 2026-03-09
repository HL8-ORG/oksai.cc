import process from "node:process";
import { DefaultLogger, type LoggerOptions } from "@mikro-orm/core";
import { MikroOrmModule } from "@mikro-orm/nestjs";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { DynamicModule, Module } from "@nestjs/common";
import { pino } from "pino";

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
   * 实体类数组
   *
   * @description
   * 用于注册所有 MikroORM 实体，包括 IAM、OAuth、Webhook 等领域的实体。
   *
   * @example
   * ```typescript
   * import {
   *   Tenant, User, Session, Account, ApiKey,
   *   OAuthClient, OAuthAccessToken,
   *   Webhook, WebhookDelivery
   * } from '@oksai/iam-identity';
   *
   * MikroOrmDatabaseModule.forRoot({
   *   entities: [
   *     // IAM 实体
   *     Tenant, User, Session, Account, ApiKey,
   *     // OAuth 实体
   *     OAuthClient, OAuthAccessToken,
   *     // Webhook 实体
   *     Webhook, WebhookDelivery
   *   ]
   * })
   * ```
   */
  entities: Function[];
}

/**
 * MikroORM 数据库模块
 *
 * @description
 * 配置 MikroORM 数据库连接：
 * - 通过 entities 参数注册所有实体
 * - registerRequestContext: 为每个请求创建独立的 EntityManager
 * - 从环境变量读取数据库连接配置
 *
 * @example
 * ```typescript
 * import {
 *   Tenant, User, Session, Account, ApiKey,
 *   OAuthClient, OAuthAccessToken, OAuthRefreshToken,
 *   Webhook, WebhookDelivery
 * } from '@oksai/iam-identity';
 *
 * @Module({
 *   imports: [
 *     MikroOrmDatabaseModule.forRoot({
 *       entities: [
 *         // IAM 实体
 *         Tenant, User, Session, Account, ApiKey,
 *         // OAuth 实体
 *         OAuthClient, OAuthAccessToken, OAuthRefreshToken,
 *         // Webhook 实体
 *         Webhook, WebhookDelivery
 *       ]
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
   * @param options.entities - 实体类数组（必需）
   * @returns DynamicModule
   */
  static forRoot(options: MikroOrmDatabaseModuleOptions): DynamicModule {
    return {
      module: MikroOrmDatabaseModule,
      imports: [
        MikroOrmModule.forRootAsync({
          useFactory: () => ({
            driver: PostgreSqlDriver,
            entities: options.entities,
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
