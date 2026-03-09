import type { ICommandHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository } from "../../../domain/index.js";
import { type Tenant, TenantPlan } from "../../../domain/index.js";
import { ChangeTenantPlanCommand } from "../change-tenant-plan.command.js";

/**
 * 变更租户套餐命令处理器
 */
export class ChangeTenantPlanHandler
  implements ICommandHandler<ChangeTenantPlanCommand, Result<void, Error>>
{
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(command: ChangeTenantPlanCommand): Promise<Result<void, Error>> {
    const tenantResult = await this.tenantRepository.findById(command.tenantId);

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error!);
    }

    const tenant = tenantResult.value as Tenant | null;
    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    const newPlanResult = TenantPlan.create(command.newPlan);

    if (newPlanResult.isFail()) {
      return Result.fail(newPlanResult.error!);
    }

    const newPlan = newPlanResult.value as TenantPlan;

    const result = tenant.changePlan(newPlan);

    if (result.isFail()) {
      return Result.fail(result.error!);
    }

    await this.tenantRepository.save(tenant);

    return Result.ok(undefined);
  }
}
