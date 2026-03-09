import { Global, Module } from "@nestjs/common";
import { TenantContextService } from "./adapters/tenant-context.service.js";
import { TenantGuard } from "./adapters/tenant-guard.js";
import { MikroOrmTenantRepository } from "./persistence/mikro-orm-tenant.repository.js";

@Global()
@Module({
  providers: [
    MikroOrmTenantRepository,
    TenantContextService,
    TenantGuard,
    {
      provide: "ITenantRepository",
      useExisting: MikroOrmTenantRepository,
    },
  ],
  exports: [MikroOrmTenantRepository, TenantContextService, TenantGuard, "ITenantRepository"],
})
export class TenancyModule {}
