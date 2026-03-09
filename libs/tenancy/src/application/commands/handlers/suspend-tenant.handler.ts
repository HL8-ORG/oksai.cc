import type { ICommandHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { SuspendTenantCommand } from "../suspend-tenant.command.js";

/**
 * 停用租户命令处理器
 */
export class SuspendTenantHandler implements ICommandHandler<SuspendTenantCommand, Result<void, Error>> {
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(command: SuspendTenantCommand): Promise<Result<void, Error>> {
    const tenantResult = await this.tenantRepository.findById(command.tenantId);

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error!);
    }

    const tenant = tenantResult.value as Tenant | null;
    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    const result = tenant.suspend(command.reason);

    if (result.isFail()) {
      return Result.fail(result.error!);
    }

    await this.tenantRepository.save(tenant);

    return Result.ok(undefined);
  }
}
