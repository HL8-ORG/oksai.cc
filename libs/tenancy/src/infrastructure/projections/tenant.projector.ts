/**
 * 租户投影器
 *
 * 监听租户领域事件，更新读模型
 */

import type { TenantActivatedEvent } from "../../domain/events/tenant-activated.event.js";
import type { TenantCreatedEvent } from "../../domain/events/tenant-created.event.js";
import type { TenantQuotaUpdatedEvent } from "../../domain/events/tenant-quota-updated.event.js";
import type { TenantSuspendedEvent } from "../../domain/events/tenant-suspended.event.js";

/**
 * 租户读模型
 */
export interface TenantReadModel {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  ownerId: string;
  quota: {
    maxOrganizations: number;
    maxMembers: number;
    maxStorage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 租户投影器
 *
 * 负责将领域事件转换为读模型
 */
export class TenantProjector {
  private readonly readModels: Map<string, TenantReadModel> = new Map();

  /**
   * 处理租户创建事件
   */
  async handleTenantCreated(event: TenantCreatedEvent): Promise<void> {
    const readModel: TenantReadModel = {
      id: event.aggregateId.toString(),
      name: event.payload.name,
      slug: event.payload.slug,
      plan: event.payload.plan,
      status: "PENDING",
      ownerId: event.payload.ownerId,
      quota: {
        maxOrganizations: 1,
        maxMembers: 5,
        maxStorage: 1073741824, // 1GB
      },
      createdAt: event.occurredAt,
      updatedAt: event.occurredAt,
    };

    this.readModels.set(readModel.id, readModel);
    console.log(`[TenantProjector] 租户创建投影已更新: ${readModel.id}`);
  }

  /**
   * 处理租户激活事件
   */
  async handleTenantActivated(event: TenantActivatedEvent): Promise<void> {
    const readModel = this.readModels.get(event.aggregateId.toString());
    if (readModel) {
      readModel.status = "ACTIVE";
      readModel.updatedAt = event.occurredAt;
      console.log(`[TenantProjector] 租户激活投影已更新: ${readModel.id}`);
    }
  }

  /**
   * 处理租户停用事件
   */
  async handleTenantSuspended(event: TenantSuspendedEvent): Promise<void> {
    const readModel = this.readModels.get(event.aggregateId.toString());
    if (readModel) {
      readModel.status = "SUSPENDED";
      readModel.updatedAt = event.occurredAt;
      console.log(`[TenantProjector] 租户停用投影已更新: ${readModel.id}`);
    }
  }

  /**
   * 处理配额更新事件
   */
  async handleTenantQuotaUpdated(event: TenantQuotaUpdatedEvent): Promise<void> {
    const readModel = this.readModels.get(event.aggregateId.toString());
    if (readModel) {
      readModel.quota = {
        maxOrganizations: event.payload.newQuota.maxOrganizations,
        maxMembers: event.payload.newQuota.maxMembers,
        maxStorage: event.payload.newQuota.maxStorage,
      };
      readModel.updatedAt = event.occurredAt;
      console.log(`[TenantProjector] 租户配额投影已更新: ${readModel.id}`);
    }
  }

  /**
   * 获取读模型
   */
  getReadModel(id: string): TenantReadModel | undefined {
    return this.readModels.get(id);
  }
}
