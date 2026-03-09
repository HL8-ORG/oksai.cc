/**
 * 租户管理模块
 *
 * @description
 * 提供租户管理的完整功能，包括：
 * - 租户 CRUD 操作
 * - 配额检查（QuotaGuard）
 * - 租户上下文服务（TenantContextService）
 * - 租户识别中间件（TenantMiddleware）
 */

import { Global, MiddlewareConsumer, Module, NestModule } from "@nestjs/common";
import { AsyncLocalStorageProvider, TenantContextService } from "@oksai/context";
import { QuotaGuard } from "./guards/quota.guard.js";
import { TenantController } from "./tenant.controller.js";
import { TenantMiddleware } from "./tenant.middleware.js";
import { TenantService } from "./tenant.service.js";

@Global()
@Module({
  controllers: [TenantController],
  providers: [
    // 提供租户上下文服务（全局可用）
    {
      provide: AsyncLocalStorageProvider,
      useFactory: () => new AsyncLocalStorageProvider(),
    },
    {
      provide: TenantContextService,
      useFactory: (provider: AsyncLocalStorageProvider) => new TenantContextService(provider),
      inject: [AsyncLocalStorageProvider],
    },
    TenantService,
    QuotaGuard,
    TenantMiddleware,
  ],
  exports: [TenantService, QuotaGuard, AsyncLocalStorageProvider, TenantContextService],
})
export class TenantModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(TenantMiddleware)
      .exclude(
        "health",
        "auth/(.*)",
        "api/health",
        "api/auth/login",
        "api/auth/register",
        "api/auth/callback",
        "api/admin/tenants" // 管理员接口不需要租户上下文
      )
      .forRoutes("*");
  }
}
