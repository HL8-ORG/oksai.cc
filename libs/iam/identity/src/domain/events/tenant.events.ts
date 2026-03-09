import type { UniqueEntityID } from "@oksai/domain-core";

export interface TenantCreatedPayload {
  tenantId: string;
  name: string;
  plan: string;
}

export interface TenantUpdatedPayload {
  tenantId: string;
  updates: Record<string, unknown>;
}

export interface TenantActivatedPayload {
  tenantId: string;
  activatedAt: Date;
}

export interface DomainEventData<T> {
  eventId: string;
  eventName: string;
  aggregateId: UniqueEntityID;
  occurredAt: Date;
  payload: T;
  eventVersion: number;
}

export class TenantCreatedEvent {
  public readonly eventId: string;
  public readonly eventName = "TenantCreated";
  public readonly aggregateId: UniqueEntityID;
  public readonly occurredAt: Date;
  public readonly payload: TenantCreatedPayload;
  public readonly eventVersion = 1;

  constructor(aggregateId: UniqueEntityID, payload: TenantCreatedPayload) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = payload;
  }
}

export class TenantUpdatedEvent {
  public readonly eventId: string;
  public readonly eventName = "TenantUpdated";
  public readonly aggregateId: UniqueEntityID;
  public readonly occurredAt: Date;
  public readonly payload: TenantUpdatedPayload;
  public readonly eventVersion = 1;

  constructor(aggregateId: UniqueEntityID, payload: TenantUpdatedPayload) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = payload;
  }
}

export class TenantActivatedEvent {
  public readonly eventId: string;
  public readonly eventName = "TenantActivated";
  public readonly aggregateId: UniqueEntityID;
  public readonly occurredAt: Date;
  public readonly payload: TenantActivatedPayload;
  public readonly eventVersion = 1;

  constructor(aggregateId: UniqueEntityID, payload: TenantActivatedPayload) {
    this.eventId = `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    this.aggregateId = aggregateId;
    this.occurredAt = new Date();
    this.payload = payload;
  }
}
