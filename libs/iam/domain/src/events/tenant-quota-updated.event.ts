/**
 * 租户配额更新事件
 *
 * 当租户配额被更新时触发。
 */
import { DomainEvent, UniqueEntityID } from "@oksai/kernel";
import type { TenantQuotaProps } from "../tenant/tenant-quota.vo.js";

/**
 * 租户配额更新事件负载
 */
export interface TenantQuotaUpdatedPayload {
  tenantId: string;
  oldQuota: TenantQuotaProps;
  newQuota: TenantQuotaProps;
}

/**
 * 租户配额更新事件
 */
export class TenantQuotaUpdatedEvent extends DomainEvent<TenantQuotaUpdatedPayload> {
  constructor(payload: TenantQuotaUpdatedPayload, aggregateId: UniqueEntityID) {
    super({
      eventName: "tenant.quota_updated",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
