/**
 * 租户管理模块
 *
 * @description
 * 提供租户管理的完整功能，包括：
 * - 租户 CRUD 操作
 * - 配额检查（QuotaGuard）
 * - 租户上下文服务（TenantContextService）
 */

import { Module, Global } from "@nestjs/common";
import { AsyncLocalStorageProvider, TenantContextService } from "@oksai/context";
import { TenantController } from "./tenant.controller.js";
import { QuotaGuard } from "./guards/quota.guard.js";
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
  ],
  exports: [
    TenantService,
    QuotaGuard,
    AsyncLocalStorageProvider,
    TenantContextService,
  ],
})
export class TenantModule {}
