import process from "node:process";
import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { ThrottlerModule } from "@nestjs/throttler";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { AppController } from "./app.controller";
import { AppService } from "./app.service";
import { auth } from "./auth/auth";
import { AuthFeatureModule } from "./auth/auth.module";
import { UserController } from "./auth/user.controller";
import { CacheModule } from "./common/cache.module";
import { CacheMonitorController } from "./common/cache-monitor.controller";
import { CustomThrottlerGuard } from "./common/custom-throttler.guard";
import { HealthController } from "./health/health.controller";

/**
 * 根模块
 *
 * @description
 * 应用根模块，配置：
 * - ConfigModule: 全局配置管理
 * - ThrottlerModule: API 限流保护
 * - AuthModule: Better Auth 认证集成
 * - AuthFeatureModule: 认证功能模块（注册/登录/邮箱验证等）
 *
 * 注意：AuthModule 默认注册全局 AuthGuard
 * 所有路由默认需要认证，使用 @AllowAnonymous() 或 @OptionalAuth() 开放访问
 */
@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [".env.local", ".env"],
    }),

    // 限流保护
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 秒
        limit: 100, // 最多 100 次请求
      },
    ]),

    // Better Auth 集成
    AuthModule.forRoot({
      auth,
      // isGlobal: true (默认值，全局模块)
      // disableGlobalAuthGuard: false (默认值，启用全局守卫)
      // disableTrustedOriginsCors: false (默认值，自动配置 CORS)
    }),

    // 认证功能模块
    AuthFeatureModule,

    // 缓存模块（支持 Redis）
    CacheModule.forRoot({
      redisEnabled: process.env.REDIS_ENABLED === "true",
      redisUrl: process.env.REDIS_URL,
      max: 10000,
      ttl: 60000,
      enableStats: true,
    }),
  ],
  controllers: [AppController, HealthController, UserController, CacheMonitorController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: CustomThrottlerGuard,
    },
  ],
})
export class AppModule {}
