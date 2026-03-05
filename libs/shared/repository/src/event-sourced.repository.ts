import type { EntityManager } from "@mikro-orm/core";
import type { EventStore } from "@oksai/event-store";
import type { AggregateRoot } from "@oksai/kernel";

export abstract class EventSourcedRepository<T extends AggregateRoot<any>> {
  constructor(
    protected em: EntityManager,
    protected eventStore: EventStore,
    protected entityClass: new (...args: any[]) => T
  ) {}

  async save(aggregate: T): Promise<void> {
    this.em.persist(aggregate);

    const events = aggregate.domainEvents;
    for (const event of events) {
      await this.eventStore.append(event as any);
    }

    aggregate.clearDomainEvents();
  }

  async findById(id: string): Promise<T | null> {
    const aggregate = await this.em.findOne(this.entityClass, { id });

    if (!aggregate) {
      return null;
    }

    return aggregate;
  }
}
