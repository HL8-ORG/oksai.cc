/**
 * 租户创建事件
 *
 * 当新租户被创建时触发。
 */
import { DomainEvent, UniqueEntityID } from "@oksai/kernel";

/**
 * 租户创建事件负载
 */
export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  slug: string;
  plan: string;
  ownerId: string;
}

/**
 * 租户创建事件
 */
export class TenantCreatedEvent extends DomainEvent<TenantCreatedPayload> {
  constructor(payload: TenantCreatedPayload, aggregateId: UniqueEntityID) {
    super({
      eventName: "tenant.created",
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}
