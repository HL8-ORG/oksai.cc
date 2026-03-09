/**
 * 租户应用服务
 *
 * 编排租户相关的复杂业务流程
 */

import { Result } from "@oksai/domain-core";
import { Tenant } from "../../domain/model/tenant.aggregate.js";
import type { INotificationPort } from "../../domain/ports/secondary/notification.port.js";
import type { ITenantRepository } from "../../domain/repositories/tenant.repository.js";

export interface CreateTenantWithNotificationInput {
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  ownerId: string;
  ownerEmail: string;
  metadata?: Record<string, unknown>;
}

/**
 * 租户应用服务
 *
 * 处理跨边界的业务逻辑和编排
 */
export class TenantApplicationService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly notificationPort: INotificationPort
  ) {}

  /**
   * 创建租户并发送通知
   *
   * @param input - 创建输入
   * @returns 创建结果
   */
  async createTenantWithNotification(input: CreateTenantWithNotificationInput): Promise<Result<Tenant>> {
    // 1. 创建租户
    const tenantResult = Tenant.create({
      name: input.name,
      slug: input.slug,
      plan: input.plan,
      ownerId: input.ownerId,
      metadata: input.metadata,
    });

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error!);
    }

    const tenant = tenantResult.value as Tenant;

    // 2. 保存租户
    const saveResult = await this.tenantRepository.save(tenant);
    if (saveResult.isFail()) {
      return Result.fail(saveResult.error!);
    }

    // 3. 发送欢迎邮件
    await this.notificationPort.send({
      tenantId: tenant.id.toString(),
      type: "email",
      recipient: input.ownerEmail,
      subject: "欢迎加入 Oksai",
      content: `您的租户 ${input.name} 已创建成功！`,
      metadata: {
        tenantSlug: input.slug,
        plan: input.plan,
      },
    });

    return Result.ok(tenant);
  }
}
