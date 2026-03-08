import { randomUUID } from "node:crypto";
import { Entity, Index, PrimaryKey, Property } from "@mikro-orm/core";

@Entity()
@Index({ properties: ["aggregateId", "version"] })
export class DomainEventEntity {
  @PrimaryKey()
  id: string = randomUUID();

  @Property()
  @Index()
  eventType: string;

  @Property()
  @Index()
  aggregateId: string;

  @Property()
  aggregateType: string;

  @Property()
  version: number;

  @Property({ type: "json" })
  payload: Record<string, unknown>;

  @Property({ type: "json" })
  metadata: {
    tenantId?: string;
    userId?: string;
    correlationId?: string;
    timestamp: string;
  };

  @Property()
  createdAt: Date = new Date();

  constructor(
    eventType: string,
    aggregateId: string,
    aggregateType: string,
    version: number,
    payload: Record<string, unknown>,
    metadata: {
      tenantId?: string;
      userId?: string;
      correlationId?: string;
      timestamp: string;
    }
  ) {
    this.eventType = eventType;
    this.aggregateId = aggregateId;
    this.aggregateType = aggregateType;
    this.version = version;
    this.payload = payload;
    this.metadata = metadata;
  }
}
