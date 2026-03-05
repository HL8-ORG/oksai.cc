import type { EntityManager, QueryOrderMap } from "@mikro-orm/core";
import { DomainEventEntity } from "@oksai/database";
import type { DomainEvent, EventStore } from "./types";

export class MikroOrmEventStore implements EventStore {
  constructor(private em: EntityManager) {}

  async append(event: DomainEvent): Promise<void> {
    const eventEntity = this.em.create(DomainEventEntity, {
      id: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      version: event.version,
      payload: event.payload as Record<string, unknown>,
      metadata: event.metadata,
      createdAt: new Date(),
    });

    this.em.persist(eventEntity);
  }

  async load(aggregateId: string): Promise<DomainEvent[]> {
    const entities = await this.em.find(
      DomainEventEntity,
      { aggregateId },
      { orderBy: { version: "ASC" } as QueryOrderMap<DomainEventEntity> }
    );

    return entities.map((entity) => this.toDomainEvent(entity));
  }

  async loadFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]> {
    const entities = await this.em.find(
      DomainEventEntity,
      { aggregateId, version: { $gt: version } },
      { orderBy: { version: "ASC" } as QueryOrderMap<DomainEventEntity> }
    );

    return entities.map((entity) => this.toDomainEvent(entity));
  }

  private toDomainEvent(entity: DomainEventEntity): DomainEvent {
    return {
      eventId: entity.id,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      version: entity.version,
      payload: entity.payload,
      metadata: entity.metadata,
    };
  }
}
