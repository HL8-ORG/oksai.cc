import type { ICommandHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository } from "../../../domain/index.js";
import { type Tenant, TenantQuota } from "../../../domain/index.js";
import { UpdateTenantQuotaCommand } from "../update-tenant-quota.command.js";

/**
 * 更新租户配额命令处理器
 */
export class UpdateTenantQuotaHandler
  implements ICommandHandler<UpdateTenantQuotaCommand, Result<void, Error>>
{
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(command: UpdateTenantQuotaCommand): Promise<Result<void, Error>> {
    const tenantResult = await this.tenantRepository.findById(command.tenantId);

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error!);
    }

    const tenant = tenantResult.value as Tenant | null;
    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    const newQuotaResult = TenantQuota.create({
      maxOrganizations: command.maxOrganizations,
      maxMembers: command.maxMembers,
      maxStorage: command.maxStorage,
    });

    if (newQuotaResult.isFail()) {
      return Result.fail(newQuotaResult.error!);
    }

    const result = tenant.updateQuota(newQuotaResult.value as TenantQuota);

    if (result.isFail()) {
      return Result.fail(result.error!);
    }

    await this.tenantRepository.save(tenant);

    return Result.ok(undefined);
  }
}
