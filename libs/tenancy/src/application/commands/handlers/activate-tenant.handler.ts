import type { ICommandHandler } from "@oksai/cqrs";
import { NotFoundException } from "@oksai/exceptions";
import type { OksaiLoggerService } from "@oksai/logger";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { ActivateTenantCommand } from "../activate-tenant.command.js";

/**
 * 激活租户命令处理器
 */
export class ActivateTenantHandler implements ICommandHandler<ActivateTenantCommand, void> {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly logger: OksaiLoggerService
  ) {}

  async execute(command: ActivateTenantCommand): Promise<void> {
    this.logger.info("激活租户", { tenantId: command.tenantId });

    const tenantResult = await this.tenantRepository.findById(command.tenantId);

    if (tenantResult.isFail()) {
      throw tenantResult.error!;
    }

    const tenant = tenantResult.value as Tenant | null;
    if (!tenant) {
      throw NotFoundException.forEntity("Tenant", command.tenantId);
    }

    const result = tenant.activate();
    if (result.isFail()) {
      throw result.error!;
    }

    await this.tenantRepository.save(tenant);

    this.logger.info("租户激活成功", { tenantId: command.tenantId });
  }
}
