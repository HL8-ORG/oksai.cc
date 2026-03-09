import type { ICommandHandler } from "@oksai/cqrs";
import { DomainException } from "@oksai/exceptions";
import type { OksaiLoggerService } from "@oksai/logger";
import type { ITenantRepository } from "../../../domain/index.js";
import { Tenant } from "../../../domain/index.js";
import { CreateTenantCommand } from "../create-tenant.command.js";

/**
 * 创建租户命令处理器
 */
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand, string> {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly logger: OksaiLoggerService
  ) {}

  async execute(command: CreateTenantCommand): Promise<string> {
    this.logger.info("创建租户", {
      slug: command.slug,
      plan: command.plan,
      ownerId: command.ownerId,
    });

    const existingResult = await this.tenantRepository.findBySlug(command.slug);

    if (existingResult.isFail()) {
      throw existingResult.error!;
    }

    const existing = existingResult.value;
    if (existing) {
      throw new DomainException("slug 已存在", "TENANT_SLUG_EXISTS", {
        context: { slug: command.slug },
      });
    }

    const result = Tenant.create({
      name: command.name,
      slug: command.slug,
      plan: command.plan,
      ownerId: command.ownerId,
      metadata: command.metadata,
    });

    if (result.isFail()) {
      this.logger.error("租户创建失败", {
        slug: command.slug,
        error: result.error?.message,
      });
      throw result.error!;
    }

    const tenant = result.value as Tenant;

    await this.tenantRepository.save(tenant);

    this.logger.info("租户创建成功", {
      tenantId: tenant.id.toString(),
      slug: tenant.slug,
    });

    return tenant.id.toString();
  }
}
