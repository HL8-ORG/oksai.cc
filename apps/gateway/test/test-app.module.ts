/**
 * E2E 测试用的 App 模块
 *
 * 禁用 AuthModule 的全局 AuthGuard，使用 MockAuthGuard 替代
 */

import process from "node:process";
import { MikroORM } from "@mikro-orm/core";
import { MiddlewareConsumer, Module } from "@nestjs/common";
import { APP_FILTER, APP_GUARD } from "@nestjs/core";
import { ApiExtraModels } from "@nestjs/swagger";
import { ThrottlerModule } from "@nestjs/throttler";
import { CacheModule, CacheMonitorController } from "@oksai/cache";
import { ConfigModule, ConfigService } from "@oksai/config";
import { MikroOrmDatabaseModule } from "@oksai/database";
import { GlobalExceptionFilter } from "@oksai/exceptions";
import { Account, ApiKey, DomainEventEntity, Session, Tenant, User } from "@oksai/iam-identity";
import { LoggerModule } from "@oksai/logger";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { AppController } from "../src/app.controller.js";
import { AppService } from "../src/app.service.js";
import { createAuthInstance } from "../src/auth/auth.js";
import { AuthFeatureModule } from "../src/auth/auth.module.js";
import { CustomThrottlerGuard } from "../src/common/custom-throttler.guard.js";
import { ExceptionExampleController } from "../src/examples/exception-example.controller.js";
import { HealthController } from "../src/health/health.controller.js";
import { RootController } from "../src/root.controller.js";
import { TenantMiddleware } from "../src/tenant/tenant.middleware.js";
import { TenantModule } from "../src/tenant/tenant.module.js";
import { MockAuthGuard } from "./utils/mock-auth.guard.js";

const isProduction = process.env.NODE_ENV === "production";
const shouldPrettyLog = process.env.LOG_PRETTY ? process.env.LOG_PRETTY === "true" : !isProduction;

/**
 * 测试用根模块
 *
 * 与 AppModule 的主要区别：
 * - 禁用 AuthModule 的全局 AuthGuard
 * - 使用 MockAuthGuard 替代
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    LoggerModule.forRoot({
      isGlobal: true,
      pretty: shouldPrettyLog,
      level: process.env.LOG_LEVEL || "info",
    }),

    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),

    MikroOrmDatabaseModule.forRoot({
      extraEntities: [Tenant, User, Session, Account, ApiKey, DomainEventEntity],
    }),

    // 禁用 AuthModule 的全局 AuthGuard
    AuthModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService, orm: MikroORM) => {
        const auth = createAuthInstance(orm, configService);
        return {
          auth,
          disableTrustedOriginsCors: true,
          disableGlobalAuthGuard: true, // 🔑 关键：禁用全局 AuthGuard
        };
      },
      inject: [ConfigService, MikroORM],
    }),

    AuthFeatureModule,

    CacheModule.forRoot({
      redisEnabled: process.env.REDIS_ENABLED === "true",
      redisUrl: process.env.REDIS_URL,
      max: 10000,
      ttl: 60000,
      enableStats: true,
    }),

    TenantModule,
  ],
  controllers: [
    RootController,
    AppController,
    HealthController,
    CacheMonitorController,
    ExceptionExampleController,
  ],
  providers: [
    AppService,
    MockAuthGuard, // 注册 MockAuthGuard
    {
      provide: APP_GUARD,
      useExisting: MockAuthGuard, // 使用 MockAuthGuard
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class TestAppModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(TenantMiddleware).forRoutes("*path");
  }
}
