/**
 * 租户事件消费者
 *
 * 消费租户领域事件，触发副作用（如发送通知、日志记录等）
 */

import type { TenantActivatedEvent } from "../../domain/events/tenant-activated.event.js";
import type { TenantCreatedEvent } from "../../domain/events/tenant-created.event.js";
import type { TenantQuotaUpdatedEvent } from "../../domain/events/tenant-quota-updated.event.js";
import type { TenantSuspendedEvent } from "../../domain/events/tenant-suspended.event.js";

/**
 * 租户事件消费者
 */
export class TenantEventConsumer {
  /**
   * 消费租户创建事件
   *
   * 副作用：
   * - 记录审计日志
   * - 发送欢迎邮件
   * - 创建租户的默认资源
   */
  async consumeTenantCreated(event: TenantCreatedEvent): Promise<void> {
    console.log(`[TenantEventConsumer] 消费租户创建事件:`, {
      tenantId: event.aggregateId.toString(),
      name: event.payload.name,
      slug: event.payload.slug,
      plan: event.payload.plan,
      ownerId: event.payload.ownerId,
      occurredAt: event.occurredAt,
    });

    // TODO: 实现具体副作用
    // 1. 记录审计日志
    // 2. 发送欢迎邮件
    // 3. 创建默认资源（如默认组织）
  }

  /**
   * 消费租户激活事件
   *
   * 副作用：
   * - 记录审计日志
   * - 发送激活通知
   * - 启动计费
   */
  async consumeTenantActivated(event: TenantActivatedEvent): Promise<void> {
    console.log(`[TenantEventConsumer] 消费租户激活事件:`, {
      tenantId: event.aggregateId.toString(),
      activatedAt: event.payload.activatedAt,
    });

    // TODO: 实现具体副作用
    // 1. 记录审计日志
    // 2. 发送激活通知
    // 3. 启动计费
  }

  /**
   * 消费租户停用事件
   *
   * 副作用：
   * - 记录审计日志
   * - 发送停用通知
   * - 暂停计费
   */
  async consumeTenantSuspended(event: TenantSuspendedEvent): Promise<void> {
    console.log(`[TenantEventConsumer] 消费租户停用事件:`, {
      tenantId: event.aggregateId.toString(),
      reason: event.payload.reason,
      suspendedAt: event.payload.suspendedAt,
    });

    // TODO: 实现具体副作用
    // 1. 记录审计日志
    // 2. 发送停用通知
    // 3. 暂停计费
  }

  /**
   * 消费配额更新事件
   *
   * 副作用：
   * - 记录审计日志
   * - 发送配额变更通知
   */
  async consumeTenantQuotaUpdated(event: TenantQuotaUpdatedEvent): Promise<void> {
    console.log(`[TenantEventConsumer] 消费配额更新事件:`, {
      tenantId: event.aggregateId.toString(),
      oldQuota: event.payload.oldQuota,
      newQuota: event.payload.newQuota,
    });

    // TODO: 实现具体副作用
    // 1. 记录审计日志
    // 2. 发送配额变更通知
  }
}
