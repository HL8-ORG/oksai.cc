/**
 * 租户停用事件
 *
 * 当租户从 ACTIVE 状态停用为 SUSPENDED 状态时触发。
 */
import { DomainEvent, UniqueEntityID } from "@oksai/domain-core";

/**
 * 租户停用事件负载
 */
export interface TenantSuspendedPayload {
  tenantId: string;
  reason: string;
  suspendedAt: Date;
}

/**
 * 租户停用事件
 */
export class TenantSuspendedEvent extends DomainEvent<TenantSuspendedPayload> {
  constructor(payload: TenantSuspendedPayload, aggregateId: UniqueEntityID) {
    super({
      eventName: "tenant.suspended",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
