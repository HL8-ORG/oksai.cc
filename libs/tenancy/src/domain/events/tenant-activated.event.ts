/**
 * 租户激活事件
 *
 * 当租户从 PENDING 状态激活为 ACTIVE 状态时触发。
 */
import { DomainEvent, UniqueEntityID } from "@oksai/domain-core";

/**
 * 租户激活事件负载
 */
export interface TenantActivatedPayload {
  tenantId: string;
  activatedAt: Date;
}

/**
 * 租户激活事件
 */
export class TenantActivatedEvent extends DomainEvent<TenantActivatedPayload> {
  constructor(payload: TenantActivatedPayload, aggregateId: UniqueEntityID) {
    super({
      eventName: "tenant.activated",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
