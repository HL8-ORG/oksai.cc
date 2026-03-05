export interface DomainEvent<T = unknown> {
  eventId: string;
  eventType: string;
  aggregateId: string;
  aggregateType: string;
  version: number;
  payload: T;
  metadata: {
    tenantId?: string;
    userId?: string;
    correlationId?: string;
    timestamp: string;
  };
}

export interface EventStore {
  append(event: DomainEvent): Promise<void>;
  load(aggregateId: string): Promise<DomainEvent[]>;
  loadFromVersion(aggregateId: string, version: number): Promise<DomainEvent[]>;
}
